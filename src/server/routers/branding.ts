import { Router } from "express";
import type { Config } from "../../config";
import { BrandingEngine } from "../../services/BrandingEngine.js";
import { logger } from "../../logger";

export class BrandingRouter {
  readonly router: Router;
  private engine: BrandingEngine;

  constructor(config: Config) {
    this.router = Router();
    this.engine = new BrandingEngine(config.dataDirPath);
    this.registerRoutes();
  }

  private registerRoutes() {
    // GET /api/branding/:tenantId — get branding config
    this.router.get("/:tenantId", (_req, res) => {
      try {
        const config = this.engine.getBranding(_req.params.tenantId);
        res.json({ config });
      } catch (err) {
        logger.error({ err }, "GET /branding/:tenantId failed");
        res.status(500).json({ error: "Failed to fetch branding" });
      }
    });

    // GET /api/branding/:tenantId/css — get theme CSS
    this.router.get("/:tenantId/css", (_req, res) => {
      try {
        const css = this.engine.generateThemeCss(_req.params.tenantId);
        res.type("text/css").send(css);
      } catch (err) {
        res.status(500).json({ error: "Failed to generate CSS" });
      }
    });

    // PUT /api/branding/:tenantId — update branding
    this.router.put("/:tenantId", (req, res) => {
      try {
        const { name, description, logo, colors, typography, domain, customDomain, favicon } = req.body;
        if (!name || !colors || !domain) {
          return res.status(400).json({ error: "name, colors, and domain are required" });
        }
        if (!this.engine.validateDomain(domain)) {
          return res.status(400).json({ error: "Invalid domain format" });
        }
        if (!this.engine.validateColors(colors)) {
          return res.status(400).json({ error: "Invalid color format (use #RRGGBB)" });
        }
        const updated = this.engine.updateBranding(req.params.tenantId, {
          name, description, logo, colors, typography, domain, customDomain, favicon,
        });
        res.json({ branding: updated });
      } catch (err) {
        logger.error({ err }, "PUT /branding/:tenantId failed");
        res.status(500).json({ error: "Failed to update branding" });
      }
    });

    // POST /api/branding/:tenantId/reset — reset to default
    this.router.post("/:tenantId/reset", (_req, res) => {
      try {
        const branding = this.engine.resetBranding(_req.params.tenantId);
        res.json({ branding });
      } catch (err) {
        res.status(500).json({ error: "Failed to reset branding" });
      }
    });

    // GET /api/branding/all — get all tenant branding (admin only)
    this.router.get("/", (_req, res) => {
      try {
        const all = this.engine.getAllBranding();
        res.json({ branding: all });
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch all branding" });
      }
    });
  }
}
