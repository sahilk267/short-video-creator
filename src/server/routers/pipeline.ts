import { Router } from "express";
import express from "express";
import type { Request, Response } from "express";
import { PipelineOrchestrator } from "../../services/PipelineOrchestrator.js";
import { PipelineStore } from "../../db/PipelineStore.js";
import { logger } from "../../logger.js";
import type { Config } from "../../config.js";

export class PipelineRouter {
  public router: Router;
  private orchestrator: PipelineOrchestrator;
  private store: PipelineStore;

  constructor(config: Config) {
    this.router = Router();
    this.router.use(express.json());
    this.orchestrator = new PipelineOrchestrator(config.dataDirPath);
    this.store = this.orchestrator.getStore();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.post("/run", (req: Request, res: Response) => this.run(req, res));
    this.router.get("/jobs", (req: Request, res: Response) => this.listJobs(req, res));
    this.router.get("/jobs/:id", (req: Request, res: Response) => this.getJob(req, res));
    this.router.get("/stats", (req: Request, res: Response) => this.getStats(req, res));
  }

  private async run(req: Request, res: Response): Promise<void> {
    const { topic, platform, tone, bulkCount, autoSchedule } = req.body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      res.status(400).json({ error: "topic is required" });
      return;
    }

    const validPlatforms = ["tiktok", "instagram", "youtube", "youtube_shorts", "linkedin"];
    const validTones = ["excited", "calm", "urgent", "informative", "humorous"];

    if (platform && !validPlatforms.includes(platform)) {
      res.status(400).json({ error: `platform must be one of: ${validPlatforms.join(", ")}` });
      return;
    }
    if (tone && !validTones.includes(tone)) {
      res.status(400).json({ error: `tone must be one of: ${validTones.join(", ")}` });
      return;
    }

    try {
      logger.info({ topic, platform, tone, bulkCount }, "POST /pipeline/run");
      const result = await this.orchestrator.run({
        topic: topic.trim(),
        platform: platform || "tiktok",
        tone: tone || "excited",
        bulkCount: bulkCount ? Math.min(parseInt(String(bulkCount)), 30) : 1,
        autoSchedule: autoSchedule === true,
      });

      res.status(201).json({
        status: "ok",
        job: result.job,
        topVariations: result.topVariations,
        allVariations: result.allVariations,
      });
    } catch (err) {
      logger.error({ err }, "Pipeline run failed");
      res.status(500).json({ error: err instanceof Error ? err.message : "Pipeline failed" });
    }
  }

  private async listJobs(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(parseInt(String(req.query.limit || "50")), 200);
      const jobs = await this.store.listJobs(limit);
      res.json({ status: "ok", data: jobs, total: jobs.length });
    } catch (err) {
      res.status(500).json({ error: "Failed to list pipeline jobs" });
    }
  }

  private async getJob(req: Request, res: Response): Promise<void> {
    try {
      const job = await this.store.getJob(req.params.id);
      if (!job) {
        res.status(404).json({ error: "Pipeline job not found" });
        return;
      }
      const variations = await this.store.getVariationsForJob(req.params.id);
      res.json({ status: "ok", job, variations });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch pipeline job" });
    }
  }

  private async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.store.getStats();
      res.json({ status: "ok", stats });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch pipeline stats" });
    }
  }
}
