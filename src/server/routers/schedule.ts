/**
 * ScheduleRouter – Full schedule persistence with cron-like runner
 *
 * GET    /api/schedule              – list schedules
 * POST   /api/schedule              – create schedule
 * GET    /api/schedule/stats        – schedule statistics
 * GET    /api/schedule/due          – get schedules due now
 * GET    /api/schedule/:id          – get single schedule
 * PATCH  /api/schedule/:id          – update schedule
 * PATCH  /api/schedule/:id/status   – pause/resume/complete
 * DELETE /api/schedule/:id          – delete schedule
 * POST   /api/schedule/:id/run      – trigger immediate run
 */
import { Router } from "express";
import type { Request, Response } from "express";
import express from "express";
import type { Config } from "../../config";
import { ScheduleStore } from "../../db/ScheduleStore";
import { logger } from "../../logger";

export class ScheduleRouter {
  public router: Router;
  private store: ScheduleStore;
  private runnerInterval: NodeJS.Timeout | null = null;

  constructor(config: Config) {
    this.router = Router();
    this.store = new ScheduleStore(config.dataDirPath);
    this.router.use(express.json());
    this.registerRoutes();
    this.startRunner();
  }

  private registerRoutes(): void {
    this.router.get("/stats", (req: Request, res: Response) => this.getStats(req, res));
    this.router.get("/due", (req: Request, res: Response) => this.getDue(req, res));
    this.router.get("/", (req: Request, res: Response) => this.listSchedules(req, res));
    this.router.post("/", (req: Request, res: Response) => this.createSchedule(req, res));
    this.router.get("/:id", (req: Request, res: Response) => this.getSchedule(req, res));
    this.router.patch("/:id/status", (req: Request, res: Response) => this.updateStatus(req, res));
    this.router.post("/:id/run", (req: Request, res: Response) => this.triggerRun(req, res));
    this.router.patch("/:id", (req: Request, res: Response) => this.updateSchedule(req, res));
    this.router.delete("/:id", (req: Request, res: Response) => this.deleteSchedule(req, res));
  }

  /** Background runner: checks due schedules every minute */
  private startRunner(): void {
    this.runnerInterval = setInterval(async () => {
      try {
        const due = await this.store.getDueSchedules();
        for (const sched of due) {
          logger.info({ scheduleId: sched.id, name: sched.name }, "Schedule triggered");
          await this.executeSchedule(sched.id);
        }
      } catch (err) {
        logger.error(err, "Schedule runner error");
      }
    }, 60_000);
  }

  private async executeSchedule(scheduleId: string): Promise<boolean> {
    const sched = await this.store.get(scheduleId);
    if (!sched || sched.status !== "active") return false;
    try {
      logger.info({ scheduleId, name: sched.name, platforms: sched.platforms }, "Executing schedule");
      await this.store.recordRun(scheduleId, true);
      return true;
    } catch (err) {
      logger.error(err, "Schedule execution failed");
      await this.store.recordRun(scheduleId, false);
      return false;
    }
  }

  private async listSchedules(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(parseInt(String(req.query["limit"] || "50")), 200);
      const offset = parseInt(String(req.query["offset"] || "0"));
      const activeOnly = req.query["active"] === "true";
      if (activeOnly) {
        const schedules = await this.store.listActive(limit, offset);
        res.json({ status: "ok", schedules, total: schedules.length });
        return;
      }
      const result = await this.store.list(limit, offset);
      res.json({ status: "ok", ...result });
    } catch (err) {
      logger.error(err, "Schedule: list failed");
      res.status(500).json({ status: "error", error: "Failed to list schedules" });
    }
  }

  private async createSchedule(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        videoId = "",
        platforms = [],
        categories = [],
        languages = ["en"],
        engines = {},
        quality = {},
        cronExpression = "0 9 * * *",
        publishAt,
        metadata = {},
      } = req.body as any;

      if (!name || typeof name !== "string") {
        res.status(400).json({ error: "name is required" });
        return;
      }
      if (!publishAt) {
        res.status(400).json({ error: "publishAt is required (ISO date string)" });
        return;
      }

      const now = new Date().toISOString();
      const record = await this.store.create({
        name,
        videoId,
        platforms: Array.isArray(platforms) ? platforms : [],
        categories: Array.isArray(categories) ? categories : [],
        languages: Array.isArray(languages) ? languages : ["en"],
        engines: {
          enableTranslation: engines.enableTranslation ?? false,
          enableCommentCTA: engines.enableCommentCTA ?? false,
          enablePlatformPsych: engines.enablePlatformPsych ?? false,
          enableSeries: engines.enableSeries ?? false,
          enableHumanMimicry: engines.enableHumanMimicry ?? false,
          enableHashtagOptimization: engines.enableHashtagOptimization ?? true,
          enableEngagementOptimization: engines.enableEngagementOptimization ?? true,
        },
        quality: {
          targetLUFS: quality.targetLUFS ?? -14,
          sharpnessLevel: quality.sharpnessLevel ?? 5,
          visualQualityTier: quality.visualQualityTier ?? "standard",
        },
        cronExpression,
        publishAt: new Date(publishAt).toISOString(),
        status: "active",
        nextRun: new Date(publishAt).toISOString(),
        metadata,
      });

      res.status(201).json({ status: "ok", schedule: record });
    } catch (err) {
      logger.error(err, "Schedule: create failed");
      res.status(500).json({ status: "error", error: "Failed to create schedule" });
    }
  }

  private async getSchedule(req: Request, res: Response): Promise<void> {
    try {
      const sched = await this.store.get(req.params.id);
      if (!sched) {
        res.status(404).json({ error: "Schedule not found" });
        return;
      }
      res.json({ status: "ok", schedule: sched });
    } catch (err) {
      logger.error(err, "Schedule: get failed");
      res.status(500).json({ status: "error", error: "Failed to get schedule" });
    }
  }

  private async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const updated = await this.store.update(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: "Schedule not found" });
        return;
      }
      res.json({ status: "ok", schedule: updated });
    } catch (err) {
      logger.error(err, "Schedule: update failed");
      res.status(500).json({ status: "error", error: "Failed to update schedule" });
    }
  }

  private async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body as { status: string };
      const allowed = ["active", "paused", "completed", "failed"];
      if (!status || !allowed.includes(status)) {
        res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
        return;
      }
      const updated = await this.store.updateStatus(req.params.id, status as any);
      if (!updated) {
        res.status(404).json({ error: "Schedule not found" });
        return;
      }
      res.json({ status: "ok", schedule: updated });
    } catch (err) {
      logger.error(err, "Schedule: updateStatus failed");
      res.status(500).json({ status: "error", error: "Failed to update status" });
    }
  }

  private async triggerRun(req: Request, res: Response): Promise<void> {
    try {
      const sched = await this.store.get(req.params.id);
      if (!sched) {
        res.status(404).json({ error: "Schedule not found" });
        return;
      }
      const success = await this.executeSchedule(req.params.id);
      res.json({ status: "ok", triggered: true, success, scheduleId: req.params.id });
    } catch (err) {
      logger.error(err, "Schedule: triggerRun failed");
      res.status(500).json({ status: "error", error: "Failed to trigger run" });
    }
  }

  private async deleteSchedule(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await this.store.delete(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Schedule not found" });
        return;
      }
      res.json({ status: "ok", message: "Schedule deleted successfully" });
    } catch (err) {
      logger.error(err, "Schedule: delete failed");
      res.status(500).json({ status: "error", error: "Failed to delete schedule" });
    }
  }

  private async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.store.getStats();
      res.json({ status: "ok", stats });
    } catch (err) {
      logger.error(err, "Schedule: stats failed");
      res.status(500).json({ status: "error", error: "Failed to get stats" });
    }
  }

  private async getDue(req: Request, res: Response): Promise<void> {
    try {
      const schedules = await this.store.getDueSchedules();
      res.json({ status: "ok", schedules, count: schedules.length });
    } catch (err) {
      logger.error(err, "Schedule: getDue failed");
      res.status(500).json({ status: "error", error: "Failed to get due schedules" });
    }
  }
}
