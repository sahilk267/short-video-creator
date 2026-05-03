import express from "express";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import path from "path";
import { logger } from "../../logger";
import { Config } from "../../config";
import { ImageFiltersEngine } from "../../services/ImageFiltersEngine";
import type { FilterType, FilterOptions } from "../../services/ImageFiltersEngine";

export class ImageRouter {
  public router: express.Router;
  private config: Config;
  private engine: any;
  private filtersEngine: ImageFiltersEngine;

  constructor(config: Config) {
    this.router = express.Router();
    this.config = config;
    this.filtersEngine = new ImageFiltersEngine(config.dataDirPath);
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
    // ---- Image Generation ----
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

    this.router.post("/announcement", async (req: ExpressRequest, res: ExpressResponse) => {
      if (!this.engine) return res.status(503).json({ error: "Image engine not available" });
      const { title, subtitle, platform } = req.body;
      if (!title) return res.status(400).json({ error: "title required" });
      try {
        const result = await this.engine.generateAnnouncement(title, subtitle, platform);
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

    // ---- Image Filters ----

    /**
     * GET /api/image/filters
     * Returns all available filter presets
     */
    this.router.get("/filters", (req: ExpressRequest, res: ExpressResponse) => {
      try {
        const platform = req.query["platform"] as string | undefined;
        const presets = platform
          ? this.filtersEngine.getPresetsForPlatform(platform)
          : this.filtersEngine.getPresets();
        res.json({ status: "ok", filters: presets, total: presets.length });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    });

    /**
     * GET /api/image/filters/:filterId
     * Returns a single filter preset detail
     */
    this.router.get("/filters/:filterId", (req: ExpressRequest, res: ExpressResponse) => {
      const preset = this.filtersEngine.getPreset(req.params.filterId as FilterType);
      if (!preset) return res.status(404).json({ error: "Filter not found" });
      const cssFilter = this.filtersEngine.buildCssFilter({ filter: req.params.filterId as FilterType, ...preset.defaultOptions });
      res.json({ status: "ok", preset, cssFilter });
    });

    /**
     * POST /api/image/filters/css
     * Convert filter options to CSS filter string
     * Body: { filter, intensity?, brightness?, contrast?, saturation?, hue?, blur? }
     */
    this.router.post("/filters/css", (req: ExpressRequest, res: ExpressResponse) => {
      try {
        const options = req.body as FilterOptions;
        if (!options.filter) return res.status(400).json({ error: "filter is required" });
        const cssFilter = this.filtersEngine.buildCssFilter(options);
        const svgFilter = this.filtersEngine.buildSvgFilter(options);
        res.json({ status: "ok", cssFilter, svgFilter, filter: options.filter });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    });

    /**
     * POST /api/image/filters/preview
     * Generate a filter preview image (SVG)
     * Body: { filter, title?, intensity?, width?, height? }
     */
    this.router.post("/filters/preview", async (req: ExpressRequest, res: ExpressResponse) => {
      try {
        const { filter, title, intensity = 100, width = 400, height = 300 } = req.body as any;
        if (!filter) return res.status(400).json({ error: "filter is required" });
        const options: FilterOptions = { filter, intensity };
        const filePath = await this.filtersEngine.generateFilterPreview(
          title || filter,
          options,
          width,
          height,
        );
        res.json({
          status: "ok",
          preview: { filePath: undefined, fileName: path.basename(filePath), filter },
        });
      } catch (err) {
        logger.error(err, "Filter preview error");
        res.status(500).json({ error: (err as Error).message });
      }
    });

    /**
     * GET /api/image/filters/preview/file/:fileName
     * Serve generated filter preview file
     */
    this.router.get("/filters/preview/file/:fileName", (req: ExpressRequest, res: ExpressResponse) => {
      const filePath = path.join(this.config.dataDirPath, "filtered-images", req.params.fileName);
      res.sendFile(filePath, (err) => {
        if (err) res.status(404).json({ error: "Filter preview file not found" });
      });
    });

    /**
     * POST /api/image/filters/apply
     * Apply a filter to an existing image
     * Body: { fileName, filter, intensity?, brightness?, contrast?, saturation? }
     */
    this.router.post("/filters/apply", async (req: ExpressRequest, res: ExpressResponse) => {
      try {
        const { fileName, filter, ...rest } = req.body as any;
        if (!fileName) return res.status(400).json({ error: "fileName is required" });
        if (!filter) return res.status(400).json({ error: "filter is required" });

        const inputPath = path.join(this.config.dataDirPath, "generated-images", fileName);
        const options: FilterOptions = { filter, ...rest };

        const ext = path.extname(fileName).toLowerCase();
        const outputPath = ext === ".svg"
          ? await this.filtersEngine.applyFilterToSvg(inputPath, options)
          : await this.filtersEngine.applyFilterToCanvas(inputPath, options);

        res.json({
          status: "ok",
          result: {
            inputFileName: fileName,
            outputFileName: path.basename(outputPath),
            filter,
          },
        });
      } catch (err) {
        logger.error(err, "Filter apply error");
        res.status(500).json({ error: (err as Error).message });
      }
    });

    /**
     * POST /api/image/filters/batch
     * Apply a filter to multiple images
     * Body: { fileNames: string[], filter, ...options }
     */
    this.router.post("/filters/batch", async (req: ExpressRequest, res: ExpressResponse) => {
      try {
        const { fileNames, filter, ...rest } = req.body as any;
        if (!Array.isArray(fileNames) || fileNames.length === 0) {
          return res.status(400).json({ error: "fileNames array is required" });
        }
        if (!filter) return res.status(400).json({ error: "filter is required" });
        if (fileNames.length > 20) return res.status(400).json({ error: "Max 20 files per batch" });

        const inputPaths = fileNames.map((f: string) =>
          path.join(this.config.dataDirPath, "generated-images", f),
        );
        const options: FilterOptions = { filter, ...rest };
        const results = await this.filtersEngine.batchApplyFilter(inputPaths, options);

        res.json({
          status: "ok",
          results: results.map((r, i) => ({
            inputFileName: fileNames[i],
            outputFileName: r.success ? path.basename(r.output) : null,
            success: r.success,
            error: r.error,
          })),
          successCount: results.filter((r) => r.success).length,
        });
      } catch (err) {
        logger.error(err, "Filter batch error");
        res.status(500).json({ error: (err as Error).message });
      }
    });

    /**
     * GET /api/image/filtered/:fileName
     * Serve filtered image files
     */
    this.router.get("/filtered/:fileName", (req: ExpressRequest, res: ExpressResponse) => {
      const filePath = path.join(this.config.dataDirPath, "filtered-images", req.params.fileName);
      res.sendFile(filePath, (err) => {
        if (err) res.status(404).json({ error: "Filtered image not found" });
      });
    });
  }
}
