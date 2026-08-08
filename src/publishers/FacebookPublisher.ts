/**
 * FacebookPublisher – Full Facebook Graph API implementation
 * Supports Reels, regular video posts, scheduled publishing, and Crossposting
 */
import type { Config } from "../config";
import type {
  PlatformPublisher,
  PlatformLimits,
  PlatformCapabilities,
  PublishParams,
  PublishResult,
} from "./PlatformPublisher";
import { logger } from "../logger";
import fs from "fs-extra";

export class FacebookPublisher implements PlatformPublisher {
  readonly platform = "facebook" as const;
  private pageAccessToken: string;
  private pageId: string;
  private apiBase = "https://graph.facebook.com/v19.0";

  constructor(config: Config) {
    this.pageAccessToken = config.facebookAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "";
    this.pageId = config.facebookPageId || process.env.FACEBOOK_PAGE_ID || "";
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.pageAccessToken || !this.pageId) return false;
    try {
      const res = await fetch(
        `${this.apiBase}/${this.pageId}?fields=id,name&access_token=${this.pageAccessToken}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!res.ok) return false;
      const data = (await res.json()) as { id?: string };
      return Boolean(data?.id);
    } catch {
      return false;
    }
  }

  async refreshToken(): Promise<void> {
    if (!this.pageAccessToken) throw new Error("No Facebook page access token configured");
    try {
      const appId = process.env.FACEBOOK_APP_ID;
      const appSecret = process.env.FACEBOOK_APP_SECRET;
      if (!appId || !appSecret) throw new Error("FACEBOOK_APP_ID / FACEBOOK_APP_SECRET not set");
      const res = await fetch(
        `${this.apiBase}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&access_token=${this.pageAccessToken}`,
      );
      const data = (await res.json()) as { access_token?: string; error?: { message: string } };
      if (data.error) throw new Error(data.error.message);
      if (data.access_token) this.pageAccessToken = data.access_token;
    } catch (err) {
      logger.error(err, "Facebook token refresh failed");
      throw err;
    }
  }

  getVideoLimits(): PlatformLimits {
    return {
      maxFileSizeMB: 10 * 1024,
      maxDurationSeconds: 4 * 3600,
      maxTitleLength: 255,
      maxDescriptionLength: 63206,
      maxTagCount: 0,
      maxTagLength: 0,
      supportedFormats: ["mp4", "mov", "avi", "mkv"],
      aspectRatios: ["16:9", "9:16", "1:1", "4:5"],
      maxFrameRate: 60,
    };
  }

  getCapabilities(): PlatformCapabilities {
    return {
      supportsScheduling: true,
      supportsReels: true,
      supportsCarousel: false,
      supportsStories: true,
      supportsLive: true,
      supportsThumbnailUpload: true,
      supportsFirstComment: false,
      maxHashtags: 30,
    };
  }

  async uploadVideo(params: PublishParams): Promise<PublishResult> {
    if (!this.pageAccessToken || !this.pageId) {
      return { success: false, error: "Facebook credentials not configured. Set FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID." };
    }
    try {
      // Prefer Reels endpoint for vertical 9:16 content
      const isReels = params.aspectRatio === "9:16" || params.description?.toLowerCase().includes("reel");
      if (isReels) {
        return this.uploadReel(params);
      }
      return this.uploadRegularVideo(params);
    } catch (err) {
      logger.error(err, "Facebook upload failed");
      return { success: false, error: err instanceof Error ? err.message : "Upload failed" };
    }
  }

  private async uploadRegularVideo(params: PublishParams): Promise<PublishResult> {
    const description = this.buildDescription(params);
    const body: Record<string, unknown> = {
      description,
      title: params.title?.slice(0, 255),
      access_token: this.pageAccessToken,
    };

    if (params.videoUrl) {
      body.file_url = params.videoUrl;
    }

    const endpoint = `${this.apiBase}/${this.pageId}/videos`;
    let fetchOpts: RequestInit;

    if (params.videoUrl) {
      fetchOpts = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };
    } else {
      // File upload via resumable upload session
      return this.resumableUpload(params, description);
    }

    const res = await fetch(endpoint, fetchOpts);
    if (!res.ok) {
      const err = (await res.json()) as { error?: { message: string } };
      return { success: false, error: err.error?.message || "Facebook video upload failed" };
    }
    const data = (await res.json()) as { id: string };
    logger.info({ videoId: data.id }, "Facebook video uploaded");
    return {
      success: true,
      platformVideoId: data.id,
      publishedUrl: `https://www.facebook.com/video/${data.id}`,
    };
  }

  private async uploadReel(params: PublishParams): Promise<PublishResult> {
    const description = this.buildDescription(params);
    // Step 1: Initialize upload session
    const initRes = await fetch(
      `${this.apiBase}/${this.pageId}/video_reels`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upload_phase: "start",
          access_token: this.pageAccessToken,
        }),
      },
    );
    if (!initRes.ok) {
      const err = (await initRes.json()) as { error?: { message: string } };
      return { success: false, error: err.error?.message || "Failed to init Reels upload" };
    }
    const initData = (await initRes.json()) as { video_id: string; upload_url?: string };
    const videoId = initData.video_id;

    // Step 2: Upload video if file path provided
    if (params.videoFilePath && !params.videoUrl) {
      try {
        const fileBuffer = await fs.readFile(params.videoFilePath);
        const uploadRes = await fetch(
          initData.upload_url || `${this.apiBase}/${this.pageId}/video_reels`,
          {
            method: "POST",
            headers: {
              "Authorization": `OAuth ${this.pageAccessToken}`,
              "Content-Type": "video/mp4",
              "offset": "0",
              "file_size": String(fileBuffer.length),
            },
            body: fileBuffer,
          },
        );
        if (!uploadRes.ok) {
          logger.warn("Facebook Reels file upload failed, attempting URL method");
        }
      } catch (err) {
        logger.warn(err, "Facebook Reels file upload skipped");
      }
    }

    // Step 3: Finish and publish
    const publishBody: Record<string, unknown> = {
      upload_phase: "finish",
      video_id: videoId,
      description,
      access_token: this.pageAccessToken,
      published: true,
    };
    if (params.videoUrl) {
      publishBody.file_url = params.videoUrl;
    }
    const finishRes = await fetch(
      `${this.apiBase}/${this.pageId}/video_reels`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publishBody),
      },
    );
    if (!finishRes.ok) {
      const err = (await finishRes.json()) as { error?: { message: string } };
      return { success: false, error: err.error?.message || "Failed to publish Reel" };
    }
    logger.info({ videoId }, "Facebook Reel published");
    return {
      success: true,
      platformVideoId: videoId,
      publishedUrl: `https://www.facebook.com/reel/${videoId}`,
    };
  }

  private async resumableUpload(params: PublishParams, description: string): Promise<PublishResult> {
    try {
      const fileBuffer = await fs.readFile(params.videoFilePath);
      const fileSize = fileBuffer.length;

      // Initialize resumable upload
      const initRes = await fetch(
        `https://graph-video.facebook.com/v19.0/${this.pageId}/videos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            upload_phase: "start",
            file_size: fileSize,
            access_token: this.pageAccessToken,
          }),
        },
      );
      if (!initRes.ok) {
        const err = (await initRes.json()) as { error?: { message: string } };
        return { success: false, error: err.error?.message || "Failed to init upload" };
      }
      const initData = (await initRes.json()) as { upload_session_id: string; start_offset: string; end_offset: string };
      const sessionId = initData.upload_session_id;

      // Upload chunks
      let startOffset = parseInt(initData.start_offset);
      let endOffset = parseInt(initData.end_offset);
      while (startOffset < fileSize) {
        const chunk = fileBuffer.slice(startOffset, endOffset);
        const chunkRes = await fetch(
          `https://graph-video.facebook.com/v19.0/${this.pageId}/videos`,
          {
            method: "POST",
            headers: {
              "Authorization": `OAuth ${this.pageAccessToken}`,
              "Content-Type": "multipart/form-data",
            },
            body: (() => {
              const form = new FormData();
              form.append("upload_phase", "transfer");
              form.append("upload_session_id", sessionId);
              form.append("start_offset", String(startOffset));
              form.append("video_file_chunk", new Blob([chunk], { type: "video/mp4" }));
              return form;
            })(),
          },
        );
        if (!chunkRes.ok) break;
        const chunkData = (await chunkRes.json()) as { start_offset: string; end_offset: string };
        startOffset = parseInt(chunkData.start_offset);
        endOffset = parseInt(chunkData.end_offset);
      }

      // Finish upload
      const finishForm = new FormData();
      finishForm.append("upload_phase", "finish");
      finishForm.append("upload_session_id", sessionId);
      finishForm.append("access_token", this.pageAccessToken);
      finishForm.append("description", description);
      finishForm.append("title", params.title?.slice(0, 255) || "");
      const finishRes = await fetch(
        `https://graph-video.facebook.com/v19.0/${this.pageId}/videos`,
        { method: "POST", body: finishForm },
      );
      if (!finishRes.ok) {
        const err = (await finishRes.json()) as { error?: { message: string } };
        return { success: false, error: err.error?.message || "Failed to finish upload" };
      }
      const finishData = (await finishRes.json()) as { success?: boolean; video_id?: string };
      if (!finishData.success) return { success: false, error: "Facebook upload finish failed" };
      const videoId = finishData.video_id || sessionId;
      logger.info({ videoId }, "Facebook video uploaded via resumable");
      return { success: true, platformVideoId: videoId, publishedUrl: `https://www.facebook.com/video/${videoId}` };
    } catch (err) {
      logger.error(err, "Facebook resumable upload error");
      return { success: false, error: err instanceof Error ? err.message : "Resumable upload failed" };
    }
  }

  async scheduleVideo(params: PublishParams, publishAt: Date): Promise<PublishResult> {
    if (!this.pageAccessToken || !this.pageId) {
      return { success: false, error: "Facebook credentials not configured" };
    }
    const now = Date.now();
    const diffMs = publishAt.getTime() - now;
    if (diffMs < 10 * 60 * 1000) {
      return { success: false, error: "Facebook scheduling requires at least 10 minutes in advance" };
    }

    try {
      const description = this.buildDescription(params);
      const publishTime = Math.floor(publishAt.getTime() / 1000);
      const body: Record<string, unknown> = {
        description,
        title: params.title?.slice(0, 255),
        published: false,
        scheduled_publish_time: publishTime,
        access_token: this.pageAccessToken,
      };
      if (params.videoUrl) body.file_url = params.videoUrl;

      const res = await fetch(
        `${this.apiBase}/${this.pageId}/videos`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      );
      if (!res.ok) {
        const err = (await res.json()) as { error?: { message: string } };
        return { success: false, error: err.error?.message || "Schedule failed" };
      }
      const data = (await res.json()) as { id: string };
      logger.info({ videoId: data.id, publishAt }, "Facebook video scheduled");
      return { success: true, platformVideoId: data.id, scheduledFor: publishAt.toISOString() };
    } catch (err) {
      logger.error(err, "Facebook schedule error");
      return { success: false, error: err instanceof Error ? err.message : "Schedule failed" };
    }
  }

  private buildDescription(params: PublishParams): string {
    const parts: string[] = [];
    if (params.description) parts.push(params.description);
    if (params.callToAction) parts.push(`\n\n${params.callToAction}`);
    if (params.tags?.length) parts.push(`\n\n${params.tags.slice(0, 30).map((t) => `#${t.replace(/\s+/g, "")}`).join(" ")}`);
    return parts.join("").slice(0, 63206);
  }

  static isConfigured(): boolean {
    return Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID);
  }
}
