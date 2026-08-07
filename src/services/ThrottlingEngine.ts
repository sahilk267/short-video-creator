import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export interface TenantQuota {
  tenantId: string;
  plan: "free" | "pro" | "enterprise" | "custom";
  limits: QuotaLimits;
  usage: QuotaUsage;
  windowStart: string;
  windowMs: number;
}

export interface QuotaLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  videosPerDay: number;
  imagesPerDay: number;
  exportsPerDay: number;
  apiCallsPerMonth: number;
}

export interface QuotaUsage {
  requestsThisMinute: number;
  requestsThisHour: number;
  requestsThisDay: number;
  videosThisDay: number;
  imagesThisDay: number;
  exportsThisDay: number;
  apiCallsThisMonth: number;
  lastReset: string;
}

export interface ThrottleResult {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
  remaining: Partial<QuotaLimits>;
}

const PLAN_LIMITS: Record<TenantQuota["plan"], QuotaLimits> = {
  free: { requestsPerMinute: 10, requestsPerHour: 100, requestsPerDay: 500, videosPerDay: 3, imagesPerDay: 10, exportsPerDay: 2, apiCallsPerMonth: 1000 },
  pro: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 10000, videosPerDay: 50, imagesPerDay: 200, exportsPerDay: 20, apiCallsPerMonth: 50000 },
  enterprise: { requestsPerMinute: 300, requestsPerHour: 10000, requestsPerDay: 100000, videosPerDay: 500, imagesPerDay: 5000, exportsPerDay: 200, apiCallsPerMonth: 1000000 },
  custom: { requestsPerMinute: 1000, requestsPerHour: 50000, requestsPerDay: 500000, videosPerDay: 9999, imagesPerDay: 99999, exportsPerDay: 9999, apiCallsPerMonth: 99999999 },
};

export class ThrottlingEngine {
  private dataPath: string;
  private quotas: Map<string, TenantQuota> = new Map();

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "throttle-quotas.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const arr: TenantQuota[] = fs.readJsonSync(this.dataPath);
        for (const q of arr) this.quotas.set(q.tenantId, q);
      }
    } catch { /* ignore */ }
  }

  private save() {
    try { fs.writeJsonSync(this.dataPath, [...this.quotas.values()], { spaces: 2 }); } catch { /* ignore */ }
  }

  private getOrCreate(tenantId: string, plan: TenantQuota["plan"] = "free"): TenantQuota {
    if (!this.quotas.has(tenantId)) {
      const quota: TenantQuota = {
        tenantId, plan,
        limits: { ...PLAN_LIMITS[plan] },
        usage: { requestsThisMinute: 0, requestsThisHour: 0, requestsThisDay: 0, videosThisDay: 0, imagesThisDay: 0, exportsThisDay: 0, apiCallsThisMonth: 0, lastReset: new Date().toISOString() },
        windowStart: new Date().toISOString(),
        windowMs: 60000,
      };
      this.quotas.set(tenantId, quota);
    }
    return this.quotas.get(tenantId)!;
  }

  private resetIfNeeded(quota: TenantQuota) {
    const now = Date.now();
    const lastReset = new Date(quota.usage.lastReset).getTime();
    const windowStart = new Date(quota.windowStart).getTime();

    if (now - windowStart > 60000) {
      quota.usage.requestsThisMinute = 0;
      quota.windowStart = new Date().toISOString();
    }
    if (now - lastReset > 3600000) {
      quota.usage.requestsThisHour = 0;
    }
    if (now - lastReset > 86400000) {
      quota.usage.requestsThisDay = 0;
      quota.usage.videosThisDay = 0;
      quota.usage.imagesThisDay = 0;
      quota.usage.exportsThisDay = 0;
      quota.usage.lastReset = new Date().toISOString();
    }
  }

  check(tenantId: string, action: "request" | "video" | "image" | "export" = "request", plan: TenantQuota["plan"] = "free"): ThrottleResult {
    try {
      const quota = this.getOrCreate(tenantId, plan);
      this.resetIfNeeded(quota);

      const { limits, usage } = quota;
      const remaining: Partial<QuotaLimits> = {
        requestsPerMinute: limits.requestsPerMinute - usage.requestsThisMinute,
        requestsPerDay: limits.requestsPerDay - usage.requestsThisDay,
        videosPerDay: limits.videosPerDay - usage.videosThisDay,
      };

      if (usage.requestsThisMinute >= limits.requestsPerMinute) {
        const retryAfterMs = 60000 - (Date.now() - new Date(quota.windowStart).getTime());
        logger.warn({ tenantId, action }, "ThrottlingEngine: rate limit exceeded (per minute)");
        return { allowed: false, reason: `Rate limit: ${limits.requestsPerMinute} req/min exceeded`, retryAfterMs: Math.max(0, retryAfterMs), remaining };
      }

      if (usage.requestsThisDay >= limits.requestsPerDay) {
        return { allowed: false, reason: `Daily limit: ${limits.requestsPerDay} req/day exceeded`, retryAfterMs: 86400000, remaining };
      }

      if (action === "video" && usage.videosThisDay >= limits.videosPerDay) {
        return { allowed: false, reason: `Daily video limit: ${limits.videosPerDay} videos/day exceeded`, retryAfterMs: 86400000, remaining };
      }

      if (action === "image" && usage.imagesThisDay >= limits.imagesPerDay) {
        return { allowed: false, reason: `Daily image limit exceeded`, retryAfterMs: 86400000, remaining };
      }

      if (action === "export" && usage.exportsThisDay >= limits.exportsPerDay) {
        return { allowed: false, reason: `Daily export limit exceeded`, retryAfterMs: 86400000, remaining };
      }

      usage.requestsThisMinute++;
      usage.requestsThisHour++;
      usage.requestsThisDay++;
      usage.apiCallsThisMonth++;
      if (action === "video") usage.videosThisDay++;
      if (action === "image") usage.imagesThisDay++;
      if (action === "export") usage.exportsThisDay++;

      this.save();
      return { allowed: true, remaining };
    } catch (err) {
      // Fail-closed: on unexpected errors deny access rather than granting it.
      logger.error({ err, tenantId }, "ThrottlingEngine.check error — failing closed");
      return { allowed: false, reason: "Throttle check unavailable", remaining: {} };
    }
  }

  getQuota(tenantId: string): TenantQuota | undefined { return this.quotas.get(tenantId); }
  getAllQuotas(): TenantQuota[] { return [...this.quotas.values()]; }

  setPlan(tenantId: string, plan: TenantQuota["plan"]): TenantQuota {
    const quota = this.getOrCreate(tenantId, plan);
    quota.plan = plan;
    quota.limits = { ...PLAN_LIMITS[plan] };
    this.save();
    return quota;
  }

  resetUsage(tenantId: string): void {
    const quota = this.quotas.get(tenantId);
    if (quota) {
      quota.usage = { requestsThisMinute: 0, requestsThisHour: 0, requestsThisDay: 0, videosThisDay: 0, imagesThisDay: 0, exportsThisDay: 0, apiCallsThisMonth: 0, lastReset: new Date().toISOString() };
      this.save();
    }
  }

  getPlanLimits(plan: TenantQuota["plan"]): QuotaLimits { return PLAN_LIMITS[plan]; }
}
