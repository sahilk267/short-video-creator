import { Router, json } from "express";
import type { Request, Response } from "express";
import { CompetitorAnalysisEngine } from "../../services/CompetitorAnalysisEngine";
import type { Config } from "../../config";

export class CompetitorRouter {
  public router: Router;
  private engine: CompetitorAnalysisEngine;

  constructor(config: Config) {
    this.router = Router();
    this.router.use(json());
    this.engine = new CompetitorAnalysisEngine(config.dataDirPath);
    this.register();
  }

  private register() {
    this.router.get("/creators", (req: Request, res: Response) => {
      const { niche = "all", platform = "all" } = req.query as Record<string, string>;
      res.json({ status: "ok", data: this.engine.analyzeCompetitor(niche, platform) });
    });

    this.router.get("/patterns", (req: Request, res: Response) => {
      const { platform } = req.query as Record<string, string>;
      res.json({ status: "ok", data: this.engine.detectViralPatterns(platform) });
    });

    this.router.post("/strategy", (req: Request, res: Response) => {
      const { niche, platform } = req.body;
      if (!niche || !platform) { res.status(400).json({ error: "niche and platform required" }); return; }
      res.json({ status: "ok", data: this.engine.generateStrategy(niche, platform) });
    });

    this.router.get("/history", (_req: Request, res: Response) => {
      res.json({ status: "ok", data: this.engine.getHistory() });
    });
  }
}
