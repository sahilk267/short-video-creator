/**
 * RenderWorker – Phase 4.1 / 4.6 / 4.7
 *
 * BullMQ worker that processes render_queue jobs.
 * Concurrency = 1 (one render at a time, memory-safe).
 * Retries up to 2 times on failure, then marks job as skipped.
 */
import { Worker, Job } from "bullmq";
import { Config } from "../config";
import { ShortCreator } from "../short-creator/ShortCreator";
import { RenderJobStore } from "../db/RenderJobStore";
import { logger } from "../logger";
import { getRedisConnection, QUEUE_NAMES } from "./QueueManager";
import type { OrientationEnum, SceneInput, RenderConfig } from "../types/shorts";

export interface RenderJobPayload {
  renderJobId: string;
  scriptPlanId: string;
  sceneInput: SceneInput[];
  config: RenderConfig;
  videoType: "short" | "long";
  subtitleLanguage?: string;
  orientation: OrientationEnum;
  category: string;
  namingKey: string;
}

export class RenderWorker {
  private worker: Worker;
  private renderJobStore: RenderJobStore;

  constructor(
    private config: Config,
    private shortCreator: ShortCreator,
  ) {
    this.renderJobStore = new RenderJobStore(config.dataDirPath);

    const renderConcurrency = Math.max(1, this.config.renderWorkerConcurrency || 1);
    // Phase 4.9: configurable worker scaling
    this.worker = new Worker(
      QUEUE_NAMES.RENDER,
      async (job: Job<RenderJobPayload>) => this.processJob(job),
      {
        connection: getRedisConnection(config),
        concurrency: renderConcurrency,
        stalledInterval: 30000,
      },
    );

    this.worker.on("completed", (job) => {
      logger.info({ jobId: job.id, renderJobId: job.data.renderJobId }, "Render job completed");
    });

    this.worker.on("failed", async (job, err) => {
      if (!job) return;
      const { renderJobId } = job.data;
      const maxAttempts = 2;

      await this.renderJobStore.incrementAttempt(renderJobId);
      const record = await this.renderJobStore.get(renderJobId);
      const attempts = record?.attemptCount ?? 0;

      if (attempts >= maxAttempts) {
        // Phase 4.5: push hard failures into dead-letter queue for visibility
        const { createQueue } = await import("./QueueManager.js");
        const deadletter = createQueue(QUEUE_NAMES.DEADLETTER, this.config);
        await deadletter.add("render-deadletter", {
          type: "render",
          jobId: renderJobId,
          originalQueue: QUEUE_NAMES.RENDER,
          failReason: err.message,
          attemptsMade: attempts,
          originalJobData: job.data,
        });

        // Mark as skipped after max retries – do NOT block queue
        await this.renderJobStore.updateStatus(renderJobId, "skipped", {
          error: `Max retries (${maxAttempts}) exceeded: ${err.message}`,
        });
        logger.warn(
          { jobId: job.id, renderJobId, attempts },
          "Render job skipped after max retries",
        );
      } else {
        await this.renderJobStore.updateStatus(renderJobId, "failed", {
          error: err.message,
          attemptCount: attempts,
        });
        logger.error(
          { jobId: job.id, renderJobId, attempts, err: err.message },
          "Render job failed, will retry",
        );
      }
    });

    logger.info("RenderWorker started (concurrency=1)");
  }

  private async processJob(job: Job<RenderJobPayload>): Promise<void> {
    const {
      renderJobId,
      sceneInput,
      config,
      videoType,
      subtitleLanguage,
      orientation,
      namingKey,
    } = job.data;

    logger.info(
      { jobId: job.id, renderJobId, videoType, namingKey },
      "RenderWorker processing job",
    );

    await this.renderJobStore.updateStatus(renderJobId, "processing");

    // Update job progress
    await job.updateProgress(5);

    const videoId = this.shortCreator.addToQueue(
      sceneInput,
      config,
      videoType,
      subtitleLanguage,
    );

    // Poll until the short creator finishes this video
    await new Promise<void>((resolve, reject) => {
      const interval = setInterval(async () => {
        const status = this.shortCreator.status(videoId);
        if (status === "ready") {
          clearInterval(interval);
          resolve();
        } else if (status === "failed") {
          clearInterval(interval);
          reject(new Error(`ShortCreator reported failed for videoId ${videoId}`));
        }
      }, 3000);
    });

    const outputPath = this.shortCreator.getVideoPath(videoId);

    await this.renderJobStore.updateStatus(renderJobId, "ready", {
      outputPath,
    });

    await this.renderJobStore.updateStatus(renderJobId, "rendered", {
      outputPath,
    });

    await job.updateProgress(100);
    logger.info({ renderJobId, outputPath }, "Render job finished");
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
