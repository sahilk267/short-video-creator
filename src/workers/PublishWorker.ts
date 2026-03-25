/**
 * PublishWorker – Phase 4.1 / 5.1
 *
 * BullMQ worker that processes publish_queue jobs.
 * Concurrency = 3 (different platforms can run in parallel).
 * Retries up to 2 times with exponential backoff, then deadletter.
 */
import { Worker, Job } from "bullmq";
import { Config } from "../config";
import { PublishJobStore } from "../db/PublishJobStore";
import { logger } from "../logger";
import { getRedisConnection, QUEUE_NAMES } from "./QueueManager";
import type { PlatformType } from "../types/shorts";
import { enforcePlatformMetadataLimits, validatePublishPayload } from "../publishers/PlatformLimits";

export interface PublishJobPayload {
  publishJobId: string;
  renderOutputPath: string;
  platform: PlatformType;
  channelId: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  language: string;
  thumbnailPath?: string;
  scheduleAt?: string;
}

export class PublishWorker {
  private worker: Worker;
  private publishJobStore: PublishJobStore;

  constructor(private config: Config) {
    this.publishJobStore = new PublishJobStore(config.dataDirPath);

    const publishConcurrency = Math.max(1, this.config.publishWorkerConcurrency || 3);
    // Phase 4.9: configurable worker scaling
    this.worker = new Worker(
      QUEUE_NAMES.PUBLISH,
      async (job: Job<PublishJobPayload>) => this.processJob(job),
      {
        connection: getRedisConnection(config),
        concurrency: publishConcurrency,
        stalledInterval: 30000,
      },
    );

    this.worker.on("completed", (job) => {
      logger.info(
        { jobId: job.id, publishJobId: job.data.publishJobId, platform: job.data.platform },
        "Publish job completed",
      );
    });

    this.worker.on("failed", async (job, err) => {
      if (!job) return;
      const { publishJobId } = job.data;

      await this.publishJobStore.incrementAttempt(publishJobId);
      const record = await this.publishJobStore.getJob(publishJobId);
      const attempts = record?.attemptCount ?? 0;

      if (attempts >= 2) {
        const { createQueue } = await import("./QueueManager.js");
        const deadletter = createQueue(QUEUE_NAMES.DEADLETTER, this.config);
        await deadletter.add("publish-deadletter", {
          type: "publish",
          jobId: publishJobId,
          originalQueue: QUEUE_NAMES.PUBLISH,
          failReason: err.message,
          attemptsMade: attempts,
          originalJobData: job.data,
        });

        await this.publishJobStore.updateJobStatus(publishJobId, "failed", {
          error: `Max retries exceeded: ${err.message}`,
          attemptCount: attempts,
        });
        logger.error(
          { publishJobId, platform: job.data.platform, attempts, err: err.message },
          "Publish job moved to dead-letter after max retries",
        );
      } else {
        await this.publishJobStore.updateJobStatus(publishJobId, "failed", {
          error: err.message,
          attemptCount: attempts,
        });
      }
    });

    logger.info("PublishWorker started (concurrency=3)");
  }

  private async processJob(job: Job<PublishJobPayload>): Promise<void> {
    const { publishJobId, platform, channelId } = job.data;

    logger.info({ jobId: job.id, publishJobId, platform, channelId }, "PublishWorker processing job");

    await this.publishJobStore.updateJobStatus(publishJobId, "publishing");
    await job.updateProgress(10);

    // Dynamic import of the right publisher based on platform
    try {
      const { createPublisher } = await import("../publishers/PublisherFactory.js");
      const publisher = createPublisher(platform, this.config);

      const credentialsValid = await publisher.validateCredentials();
      if (!credentialsValid) {
        throw new Error(`Publisher credentials invalid for platform: ${platform}`);
      }

      const rawParams = {
        videoFilePath: job.data.renderOutputPath,
        title: job.data.title,
        description: job.data.description,
        tags: job.data.tags,
        category: job.data.category,
        language: job.data.language,
        thumbnailPath: job.data.thumbnailPath,
        scheduleAt: job.data.scheduleAt ? new Date(job.data.scheduleAt) : undefined,
      };

      const payloadValidation = validatePublishPayload(platform, rawParams);
      if (!payloadValidation.valid) {
        throw new Error(`Platform limit validation failed: ${payloadValidation.errors.join("; ")}`);
      }

      const publishParams = enforcePlatformMetadataLimits(platform, rawParams);

      await job.updateProgress(30);

      const result = job.data.scheduleAt
        ? await publisher.scheduleVideo(publishParams, new Date(job.data.scheduleAt))
        : await publisher.uploadVideo(publishParams);

      if (!result.success) {
        throw new Error(result.error ?? "Unknown publish error");
      }

      await this.publishJobStore.updateJobStatus(publishJobId, "published", {
        externalId: result.externalId,
        publishedUrl: result.publishedUrl,
      });

      await this.publishJobStore.addAttempt({
        publishJobId,
        attemptNumber: (job.attemptsMade ?? 0) + 1,
        status: "success",
        responseBody: result.externalId,
      });

      await job.updateProgress(100);
      logger.info({ publishJobId, platform, externalId: result.externalId }, "Published successfully");

    } catch (err: any) {
      await this.publishJobStore.addAttempt({
        publishJobId,
        attemptNumber: (job.attemptsMade ?? 0) + 1,
        status: "failed",
        responseBody: err.message,
      });
      throw err; // Let BullMQ handle retry
    }
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
