import { Worker, Job } from "bullmq";
import type { Config } from "../config";
import { ReportStore } from "../db/ReportStore";
import { logger } from "../logger";
import { getRedisConnection, QUEUE_NAMES } from "./QueueManager";

export interface IngestJobPayload {
  sourceId: string;
  sourceName: string;
  category: string;
  items: Array<{
    title: string;
    content: string;
    link: string;
    pubDate: string;
  }>;
}

export class IngestWorker {
  private worker: Worker;
  private reportStore: ReportStore;

  constructor(private readonly config: Config) {
    this.reportStore = new ReportStore(config.dataDirPath);
    this.worker = new Worker(
      QUEUE_NAMES.INGEST,
      async (job: Job<IngestJobPayload>) => this.processJob(job),
      {
        connection: getRedisConnection(config),
        concurrency: 5,
        stalledInterval: 30000,
      },
    );

    this.worker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Ingest job completed");
    });

    logger.info("IngestWorker started");
  }

  private async processJob(job: Job<IngestJobPayload>): Promise<number> {
    const { sourceId, sourceName, category, items } = job.data;
    let inserted = 0;

    for (const item of items) {
      await this.reportStore.add({
        sourceId,
        sourceName,
        category,
        title: item.title,
        content: item.content,
        link: item.link,
        pubDate: item.pubDate,
      });
      inserted += 1;
    }

    return inserted;
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
