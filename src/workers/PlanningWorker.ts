import { Worker, Job } from "bullmq";
import cuid from "cuid";
import type { Config } from "../config";
import { ReportStore } from "../db/ReportStore";
import { ScriptPlanStore } from "../db/ScriptPlanStore";
import { logger } from "../logger";
import { getRedisConnection, QUEUE_NAMES } from "./QueueManager";

export interface PlanningJobPayload {
  category: string;
  maxItems?: number;
}

export class PlanningWorker {
  private worker: Worker;
  private reportStore: ReportStore;
  private scriptPlanStore: ScriptPlanStore;

  constructor(private readonly config: Config) {
    this.reportStore = new ReportStore(config.dataDirPath);
    this.scriptPlanStore = new ScriptPlanStore(config.dataDirPath);
    this.worker = new Worker(
      QUEUE_NAMES.PLANNING,
      async (job: Job<PlanningJobPayload>) => this.processJob(job),
      {
        connection: getRedisConnection(config),
        concurrency: 3,
        stalledInterval: 30000,
      },
    );

    this.worker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Planning job completed");
    });

    logger.info("PlanningWorker started");
  }

  private async processJob(job: Job<PlanningJobPayload>): Promise<string | null> {
    const reports = (await this.reportStore.list())
      .filter((report) => report.category.toLowerCase() === job.data.category.toLowerCase())
      .slice(0, job.data.maxItems ?? 5);

    if (reports.length === 0) {
      logger.warn({ category: job.data.category }, "PlanningWorker found no reports to merge");
      return null;
    }

    const plan = {
      id: cuid(),
      category: job.data.category,
      createdAt: new Date().toISOString(),
      scenes: reports.map((report) => ({
        text: report.content,
        source: report.sourceName,
        link: report.link,
        category: report.category,
        pubDate: report.pubDate,
      })),
      estimatedDurationSeconds: reports.length * 20,
    };

    await this.scriptPlanStore.add(plan);
    await Promise.all(reports.map((report) => this.reportStore.updateStatus(report.id, "merged")));
    return plan.id;
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
