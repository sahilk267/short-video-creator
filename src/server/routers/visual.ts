import { Router } from "express";
import { VisualEnhancementEngine } from "../../services/VisualEnhancementEngine.js";
import { logger } from "../../logger";

export class VisualRouter {
  readonly router: Router;
  private engine: VisualEnhancementEngine;

  constructor() {
    this.router = Router();
    this.engine = new VisualEnhancementEngine();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.post("/enhance", (req, res) => {
      try {
        const { width = 1920, height = 1080, autoSharpen = true, contrastOptimize = true } = req.body;

        const enhancement = this.engine.enhanceVideo(width, height, {
          autoSharpen,
          contrastOptimize,
          ruleOfThirds: true,
          safeZones: true,
          saturation: req.body.saturation || 0,
          brightness: req.body.brightness || 0,
          sharpnessLevel: req.body.sharpnessLevel || 1,
          noiseReduction: req.body.noiseReduction || 0.5,
        });

        res.json({ enhancement });
      } catch (err) {
        logger.error({ err }, "POST /visual/enhance failed");
        res.status(500).json({ error: "Failed to enhance video" });
      }
    });

    this.router.get("/ffmpeg-filters", (req, res) => {
      try {
        const baseEnhancement = this.engine.enhanceVideo(1920, 1080, {
          autoSharpen: true,
          contrastOptimize: true,
          ruleOfThirds: true,
          safeZones: true,
          saturation: 0,
          brightness: 0,
          sharpnessLevel: 1,
          noiseReduction: 0.5,
        });

        const filters = this.engine.generateFfmpegFilters(baseEnhancement);
        res.json({ filters });
      } catch (err) {
        res.status(500).json({ error: "Failed to generate filters" });
      }
    });
  }
}
