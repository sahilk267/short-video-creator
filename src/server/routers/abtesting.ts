import { Router } from "express";
import type { Request, Response } from "express";
import { ABTestingEngine } from "../../services/ABTestingEngine";
import type { Config } from "../../config";

const express = require("express") as typeof import("express");

export class ABTestingRouter {
  public router: Router;
  private engine: ABTestingEngine;

  constructor(config: Config) {
    this.router = Router();
    this.router.use(express.json());
    this.engine = new ABTestingEngine(config.dataDirPath);
    this.register();
  }

  private register() {
    this.router.get("/", (_req: Request, res: Response) => {
      res.json({ status: "ok", data: this.engine.getAllTests() });
    });

    this.router.post("/", (req: Request, res: Response) => {
      const { name, videoId, variants } = req.body;
      if (!name) { res.status(400).json({ error: "name required" }); return; }
      res.status(201).json({ status: "ok", data: this.engine.createTest(name, videoId, variants) });
    });

    this.router.get("/running", (_req: Request, res: Response) => {
      res.json({ status: "ok", data: this.engine.getRunningTests() });
    });

    this.router.get("/:id", (req: Request, res: Response) => {
      const test = this.engine.getTest(req.params.id);
      if (!test) { res.status(404).json({ error: "Test not found" }); return; }
      res.json({ status: "ok", data: test });
    });

    this.router.post("/:id/event", (req: Request, res: Response) => {
      const { variantId, event, count = 1 } = req.body;
      if (!variantId || !event) { res.status(400).json({ error: "variantId and event required" }); return; }
      this.engine.recordEvent(req.params.id, variantId, event, count);
      res.json({ status: "ok" });
    });

    this.router.get("/:id/analyze", (req: Request, res: Response) => {
      const result = this.engine.analyze(req.params.id);
      res.json({ status: "ok", data: result });
    });

    this.router.post("/:id/pause", (req: Request, res: Response) => {
      this.engine.pauseTest(req.params.id);
      res.json({ status: "ok" });
    });

    this.router.post("/:id/resume", (req: Request, res: Response) => {
      this.engine.resumeTest(req.params.id);
      res.json({ status: "ok" });
    });
  }
}
