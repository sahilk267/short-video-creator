import { Router } from "express";
import type { Config } from "../../config";
import { AccountManagerEngine } from "../../services/AccountManagerEngine.js";
import { logger } from "../../logger";

export class AccountRouter {
  readonly router: Router;
  private engine: AccountManagerEngine;

  constructor(config: Config) {
    this.router = Router();
    this.engine = new AccountManagerEngine(config.dataDirPath);
    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.post("/metrics", (req, res) => {
      try {
        const { totalVideos = 10, totalViews = 5000, totalEngagement = 250, followersGained = 50 } = req.body;

        const metrics = this.engine.calculateAccountMetrics(
          totalVideos,
          totalViews,
          totalEngagement,
          followersGained,
        );

        res.json({ metrics });
      } catch (err) {
        logger.error({ err }, "POST /account/metrics failed");
        res.status(500).json({ error: "Failed to calculate metrics" });
      }
    });

    this.router.post("/guidance", (req, res) => {
      try {
        const { metrics } = req.body;
        if (!metrics) return res.status(400).json({ error: "metrics required" });
        const guidance = this.engine.getAccountGuidance(metrics);
        res.json({ guidance });
      } catch (err) {
        res.status(500).json({ error: "Failed to get guidance" });
      }
    });

    this.router.get("/load", (_req, res) => {
      try {
        const metrics = this.engine.loadMetrics();
        if (!metrics) {
          return res.json({
            metrics: {
              totalVideos: 0,
              totalViews: 0,
              averageEngagement: 0,
              followersGained: 0,
              accountHealth: 0,
              accountTier: "starter",
            },
          });
        }
        res.json({ metrics });
      } catch (err) {
        res.status(500).json({ error: "Failed to load metrics" });
      }
    });

    this.router.post("/save", (req, res) => {
      try {
        this.engine.saveMetrics(req.body);
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: "Failed to save metrics" });
      }
    });
  }
}
