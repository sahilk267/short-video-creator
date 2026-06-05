/* eslint-disable @remotion/deterministic-randomness */

import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export type ComplianceAction =
  | "content_published" | "content_deleted" | "user_login" | "user_logout"
  | "api_key_created" | "api_key_rotated" | "api_key_deleted"
  | "export_created" | "data_accessed" | "settings_changed"
  | "moderation_flagged" | "approval_granted" | "approval_rejected"
  | "tenant_created" | "tenant_deleted" | "rate_limit_hit";

export interface ComplianceLog {
  id: string;
  timestamp: string;
  action: ComplianceAction;
  tenantId?: string;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  outcome: "success" | "failure" | "warning";
  severity: "info" | "warn" | "critical";
}

export interface ComplianceReport {
  from: string;
  to: string;
  totalEvents: number;
  byAction: Record<string, number>;
  criticalEvents: ComplianceLog[];
  warnings: ComplianceLog[];
  uniqueTenants: number;
  summary: string;
}

function severityFor(action: ComplianceAction): ComplianceLog["severity"] {
  const critical: ComplianceAction[] = ["api_key_deleted", "tenant_deleted", "content_deleted", "moderation_flagged", "approval_rejected"];
  const warn: ComplianceAction[] = ["rate_limit_hit", "api_key_rotated", "settings_changed"];
  if (critical.includes(action)) return "critical";
  if (warn.includes(action)) return "warn";
  return "info";
}

export class ComplianceEngine {
  private dataPath: string;
  private logs: ComplianceLog[] = [];
  private readonly MAX_LOGS = 50000;

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "compliance-logs.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dataPath)) this.logs = fs.readJsonSync(this.dataPath);
    } catch { this.logs = []; }
  }

  private save() {
    try {
      if (this.logs.length > this.MAX_LOGS) this.logs = this.logs.slice(-this.MAX_LOGS);
      fs.writeJsonSync(this.dataPath, this.logs, { spaces: 2 });
    } catch { /* ignore */ }
  }

  log(
    action: ComplianceAction,
    details: Record<string, unknown> = {},
    opts: { tenantId?: string; userId?: string; resourceId?: string; resourceType?: string; ipAddress?: string; outcome?: ComplianceLog["outcome"] } = {}
  ): ComplianceLog {
    const entry: ComplianceLog = {
      id: `cpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      tenantId: opts.tenantId,
      userId: opts.userId,
      resourceId: opts.resourceId,
      resourceType: opts.resourceType,
      ipAddress: opts.ipAddress,
      details,
      outcome: opts.outcome || "success",
      severity: severityFor(action),
    };

    this.logs.push(entry);
    this.save();

    if (entry.severity === "critical") {
      logger.warn({ action, tenantId: opts.tenantId, resourceId: opts.resourceId }, "Compliance: critical action logged");
    } else {
      logger.debug({ action, id: entry.id }, "Compliance: action logged");
    }

    return entry;
  }

  query(opts: {
    from?: Date; to?: Date; tenantId?: string; action?: ComplianceAction;
    severity?: ComplianceLog["severity"]; limit?: number;
  }): ComplianceLog[] {
    let result = this.logs;
    if (opts.from) result = result.filter((l) => new Date(l.timestamp) >= opts.from!);
    if (opts.to) result = result.filter((l) => new Date(l.timestamp) <= opts.to!);
    if (opts.tenantId) result = result.filter((l) => l.tenantId === opts.tenantId);
    if (opts.action) result = result.filter((l) => l.action === opts.action);
    if (opts.severity) result = result.filter((l) => l.severity === opts.severity);
    return result.slice(-(opts.limit || 1000)).reverse();
  }

  generateReport(from: Date, to: Date): ComplianceReport {
    const logs = this.query({ from, to });
    const byAction: Record<string, number> = {};
    const uniqueTenants = new Set<string>();

    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      if (log.tenantId) uniqueTenants.add(log.tenantId);
    }

    const criticalEvents = logs.filter((l) => l.severity === "critical").slice(0, 50);
    const warnings = logs.filter((l) => l.severity === "warn").slice(0, 50);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      totalEvents: logs.length,
      byAction,
      criticalEvents,
      warnings,
      uniqueTenants: uniqueTenants.size,
      summary: `${logs.length} events (${criticalEvents.length} critical, ${warnings.length} warnings) across ${uniqueTenants.size} tenants`,
    };
  }

  getRecentCritical(limit = 20): ComplianceLog[] {
    return this.logs.filter((l) => l.severity === "critical").slice(-limit).reverse();
  }

  getAll(limit = 500): ComplianceLog[] {
    return this.logs.slice(-limit).reverse();
  }
}
