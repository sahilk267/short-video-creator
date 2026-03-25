import type { TenantRecord } from "../db/TenantStore";

export class TenantQuotaService {
  private limits = {
    free: { monthlyRenders: 100, monthlyPublishes: 100, maxStorageBytes: 5 * 1024 * 1024 * 1024 },
    pro: { monthlyRenders: 2000, monthlyPublishes: 2000, maxStorageBytes: 100 * 1024 * 1024 * 1024 },
    enterprise: { monthlyRenders: 100000, monthlyPublishes: 100000, maxStorageBytes: 1024 * 1024 * 1024 * 1024 },
  } as const;

  checkQuota(tenant: TenantRecord, usage: { renders: number; publishes: number; storageBytes: number }) {
    const l = this.limits[tenant.tier];
    const errors: string[] = [];
    if (usage.renders > l.monthlyRenders) errors.push("monthly render quota exceeded");
    if (usage.publishes > l.monthlyPublishes) errors.push("monthly publish quota exceeded");
    if (usage.storageBytes > l.maxStorageBytes) errors.push("storage quota exceeded");
    return { allowed: errors.length === 0, errors, limits: l };
  }
}
