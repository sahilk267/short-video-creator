import express from "express";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { HookLibraryEngine } from "../../services/HookLibraryEngine";
import { logger } from "../../logger";
import { Config } from "../../config";

export class HooksRouter {
  public router: express.Router;
  private library: HookLibraryEngine;

  constructor(config: Config) {
    this.router = express.Router();
    this.library = new HookLibraryEngine(config.dataDirPath);
    this.router.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.get("/", (req: ExpressRequest, res: ExpressResponse) => {
      const { type, category, platform, emotion } = req.query;
      let hooks = this.library.getAll();
      if (type) hooks = hooks.filter((h) => h.type === type);
      if (category) hooks = hooks.filter((h) => h.category.includes(String(category)));
      if (platform) hooks = hooks.filter((h) => h.platform.includes(String(platform)));
      if (emotion) hooks = hooks.filter((h) => h.emotion === emotion);
      res.json({ status: "ok", data: hooks });
    });

    this.router.get("/best", (req: ExpressRequest, res: ExpressResponse) => {
      const { category, platform, emotion, limit } = req.query;
      const hooks = this.library.getBest({
        category: category ? String(category) : undefined,
        platform: platform ? String(platform) : undefined,
        emotion: emotion ? String(emotion) : undefined,
        limit: limit ? parseInt(String(limit)) : 5,
      });
      res.json({ status: "ok", data: hooks });
    });

    this.router.post("/generate", (req: ExpressRequest, res: ExpressResponse) => {
      const { topic, category, platform, limit } = req.body;
      if (!topic) return res.status(400).json({ error: "topic required" });
      const hooks = this.library.generateWithTopic(topic, { category, platform, limit: limit || 5 });
      res.json({ status: "ok", data: hooks });
    });

    this.router.post("/", (req: ExpressRequest, res: ExpressResponse) => {
      try {
        const hook = this.library.addHook(req.body);
        res.status(201).json({ status: "ok", data: hook });
      } catch (err) {
        logger.error({ err }, "POST /hooks failed");
        res.status(400).json({ error: "Invalid hook data" });
      }
    });

    this.router.patch("/:hookId/track", (req: ExpressRequest, res: ExpressResponse) => {
      const { performanceScore } = req.body;
      this.library.trackUsage(req.params.hookId, performanceScore);
      res.json({ status: "ok" });
    });

    this.router.delete("/:hookId", (req: ExpressRequest, res: ExpressResponse) => {
      const deleted = this.library.deleteHook(req.params.hookId);
      if (deleted) res.json({ status: "ok" });
      else res.status(404).json({ error: "Hook not found" });
    });
  }
}
