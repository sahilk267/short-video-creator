import { Router } from "express";
import type { Config } from "../../config";
import { HumanizedContentEngine } from "../../services/HumanizedContentEngine";
import { logger } from "../../logger";

export class HumanizedRouter {
  readonly router: Router;
  private engine: HumanizedContentEngine;

  constructor(config: Config) {
    this.router = Router();
    this.engine = new HumanizedContentEngine(config.dataDirPath);
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.post("/humanize", (req, res) => {
      try {
        const { script, emotion = "excited" } = req.body;
        if (!script) return res.status(400).json({ error: "script is required" });
        const result = this.engine.humanizeContent(script, emotion);
        res.json({ result });
      } catch (err) {
        logger.error({ err }, "POST /humanize failed");
        res.status(500).json({ error: "Failed to humanize content" });
      }
    });

    this.router.get("/avatar-directives/:emotion", (req, res) => {
      try {
        const duration = Number(req.query.duration) || 10000;
        const directives = this.engine.generateAvatarDirectives(req.params.emotion, duration);
        res.json({ directives });
      } catch (err) {
        logger.error({ err }, "GET /humanized/avatar-directives failed");
        res.status(500).json({ error: "Failed to generate directives" });
      }
    });

    this.router.get("/config", (_req, res) => {
      try {
        const config = this.engine.getConfig();
        res.json({ config });
      } catch (err) {
        logger.error({ err }, "GET /humanized/config failed");
        res.status(500).json({ error: "Failed to fetch config" });
      }
    });

    this.router.put("/config", (req, res) => {
      try {
        this.engine.saveConfig(req.body);
        res.json({ success: true });
      } catch (err) {
        logger.error({ err }, "PUT /humanized/config failed");
        res.status(500).json({ error: "Failed to save config" });
      }
    });
  }
}
