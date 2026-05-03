import { Router } from "express";
import { QualityScoringEngine } from "../../services/QualityScoringEngine.js";
import { logger } from "../../logger";

export class QualityRouter {
  readonly router: Router;
  private engine: QualityScoringEngine;

  constructor() {
    this.router = Router();
    this.engine = new QualityScoringEngine();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.post("/score", (req, res) => {
      try {
        const {
          hasAudio = true,
          audioLUFS = -14,
          visualResolution = 1920,
          frameRate = 30,
          scriptLength = 500,
        } = req.body;

        const metrics = this.engine.scoreContent(
          hasAudio,
          audioLUFS,
          visualResolution,
          frameRate,
          scriptLength,
        );

        res.json({ metrics });
      } catch (err) {
        logger.error({ err }, "POST /quality/score failed");
        res.status(500).json({ error: "Failed to score quality" });
      }
    });
  }
}
