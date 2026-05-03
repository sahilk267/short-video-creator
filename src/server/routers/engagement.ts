import { Router } from "express";
import { EngagementPredictionEngine } from "../../services/EngagementPredictionEngine.js";
import { logger } from "../../logger";

export class EngagementRouter {
  readonly router: Router;
  private engine: EngagementPredictionEngine;

  constructor() {
    this.router = Router();
    this.engine = new EngagementPredictionEngine();
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.post("/predict", (req, res) => {
      try {
        const { views = 1000, hookQuality = "medium", topicTrend = "medium", postingTime = "medium" } = req.body;

        const prediction = this.engine.predictEngagement(
          views,
          hookQuality,
          topicTrend,
          postingTime,
        );

        res.json({ prediction });
      } catch (err) {
        logger.error({ err }, "POST /engagement/predict failed");
        res.status(500).json({ error: "Failed to predict engagement" });
      }
    });

    this.router.post("/virality-factor", (req, res) => {
      try {
        const { shares = 10, engagement = 0.05 } = req.body;
        const factor = this.engine.calculateViralityFactor(shares, engagement);
        res.json({ viralityFactor: factor });
      } catch (err) {
        res.status(500).json({ error: "Failed to calculate virality factor" });
      }
    });
  }
}
