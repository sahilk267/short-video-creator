/**
 * DeadLetterWorker – Phase 4.7
 *
 * Listens on deadletter_queue.
 * Logs permanently failed jobs and marks them in the DB.
 */
import { Worker, Job } from "bullmq";
import { Config } from "../config";
import { PublishJobStore } from "../db/PublishJobStore";
import { RenderJobStore } from "../db/RenderJobStore";
import { logger } from "../logger";
import { getRedisConnection, QUEUE_NAMES } from "./QueueManager";

export interface DeadLetterPayload {
  type: "render" | "publish";
  jobId: string;
  originalQueue: string;
  failReason: string;
  attemptsMade: number;
  originalJobData: Record<string, unknown>;
}

export class DeadLetterWorker {
  private worker: Worker;
  private publishJobStore: PublishJobStore;
  private renderJobStore: RenderJobStore;

  constructor(private config: Config) {
    this.publishJobStore = new PublishJobStore(config.dataDirPath);
    this.renderJobStore = new RenderJobStore(config.dataDirPath);

    this.worker = new Worker(
      QUEUE_NAMES.DEADLETTER,
      async (job: Job<DeadLetterPayload>) => this.processJob(job),
      {
        connection: getRedisConnection(config),
        concurrency: 1,
        stalledInterval: 60000,
      },
    );

    this.worker.on("completed", (job) => {
      logger.warn(
        { deadLetterJobId: job.id, type: job.data.type, originalJobId: job.data.jobId },
        "Dead-letter job processed (permanently failed)",
      );
    });

    logger.info("DeadLetterWorker started");
  }

  private async processJob(job: Job<DeadLetterPayload>): Promise<void> {
    const { type, jobId, failReason, attemptsMade, originalJobData } = job.data;

    logger.error(
      { type, jobId, failReason, attemptsMade, originalJobData },
      "DEAD LETTER: Job permanently failed",
    );

    if (type === "render") {
      await this.renderJobStore.updateStatus(jobId, "skipped", {
        error: `DEAD LETTER after ${attemptsMade} attempts: ${failReason}`,
        attemptCount: attemptsMade,
      });
    } else if (type === "publish") {
      await this.publishJobStore.updateJobStatus(jobId, "failed", {
        error: `DEAD LETTER after ${attemptsMade} attempts: ${failReason}`,
        attemptCount: attemptsMade,
      });
    }

    // Future: send Slack/email alert here
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
