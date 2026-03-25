import { Router } from "express";
import type { Request, Response } from "express";
import type { Config } from "../../config";
import { TenantStore } from "../../db/TenantStore";
import { TenantUsageStore } from "../../db/TenantUsageStore";
import { CryptoService } from "../../services/CryptoService";
import { TenantQuotaService } from "../../services/TenantQuotaService";
import { TenantLoggerService } from "../../services/TenantLoggerService";

export class TenantRouter {
  public router: Router;
  private tenantStore: TenantStore;
  private usageStore: TenantUsageStore;
  private crypto: CryptoService;
  private quotaService: TenantQuotaService;
  private tenantLogger: TenantLoggerService;

  constructor(config: Config) {
    this.router = Router();
    this.tenantStore = new TenantStore(config.dataDirPath);
    this.usageStore = new TenantUsageStore(config.dataDirPath);
    this.crypto = new CryptoService(process.env.TENANT_KEYS_SECRET || "tenant-dev-secret");
    this.quotaService = new TenantQuotaService();
    this.tenantLogger = new TenantLoggerService(config.dataDirPath);
    this.router.use(expressJsonMiddleware());
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.get("/", (req: Request, res: Response) => this.list(req, res));
    this.router.post("/", (req: Request, res: Response) => this.create(req, res));
    this.router.get("/:tenantId", (req: Request, res: Response) => this.get(req, res));
    this.router.post("/:tenantId/keys", (req: Request, res: Response) => this.updateKeys(req, res));
    this.router.post("/:tenantId/engines", (req: Request, res: Response) => this.updateEngines(req, res));
    this.router.post("/:tenantId/quotas", (req: Request, res: Response) => this.updateQuotas(req, res));
    this.router.get("/:tenantId/billing", (req: Request, res: Response) => this.getBilling(req, res));
    this.router.post("/:tenantId/logs/:engine", (req: Request, res: Response) => this.writeEngineLog(req, res));
  }

  private async create(req: Request, res: Response): Promise<void> {
    const { workspaceName, tier, apiKeys } = req.body;
    if (!workspaceName || !tier) {
      res.status(400).json({ error: "workspaceName and tier are required" });
      return;
    }
    const tenant = await this.tenantStore.create({ workspaceName, tier, apiKeys });
    res.status(201).json(tenant);
  }

  private async list(_req: Request, res: Response): Promise<void> {
    const tenants = await this.tenantStore.list();
    res.json(tenants);
  }

  private async get(req: Request, res: Response): Promise<void> {
    const tenant = await this.tenantStore.get(req.params.tenantId);
    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }
    res.json(tenant);
  }

  private async updateKeys(req: Request, res: Response): Promise<void> {
    const apiKeys = req.body.apiKeys || {};
    const encrypted = Object.fromEntries(
      Object.entries(apiKeys).map(([k, v]) => [k, this.crypto.encrypt(String(v))]),
    );

    const updated = await this.tenantStore.updateEncryptedKeys(req.params.tenantId, encrypted);
    if (!updated) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }
    res.json({ ...updated, apiKeys: undefined });
  }

  private async updateEngines(req: Request, res: Response): Promise<void> {
    const updated = await this.tenantStore.updateEngineConfig(req.params.tenantId, req.body.engineConfig || {});
    if (!updated) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }
    res.json(updated);
  }

  private async updateQuotas(req: Request, res: Response): Promise<void> {
    const updated = await this.tenantStore.updateQuotas(req.params.tenantId, req.body.quotas || {});
    if (!updated) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }
    res.json(updated);
  }

  private async getBilling(req: Request, res: Response): Promise<void> {
    const tenant = await this.tenantStore.get(req.params.tenantId);
    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const usage = await this.usageStore.get(tenant.id, month) ?? {
      tenantId: tenant.id,
      month,
      renders: 0,
      publishes: 0,
      storageBytes: 0,
      estimatedCostUsd: 0,
    };
    const quota = this.quotaService.checkQuota(tenant, usage);
    res.json({ usage, quota });
  }

  private async writeEngineLog(req: Request, res: Response): Promise<void> {
    const { tenantId, engine } = req.params;
    const { level = "info", message = "", payload } = req.body || {};
    await this.tenantLogger.log(tenantId, engine, level, message, payload);
    res.status(201).json({ ok: true });
  }
}

function expressJsonMiddleware() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const express = require("express") as typeof import("express");
  return express.json();
}
