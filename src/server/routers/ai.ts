import { Router } from "express";
import type { Request, Response } from "express";
import type { Config } from "../../config";
import { AiLearningStore } from "../../db/AiLearningStore";
import { AiPredictionService } from "../../services/AiPredictionService";
import { AiMonitoringService } from "../../services/AiMonitoringService";
import { AiTrainingService } from "../../services/AiTrainingService";

export class AiRouter {
  public router: Router;
  private store: AiLearningStore;
  private predictor: AiPredictionService;
  private monitoring: AiMonitoringService;
  private trainer: AiTrainingService;

  constructor(config: Config) {
    this.router = Router();
    this.router.use(jsonMiddleware());
    this.store = new AiLearningStore(config.dataDirPath);
    this.predictor = new AiPredictionService();
    this.monitoring = new AiMonitoringService();
    this.trainer = new AiTrainingService(this.store, this.predictor);
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.post("/events", (req, res) => this.addEvent(req, res));
    this.router.get("/events", (req, res) => this.listEvents(req, res));
    this.router.post("/train", (req, res) => this.train(req, res));
    this.router.get("/model", (req, res) => this.getModel(req, res));
    this.router.post("/suggest", (req, res) => this.suggest(req, res));
    this.router.get("/dashboard", (req, res) => this.dashboard(req, res));
  }

  private async addEvent(req: Request, res: Response): Promise<void> {
    const { jobId, phase, outcome, latencyMs } = req.body;
    if (!jobId || !phase || !outcome || typeof latencyMs !== "number") {
      res.status(400).json({ error: "jobId, phase, outcome, latencyMs are required" });
      return;
    }
    const saved = await this.store.addEvent(req.body);
    res.status(201).json(saved);
  }

  private async listEvents(req: Request, res: Response): Promise<void> {
    const limit = Number(req.query.limit || 200);
    res.json(await this.store.listEvents(limit));
  }

  private async train(_req: Request, res: Response): Promise<void> {
    await this.trainer.runTrainingNow();
    res.json({ ok: true, model: await this.store.getModelState() });
  }

  private async getModel(_req: Request, res: Response): Promise<void> {
    const model = await this.store.getModelState();
    const health = this.monitoring.evaluateModelHealth(model);
    res.json({ model, health });
  }

  private async suggest(req: Request, res: Response): Promise<void> {
    const model = await this.store.getModelState();
    const health = this.monitoring.evaluateModelHealth(model);
    const suggestion = health.fallbackMode
      ? this.monitoring.fallbackSuggestion(req.body || {})
      : this.predictor.predict(model, req.body || {});

    res.json({ suggestion, health });
  }

  private async dashboard(_req: Request, res: Response): Promise<void> {
    const [events, model] = await Promise.all([
      this.store.listEvents(500),
      this.store.getModelState(),
    ]);

    const total = events.length;
    const success = events.filter((e) => e.outcome === "success").length;
    const failures = total - success;
    const avgLatencyMs = total
      ? Math.round(events.reduce((acc, e) => acc + e.latencyMs, 0) / total)
      : 0;

    res.json({
      summary: {
        totalEvents: total,
        successRate: total ? success / total : 0,
        failures,
        avgLatencyMs,
      },
      model,
      monitoring: this.monitoring.evaluateModelHealth(model),
      recentFailures: events.filter((e) => e.outcome === "failed").slice(0, 20),
    });
  }
}

function jsonMiddleware() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const express = require("express") as typeof import("express");
  return express.json();
}
