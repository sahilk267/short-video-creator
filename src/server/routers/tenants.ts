import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "node:crypto";
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
    this.router.put("/:tenantId", (req: Request, res: Response) => this.updateWorkspace(req, res));
    this.router.get("/:tenantId/keys", (req: Request, res: Response) => this.listKeys(req, res));
    this.router.post("/:tenantId/keys", (req: Request, res: Response) => this.updateKeys(req, res));
    this.router.delete("/:tenantId/keys/:keyId", (req: Request, res: Response) => this.deleteKey(req, res));
    this.router.post("/:tenantId/engines", (req: Request, res: Response) => this.updateEngines(req, res));
    this.router.post("/:tenantId/quotas", (req: Request, res: Response) => this.updateQuotas(req, res));
    this.router.get("/:tenantId/quota", (req: Request, res: Response) => this.getQuota(req, res));
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

  private async updateWorkspace(req: Request, res: Response): Promise<void> {
    const { workspaceName = "", description, logoUrl } = req.body || {};
    if (!workspaceName) {
      res.status(400).json({ error: "workspaceName is required" });
      return;
    }

    const updated = await this.tenantStore.updateWorkspace(req.params.tenantId, {
      workspaceName,
      description,
      logoUrl,
    });
    if (!updated) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }
    res.json(updated);
  }

  private async listKeys(req: Request, res: Response): Promise<void> {
    const tenant = await this.tenantStore.get(req.params.tenantId);
    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const keys = Object.keys(tenant.apiKeys ?? {}).map((name) => ({
      id: name,
      name,
      prefix: (tenant.apiKeys[name] || "").slice(0, 8),
      createdAt: tenant.createdAt,
      lastUsedAt: tenant.updatedAt,
    }));

    res.json(keys);
  }

  private async updateKeys(req: Request, res: Response): Promise<void> {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const apiKeys = req.body.apiKeys || (name ? {
      [name]: crypto.randomBytes(24).toString("hex"),
    } : {});

    if (Object.keys(apiKeys).length === 0) {
      res.status(400).json({ error: "apiKeys or name is required" });
      return;
    }

    const encrypted = Object.fromEntries(
      Object.entries(apiKeys).map(([k, v]) => [k, this.crypto.encrypt(String(v))]),
    );

    const updated = await this.tenantStore.updateKeys(req.params.tenantId, apiKeys as Record<string, string>);
    if (!updated) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    await this.tenantStore.updateEncryptedKeys(req.params.tenantId, encrypted);

    const createdKey = Object.entries(apiKeys)[0];
    res.json({
      id: createdKey?.[0],
      name: createdKey?.[0],
      value: createdKey?.[1],
    });
  }

  private async deleteKey(req: Request, res: Response): Promise<void> {
    const updated = await this.tenantStore.removeKey(req.params.tenantId, req.params.keyId);
    if (!updated) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }
    res.status(204).send();
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
    const monthlyBase = tenant.tier === "enterprise" ? 499 : tenant.tier === "pro" ? 99 : tenant.tier === "free" ? 0 : 29;
    res.json({
      plan: tenant.tier === "free" ? "free" : tenant.tier,
      month,
      amountUsd: monthlyBase + usage.estimatedCostUsd,
      usageUsd: usage.estimatedCostUsd,
      status: quota.allowed ? "active" : "past_due",
      usage,
      quota,
    });
  }

  private async getQuota(req: Request, res: Response): Promise<void> {
    const tenant = await this.tenantStore.get(req.params.tenantId);
    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const month = new Date().toISOString().slice(0, 7);
    const usage = await this.usageStore.get(tenant.id, month) ?? {
      tenantId: tenant.id,
      month,
      renders: 0,
      publishes: 0,
      storageBytes: 0,
      estimatedCostUsd: 0,
    };
    const limits = this.quotaService.checkQuota(tenant, usage).limits;

    res.json({
      apiCallsUsed: usage.publishes + usage.renders,
      apiCallsLimit: limits.monthlyPublishes + limits.monthlyRenders,
      rendersUsed: usage.renders,
      rendersLimit: limits.monthlyRenders,
      storageUsedGb: Number((usage.storageBytes / (1024 * 1024 * 1024)).toFixed(2)),
      storageLimitGb: Number((limits.maxStorageBytes / (1024 * 1024 * 1024)).toFixed(2)),
    });
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
