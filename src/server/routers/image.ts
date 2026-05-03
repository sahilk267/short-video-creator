import express from "express";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import path from "path";
import { logger } from "../../logger";
import { Config } from "../../config";

export class ImageRouter {
  public router: express.Router;
  private config: Config;
  private engine: any;

  constructor(config: Config) {
    this.router = express.Router();
    this.config = config;
    this.router.use(express.json());
    this.setupRoutes();
    this.initEngine();
  }

  private async initEngine() {
    try {
      const { ImageGenerationEngine } = await import("../../services/ImageGenerationEngine.js");
      this.engine = new ImageGenerationEngine(this.config.dataDirPath);
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "ImageGenerationEngine not available (canvas may not be installed)");
    }
  }

  private setupRoutes() {
    this.router.post("/generate", async (req: ExpressRequest, res: ExpressResponse) => {
      if (!this.engine) return res.status(503).json({ error: "Image engine not available — install canvas package" });
      try {
        const result = await this.engine.generate(req.body);
        res.json({ status: "ok", data: { ...result, filePath: undefined, fileName: path.basename(result.filePath) } });
      } catch (err) {
        logger.error(err, "Image generation error");
        res.status(500).json({ error: (err as Error).message });
      }
    });

    this.router.post("/quote-card", async (req: ExpressRequest, res: ExpressResponse) => {
      if (!this.engine) return res.status(503).json({ error: "Image engine not available" });
      const { quote, author, category } = req.body;
      if (!quote) return res.status(400).json({ error: "quote required" });
      try {
        const result = await this.engine.generateQuoteCard(quote, author, category);
        res.json({ status: "ok", data: { ...result, fileName: path.basename(result.filePath) } });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    });

    this.router.post("/thumbnail", async (req: ExpressRequest, res: ExpressResponse) => {
      if (!this.engine) return res.status(503).json({ error: "Image engine not available" });
      const { title, category } = req.body;
      if (!title) return res.status(400).json({ error: "title required" });
      try {
        const result = await this.engine.generateThumbnail(title, category);
        res.json({ status: "ok", data: { ...result, fileName: path.basename(result.filePath) } });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    });

    this.router.get("/file/:fileName", async (req: ExpressRequest, res: ExpressResponse) => {
      const filePath = path.join(this.config.dataDirPath, "generated-images", req.params.fileName);
      res.sendFile(filePath, (err) => {
        if (err) res.status(404).json({ error: "File not found" });
      });
    });
  }
}
