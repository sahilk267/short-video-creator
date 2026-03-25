import fs from "fs-extra";
import path from "path";

export interface UsageRecord {
  tenantId: string;
  month: string;
  renders: number;
  publishes: number;
  storageBytes: number;
  estimatedCostUsd: number;
}

export class TenantUsageStore {
  private storePath: string;

  constructor(basePath: string) {
    this.storePath = path.join(basePath, "tenantUsage.json");
    fs.ensureFileSync(this.storePath);
    if (!fs.readFileSync(this.storePath, "utf-8").trim()) {
      fs.writeFileSync(this.storePath, "[]", "utf-8");
    }
  }

  private async readAll(): Promise<UsageRecord[]> {
    const content = await fs.readFile(this.storePath, "utf-8");
    if (!content.trim()) return [];
    try { return JSON.parse(content) as UsageRecord[]; } catch { return []; }
  }

  private async writeAll(records: UsageRecord[]): Promise<void> {
    await fs.writeFile(this.storePath, JSON.stringify(records, null, 2), "utf-8");
  }

  async upsert(record: UsageRecord): Promise<UsageRecord> {
    const current = await this.readAll();
    const idx = current.findIndex((r) => r.tenantId === record.tenantId && r.month === record.month);
    if (idx >= 0) {
      current[idx] = record;
    } else {
      current.push(record);
    }
    await this.writeAll(current);
    return record;
  }

  async get(tenantId: string, month: string): Promise<UsageRecord | undefined> {
    return (await this.readAll()).find((r) => r.tenantId === tenantId && r.month === month);
  }
}
