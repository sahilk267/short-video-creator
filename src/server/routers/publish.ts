/**
 * PublishRouter – Phase 5.5
 *
 * POST /api/publish          – enqueue a video for publishing
 * POST /api/publish/enqueue  – UI-friendly bulk publish bridge
 * GET  /api/publish/:id      – get publish job status + attempts
 * GET  /api/publish          – list recent publish jobs
 */
import { Router } from "express";
import type { Request, Response } from "express";
import fs from "fs-extra";
import path from "path";
import type { Config } from "../../config";
import { PublishJobStore } from "../../db/PublishJobStore";
import { VideoMetadataStore } from "../../db/VideoMetadataStore";
import { createPublishQueue } from "../../workers/QueueManager";
import { logger } from "../../logger";
import type { PlatformType, PublishJobRecord } from "../../types/shorts";
import type { PublishJobPayload } from "../../workers/PublishWorker";
import { validatePublishPayload } from "../../publishers/PlatformLimits";
import { MetadataGenerator } from "../../services/MetadataGenerator";

const ALLOWED_PLATFORMS: PlatformType[] = ["youtube", "telegram", "instagram", "facebook"];

type CreatePublishParams = Partial<PublishJobPayload> & {
  renderOutputPath?: string;
  platform?: PlatformType;
  channelId?: string;
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  language?: string;
  thumbnailPath?: string;
  scheduleAt?: string | Date;
};

export class PublishRouter {
  public router: Router;
  private publishJobStore: PublishJobStore;
  private videoMetadataStore: VideoMetadataStore;
  private metadataGenerator: MetadataGenerator;

  constructor(private config: Config) {
    this.router = Router();
    this.publishJobStore = new PublishJobStore(config.dataDirPath);
    this.videoMetadataStore = new VideoMetadataStore(config.dataDirPath);
    this.metadataGenerator = new MetadataGenerator(config);
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.use(express_json_middleware());
    this.router.post("/enqueue", (req: Request, res: Response) => this.enqueueFromUi(req, res));
    this.router.post("/", (req: Request, res: Response) => this.createPublishJob(req, res));
    this.router.post("/metadata-suggestions", (req: Request, res: Response) => this.getMetadataSuggestions(req, res));
    this.router.get("/", (req: Request, res: Response) => this.listPublishJobs(req, res));
    this.router.get("/:id", (req: Request, res: Response) => this.getPublishJob(req, res));
  }

  private async getMetadataSuggestions(req: Request, res: Response): Promise<void> {
    const { videoId, platform, language = "en" } = req.body as {
      videoId?: string;
      platform?: PlatformType;
      language?: string;
    };

    if (!videoId) {
      res.status(400).json({ error: "videoId is required" });
      return;
    }
    if (!platform || !ALLOWED_PLATFORMS.includes(platform)) {
      res.status(400).json({ error: `platform must be one of: ${ALLOWED_PLATFORMS.join(", ")}` });
      return;
    }

    const record = await this.videoMetadataStore.get(videoId);
    if (!record) {
      res.status(404).json({ error: "Video metadata not found" });
      return;
    }

    const generated = await this.metadataGenerator.generate(
      platform,
      record.topic,
      record.summary,
      language,
      {
        keywords: record.keywords,
        subcategory: record.subcategory,
        category: record.category,
        headlines: record.headlines,
      },
    );

    res.json({
      videoId,
      platform,
      metadata: generated,
      source: {
        topic: record.topic,
        category: record.category,
        subcategory: record.subcategory,
        keywords: record.keywords,
        headlines: record.headlines,
      },
    });
  }

  private async enqueueFromUi(req: Request, res: Response): Promise<void> {
    const {
      videoIds = [],
      platforms = [],
      metadata = {},
      publishImmediately = true,
      scheduledDateTime,
    } = req.body as {
      videoIds?: string[];
      platforms?: PlatformType[];
      metadata?: Record<string, any>;
      publishImmediately?: boolean;
      scheduledDateTime?: string;
    };

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      res.status(400).json({ error: "videoIds is required" });
      return;
    }
    if (!Array.isArray(platforms) || platforms.length === 0) {
      res.status(400).json({ error: "platforms is required" });
      return;
    }

    try {
      const jobs: PublishJobRecord[] = [];
      for (const videoId of videoIds) {
        const renderOutputPath = path.join(this.config.dataDirPath, "videos", `${videoId}.mp4`);
        if (!fs.existsSync(renderOutputPath)) {
          throw new HttpError(404, `Video file not found for ${videoId}`);
        }

        const savedMetadata = await this.videoMetadataStore.get(videoId);

        for (const platform of platforms) {
          const platformMetadata = metadata[platform] ?? {};
          const title = platformMetadata.title
            ?? savedMetadata?.topic
            ?? `Video ${videoId}`;
          const description = platformMetadata.description
            ?? platformMetadata.caption
            ?? savedMetadata?.summary
            ?? "";
          const rawTags = platformMetadata.tags ?? platformMetadata.hashtags ?? [];
          const tags = Array.isArray(rawTags)
            ? rawTags
            : String(rawTags).split(/\s+/).filter(Boolean);

          const job = await this.createPublishJobInternal({
            renderOutputPath,
            platform,
            channelId: `${platform}-default`,
            title,
            description,
            tags,
            category: savedMetadata?.category ?? "General",
            language: "en",
            scheduleAt: publishImmediately ? undefined : scheduledDateTime,
          });
          jobs.push(job);
        }
      }

      res.status(201).json({
        jobIds: jobs.map((job) => job.id),
        status: "queued",
        totalJobs: jobs.length,
      });
    } catch (error) {
      this.sendPublishError(res, error);
    }
  }

  private async createPublishJob(req: Request, res: Response): Promise<void> {
    try {
      const job = await this.createPublishJobInternal(req.body as CreatePublishParams);
      res.status(201).json({ publishJobId: job.id, status: job.status });
    } catch (error) {
      this.sendPublishError(res, error);
    }
  }

  private async createPublishJobInternal(params: CreatePublishParams): Promise<PublishJobRecord> {
    const {
      renderOutputPath,
      platform,
      channelId,
      title,
      description = "",
      tags = [],
      category = "General",
      language = "en",
      thumbnailPath,
      scheduleAt,
    } = params;

    if (!renderOutputPath || typeof renderOutputPath !== "string") {
      throw new HttpError(400, "renderOutputPath is required");
    }
    if (!platform || !ALLOWED_PLATFORMS.includes(platform as PlatformType)) {
      throw new HttpError(400, `platform must be one of: ${ALLOWED_PLATFORMS.join(", ")}`);
    }
    if (!channelId || typeof channelId !== "string") {
      throw new HttpError(400, "channelId is required");
    }
    if (!title || typeof title !== "string") {
      throw new HttpError(400, "title is required");
    }

    const duplicate = await this.publishJobStore.findDuplicate(renderOutputPath, platform as PlatformType);
    if (duplicate && duplicate.status === "published") {
      throw new HttpError(409, "Video already published to this platform", { jobId: duplicate.id });
    }

    const normalizedScheduleAt = scheduleAt
      ? new Date(scheduleAt).toISOString()
      : undefined;

    if (this.config.redisEnabled) {
      const payloadValidation = validatePublishPayload(platform as PlatformType, {
        videoFilePath: renderOutputPath,
        title,
        description,
        tags,
        category,
        language,
        thumbnailPath,
        scheduleAt: normalizedScheduleAt ? new Date(normalizedScheduleAt) : undefined,
      });
      if (!payloadValidation.valid) {
        throw new HttpError(400, "Publish payload violates platform limits", {
          details: payloadValidation.errors,
        });
      }
    }

    const job = await this.publishJobStore.createJob({
      renderOutputPath,
      platform: platform as PlatformType,
      channelId,
      title,
      description,
      tags,
      category,
      language,
      thumbnailPath,
      scheduleAt: normalizedScheduleAt,
    });

    if (this.config.redisEnabled) {
      const publishQueue = createPublishQueue(this.config);
      const payload: PublishJobPayload = {
        publishJobId: job.id,
        renderOutputPath,
        platform: platform as PlatformType,
        channelId,
        title,
        description,
        tags,
        category,
        language,
        thumbnailPath,
        scheduleAt: normalizedScheduleAt,
      };
      await publishQueue.add("publish", payload, { jobId: job.id });
      logger.info({ publishJobId: job.id, platform }, "Publish job enqueued via BullMQ");
    } else {
      logger.warn({ publishJobId: job.id }, "Redis disabled – publish job saved to DB but not enqueued");
    }

    return job;
  }

  private async listPublishJobs(req: Request, res: Response): Promise<void> {
    const status = req.query["status"] as string | undefined;
    const jobs = status
      ? await this.publishJobStore.listJobsByStatus(status as any)
      : await this.publishJobStore.listJobs();
    res.json(jobs);
  }

  private async getPublishJob(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const job = await this.publishJobStore.getJob(id);
    if (!job) {
      res.status(404).json({ error: "Publish job not found" });
      return;
    }
    const attempts = await this.publishJobStore.getAttempts(id);
    res.json({ ...job, attempts });
  }

  private sendPublishError(res: Response, error: unknown) {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({
        error: error.message,
        ...error.details,
      });
      return;
    }

    logger.error(error, "Failed to create publish job");
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create publish job" });
  }
}

class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

function express_json_middleware() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const express = require("express") as typeof import("express");
  return express.json();
}
