import { OrientationEnum } from "./../types/shorts";
/* eslint-disable @remotion/deterministic-randomness */
import fs from "fs-extra";
import cuid from "cuid";
import path from "path";
import https from "https";
import http from "http";

import { Kokoro } from "./libraries/Kokoro";
import { Remotion } from "./libraries/Remotion";
import { Whisper } from "./libraries/Whisper";
import { FFMpeg } from "./libraries/FFmpeg";
import { PexelsAPI } from "./libraries/Pexels";
import { Config } from "../config";
import { logger } from "../logger";
import { MusicManager } from "./music";
import type {
  SceneInput,
  RenderConfig,
  Scene,
  VideoStatus,
  MusicMoodEnum,
  MusicTag,
  MusicForVideo,
} from "../types/shorts";

export class ShortCreator {
  private queue: {
    sceneInput: SceneInput[];
    config: RenderConfig;
    id: string;
  }[] = [];
  constructor(
    private config: Config,
    private remotion: Remotion,
    private kokoro: Kokoro,
    private whisper: Whisper,
    private ffmpeg: FFMpeg,
    private pexelsApi: PexelsAPI,
    private musicManager: MusicManager,
  ) {}

  public status(id: string): VideoStatus {
    const videoPath = this.getVideoPath(id);
    if (this.queue.find((item) => item.id === id)) {
      return "processing";
    }
    if (fs.existsSync(videoPath)) {
      return "ready";
    }
    return "failed";
  }

  public addToQueue(sceneInput: SceneInput[], config: RenderConfig): string {
    // todo add mutex lock
    const id = cuid();
    this.queue.push({
      sceneInput,
      config,
      id,
    });
    if (this.queue.length === 1) {
      this.processQueue();
    }
    return id;
  }

  private async processQueue(): Promise<void> {
    // todo add a semaphore
    if (this.queue.length === 0) {
      return;
    }
    const { sceneInput, config, id } = this.queue[0];
    console.log(`[ShortCreator] Starting to process video ${id} with ${sceneInput.length} scenes.`);
    logger.debug(
      { sceneInput, config, id },
      "Processing video item in the queue",
    );
    try {
      await this.createShort(id, sceneInput, config);
      console.log(`[ShortCreator] Video ${id} created successfully.`);
    } catch (error: any) {
      console.error(`[ShortCreator] Error creating video ${id}: ${error.message}`);
      logger.error(error, "Error creating video");
    } finally {
      this.queue.shift();
      this.processQueue();
    }
  }

  private async createShort(
    videoId: string,
    inputScenes: SceneInput[],
    config: RenderConfig,
  ): Promise<string> {
    logger.debug(
      {
        inputScenes,
        config,
      },
      "Creating short video",
    );
    const scenes: Scene[] = [];
    let totalDuration = 0;
    const excludeVideoIds = [];
    const tempFiles = [];

    const orientation: OrientationEnum =
      config.orientation || OrientationEnum.portrait;

    let index = 0;
    for (const scene of inputScenes) {
      const sceneNum = index + 1;
      console.log(`[ShortCreator] [Scene ${sceneNum}/${inputScenes.length}] Generating audio...`);
      const audio = await this.kokoro.generate(
        scene.text,
        config.voice ?? "af_heart",
      );
      let { audioLength } = audio;
      const { audio: audioStream } = audio;

      // add the paddingBack in seconds to the last scene
      if (index + 1 === inputScenes.length && config.paddingBack) {
        audioLength += config.paddingBack / 1000;
      }

      const tempId = cuid();
      const tempWavFileName = `${tempId}.wav`;
      const tempMp3FileName = `${tempId}.mp3`;
      const tempVideoFileName = `${tempId}.mp4`;
      const tempWavPath = path.join(this.config.tempDirPath, tempWavFileName);
      const tempMp3Path = path.join(this.config.tempDirPath, tempMp3FileName);
      const tempVideoPath = path.join(
        this.config.tempDirPath,
        tempVideoFileName,
      );
      tempFiles.push(tempVideoPath);
      tempFiles.push(tempWavPath, tempMp3Path);

      await this.ffmpeg.saveNormalizedAudio(audioStream, tempWavPath);
      
      console.log(`[ShortCreator] [Scene ${sceneNum}/${inputScenes.length}] Transcribing with Whisper...`);
      const captions = await this.whisper.CreateCaption(tempWavPath);

      await this.ffmpeg.saveToMp3(audioStream, tempMp3Path);

      const isAiImage = config.useAiImages || this.config.useAiImages;
      let mediaExt = ".mp4"; // Default generic extension, will be updated
      if (isAiImage) {
        mediaExt = ".jpg"; 
      }
      let tempMediaFileName = `${cuid()}${mediaExt}`;
      let tempMediaPath = path.join(this.config.tempDirPath, tempMediaFileName);
      tempFiles.push(tempMediaPath);

      let mediaUrl = "";
      if (isAiImage) {
        if (!this.config.pollinationsApiKey) {
          console.error(`[ShortCreator] [Scene ${sceneNum}/${inputScenes.length}] Pollinations API key is missing. Now required by Pollinations.ai. Falling back to Pexels video.`);
          logger.warn("POLLINATIONS_API_KEY is not set in environment. Falling back to stock video.");
        }
        
        // Use AI image from Pollinations.ai if key is available
        const aiPrompt = scene.visualPrompt || scene.text.slice(0, 150);
        const apiKeyParam = this.config.pollinationsApiKey ? `&key=${this.config.pollinationsApiKey}` : '';
        const pollinationsUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(aiPrompt)}?width=${orientation === OrientationEnum.landscape ? 1920 : 1080}&height=${orientation === OrientationEnum.landscape ? 1080 : 1920}&nologo=true${apiKeyParam}`;
        
        console.log(`[ShortCreator] [Scene ${sceneNum}/${inputScenes.length}] Fetching AI image: ${pollinationsUrl.replace(/key=[^&]*/, 'key=***')}`);
        try {
          await this.downloadFile(pollinationsUrl, tempMediaPath);
          mediaUrl = `http://localhost:${this.config.port}/api/tmp/${tempMediaFileName}`;
        } catch (err: any) {
          console.error(`[ShortCreator] [Scene ${sceneNum}/${inputScenes.length}] AI image failed (${pollinationsUrl}): ${err.message}. Falling back to Pexels video.`);
          logger.error(err, `Error downloading AI image for scene ${sceneNum}`);
          // If AI image fails, we fallback to Pexels video
          const video = await this.pexelsApi.findVideo(
            scene.searchTerms,
            audioLength,
            excludeVideoIds,
            orientation,
          );
          console.log(`[ShortCreator] [Scene ${sceneNum}/${inputScenes.length}] Fallback video found: ${video.url}`);
          // Delete the old .jpg temp path from the tempFiles array
          const oldIndex = tempFiles.indexOf(tempMediaPath);
          if (oldIndex > -1) {
             tempFiles.splice(oldIndex, 1);
          }
          mediaExt = ".mp4";
          tempMediaFileName = `${cuid()}${mediaExt}`;
          tempMediaPath = path.join(this.config.tempDirPath, tempMediaFileName);
          tempFiles.push(tempMediaPath);
          await this.downloadFile(video.url, tempMediaPath);
          excludeVideoIds.push(video.id);
          mediaUrl = `http://localhost:${this.config.port}/api/tmp/${tempMediaFileName}`;
        }
      } else {
        console.log(`[ShortCreator] [Scene ${sceneNum}/${inputScenes.length}] Searching Pexels for: ${scene.searchTerms.join(", ")}`);
        const video = await this.pexelsApi.findVideo(
          scene.searchTerms,
          audioLength,
          excludeVideoIds,
          orientation,
        );

        console.log(`[ShortCreator] [Scene ${sceneNum}/${inputScenes.length}] Downloading video: ${video.url}`);
        await this.downloadFile(video.url, tempMediaPath);
        excludeVideoIds.push(video.id);
        mediaUrl = `http://localhost:${this.config.port}/api/tmp/${tempMediaFileName}`;
      }

      scenes.push({
        captions,
        headline: scene.headline || scene.text.split(" ").slice(0, 5).join(" ") + "...",
        [mediaUrl.endsWith(".mp4") ? "video" : "imageUrl"]: mediaUrl,
        visualPrompt: scene.visualPrompt,
        audio: {
          url: `http://localhost:${this.config.port}/api/tmp/${tempMp3FileName}`,
          duration: audioLength,
        },
      });

      totalDuration += audioLength;
      index++;
    }
    if (config.paddingBack) {
      totalDuration += config.paddingBack / 1000;
    }

    const selectedMusic = this.findMusic(totalDuration, config.music);
    logger.debug({ selectedMusic }, "Selected music for the video");

    console.log(`[ShortCreator] Final rendering with Remotion for video ${videoId}...`);
    await this.remotion.render(
      {
        music: selectedMusic,
        scenes,
        config: {
          durationMs: totalDuration * 1000,
          paddingBack: config.paddingBack,
          ...{
            captionBackgroundColor: config.captionBackgroundColor,
            captionPosition: config.captionPosition,
          },
          musicVolume: config.musicVolume,
        },
      },
      videoId,
      orientation,
    );

    for (const file of tempFiles) {
      fs.removeSync(file);
    }

    return videoId;
  }

  public getVideoPath(videoId: string): string {
    return path.join(this.config.videosDirPath, `${videoId}.mp4`);
  }

  private async downloadFile(url: string, outputPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const fileStream = fs.createWriteStream(outputPath);
      https
        .get(url, (response: http.IncomingMessage) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            // handle redirect
            this.downloadFile(response.headers.location as string, outputPath)
              .then(resolve)
              .catch(reject);
            return;
          }
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download file: ${response.statusCode}`));
            return;
          }

          response.pipe(fileStream);

          fileStream.on("finish", () => {
            fileStream.close();
            resolve();
          });
        })
        .on("error", (err: Error) => {
          fs.unlink(outputPath, () => {});
          reject(err);
        });
    });
  }

  public deleteVideo(videoId: string): void {
    const videoPath = this.getVideoPath(videoId);
    fs.removeSync(videoPath);
    logger.debug({ videoId }, "Deleted video file");
  }

  public getVideo(videoId: string): Buffer {
    const videoPath = this.getVideoPath(videoId);
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video ${videoId} not found`);
    }
    return fs.readFileSync(videoPath);
  }

  private findMusic(videoDuration: number, tag?: MusicMoodEnum): MusicForVideo {
    const musicFiles = this.musicManager.musicList().filter((music) => {
      if (tag) {
        return music.mood === tag;
      }
      return true;
    });
    return musicFiles[Math.floor(Math.random() * musicFiles.length)];
  }

  public ListAvailableMusicTags(): MusicTag[] {
    const tags = new Set<MusicTag>();
    this.musicManager.musicList().forEach((music) => {
      tags.add(music.mood as MusicTag);
    });
    return Array.from(tags.values());
  }

  public listAllVideos(): { id: string; status: VideoStatus }[] {
    const videos: { id: string; status: VideoStatus }[] = [];

    // Check if videos directory exists
    if (!fs.existsSync(this.config.videosDirPath)) {
      return videos;
    }

    // Read all files in the videos directory
    const files = fs.readdirSync(this.config.videosDirPath);

    // Filter for MP4 files and extract video IDs
    for (const file of files) {
      if (file.endsWith(".mp4")) {
        const videoId = file.replace(".mp4", "");

        let status: VideoStatus = "ready";
        const inQueue = this.queue.find((item) => item.id === videoId);
        if (inQueue) {
          status = "processing";
        }

        videos.push({ id: videoId, status });
      }
    }

    // Add videos that are in the queue but not yet rendered
    for (const queueItem of this.queue) {
      const existingVideo = videos.find((v) => v.id === queueItem.id);
      if (!existingVideo) {
        videos.push({ id: queueItem.id, status: "processing" });
      }
    }

    return videos;
  }

  public ListAvailableVoices(): string[] {
    return this.kokoro.listAvailableVoices();
  }
}
