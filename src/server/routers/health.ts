/**
 * HealthRouter – Phase 4.4
 *
 * GET  /api/health        – liveness + readiness
 * GET  /api/health/queue  – BullMQ queue sizes
 * GET  /api/metrics       – Prometheus text output
 */
import { Router } from "express";
import type { Request, Response } from "express";
import os from "node:os";
import type { Config } from "../../config";
import { createRenderQueue, createPublishQueue, testRedisConnection } from "../../workers/QueueManager";
import { logger } from "../../logger";
import { RenderJobStore } from "../../db/RenderJobStore";
import { PublishJobStore } from "../../db/PublishJobStore";

export class HealthRouter {
  public router: Router;
  private startedAt = Date.now();
  private renderJobStore: RenderJobStore;
  private publishJobStore: PublishJobStore;

  constructor(private config: Config) {
    this.router = Router();
    this.renderJobStore = new RenderJobStore(config.dataDirPath);
    this.publishJobStore = new PublishJobStore(config.dataDirPath);
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.get("/", (req: Request, res: Response) => this.getHealth(req, res));
    this.router.get("/queue", (req: Request, res: Response) => this.getQueueStats(req, res));
    this.router.get("/queue/states", (req: Request, res: Response) => this.getQueueStates(req, res));
    this.router.get("/metrics", (req: Request, res: Response) => this.getMetrics(req, res));
  }

  private async getHealth(_req: Request, res: Response): Promise<void> {
    const redisOk = this.config.redisEnabled
      ? await testRedisConnection(this.config).catch(() => false)
      : null;

    const uptimeSeconds = Math.floor((Date.now() - this.startedAt) / 1000);
    const freeMb = Math.floor(os.freemem() / 1024 / 1024);
    const totalMb = Math.floor(os.totalmem() / 1024 / 1024);

    const healthy = !this.config.redisEnabled || redisOk === true;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? "ok" : "degraded",
      uptime: uptimeSeconds,
      redis: this.config.redisEnabled ? (redisOk ? "ok" : "error") : "disabled",
      memory: { freeMb, totalMb, usedPercent: Math.round((1 - freeMb / totalMb) * 100) },
      version: process.env.npm_package_version ?? "unknown",
    });
  }

  private async getQueueStats(_req: Request, res: Response): Promise<void> {
    if (!this.config.redisEnabled) {
      res.json({ redis: "disabled", queues: {} });
      return;
    }
    try {
      const renderQueue = createRenderQueue(this.config);
      const publishQueue = createPublishQueue(this.config);

      const [renderCounts, publishCounts] = await Promise.all([
        renderQueue.getJobCounts("active", "waiting", "completed", "failed", "delayed", "paused"),
        publishQueue.getJobCounts("active", "waiting", "completed", "failed", "delayed", "paused"),
      ]);

      res.json({
        render: renderCounts,
        publish: publishCounts,
      });
    } catch (err: any) {
      logger.error({ err: err.message }, "Failed to fetch queue stats");
      res.status(500).json({ error: err.message });
    }
  }

  private async getQueueStates(_req: Request, res: Response): Promise<void> {
    try {
      const [renderJobs, publishJobs] = await Promise.all([
        this.renderJobStore.list(),
        this.publishJobStore.listJobs(),
      ]);

      const summarize = (records: Array<{ status: string }>) =>
        records.reduce<Record<string, number>>((acc, record) => {
          acc[record.status] = (acc[record.status] ?? 0) + 1;
          return acc;
        }, {});

      res.json({
        renderStates: summarize(renderJobs),
        publishStates: summarize(publishJobs),
      });
    } catch (err: any) {
      logger.error({ err: err.message }, "Failed to fetch queue state visibility");
      res.status(500).json({ error: err.message });
    }
  }

  private async getMetrics(_req: Request, res: Response): Promise<void> {
    const uptimeSeconds = Math.floor((Date.now() - this.startedAt) / 1000);
    const freeMb = Math.floor(os.freemem() / 1024 / 1024);
    const totalMb = Math.floor(os.totalmem() / 1024 / 1024);
    const usedMem = process.memoryUsage();

    const lines = [
      `# HELP process_uptime_seconds Process uptime in seconds`,
      `process_uptime_seconds ${uptimeSeconds}`,
      `# HELP node_heap_used_bytes Heap memory used`,
      `node_heap_used_bytes ${usedMem.heapUsed}`,
      `# HELP node_heap_total_bytes Total heap allocated`,
      `node_heap_total_bytes ${usedMem.heapTotal}`,
      `# HELP os_free_memory_bytes OS free memory`,
      `os_free_memory_bytes ${freeMb * 1024 * 1024}`,
      `# HELP os_total_memory_bytes OS total memory`,
      `os_total_memory_bytes ${totalMb * 1024 * 1024}`,
    ];

    res.setHeader("Content-Type", "text/plain; version=0.0.4");
    res.send(lines.join("\n") + "\n");
  }
}
