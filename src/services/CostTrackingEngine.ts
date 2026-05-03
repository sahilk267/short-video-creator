import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export type CostCategory = "api_pexels" | "api_pixabay" | "api_translate" | "tts" | "rendering" | "publishing" | "storage" | "other";

export interface CostRecord {
  id: string;
  category: CostCategory;
  description: string;
  units: number;
  costPerUnit: number;
  totalCost: number;
  currency: string;
  recordedAt: string;
  tenantId?: string;
}

export interface CostSummary {
  totalCost: number;
  byCategory: Record<CostCategory, number>;
  byDay: { date: string; cost: number }[];
  currency: string;
  periodStart: string;
  periodEnd: string;
}

const COST_RATES: Record<CostCategory, number> = {
  api_pexels: 0.0,
  api_pixabay: 0.0,
  api_translate: 0.00002,
  tts: 0.000015,
  rendering: 0.001,
  publishing: 0.0,
  storage: 0.000023,
  other: 0.0,
};

export class CostTrackingEngine {
  private dataPath: string;
  private records: CostRecord[] = [];

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "cost-records.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dataPath)) this.records = fs.readJsonSync(this.dataPath);
    } catch { this.records = []; }
  }

  private save() {
    try { fs.writeJsonSync(this.dataPath, this.records, { spaces: 2 }); } catch { /* ignore */ }
  }

  record(category: CostCategory, description: string, units: number, customCostPerUnit?: number, tenantId?: string): CostRecord {
    const costPerUnit = customCostPerUnit ?? COST_RATES[category];
    const record: CostRecord = {
      id: `cost_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      category, description, units, costPerUnit,
      totalCost: units * costPerUnit,
      currency: "USD",
      recordedAt: new Date().toISOString(),
      tenantId,
    };
    this.records.push(record);
    if (this.records.length > 50000) this.records = this.records.slice(-40000);
    this.save();
    return record;
  }

  getSummary(fromDate?: Date, toDate?: Date): CostSummary {
    let filtered = [...this.records];
    if (fromDate) filtered = filtered.filter((r) => new Date(r.recordedAt) >= fromDate);
    if (toDate) filtered = filtered.filter((r) => new Date(r.recordedAt) <= toDate);

    const byCategory = {} as Record<CostCategory, number>;
    const byDayMap: Record<string, number> = {};

    for (const r of filtered) {
      byCategory[r.category] = (byCategory[r.category] || 0) + r.totalCost;
      const day = r.recordedAt.substring(0, 10);
      byDayMap[day] = (byDayMap[day] || 0) + r.totalCost;
    }

    const byDay = Object.entries(byDayMap).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, cost]) => ({ date, cost: Math.round(cost * 10000) / 10000 }));

    return {
      totalCost: Math.round(filtered.reduce((a, r) => a + r.totalCost, 0) * 10000) / 10000,
      byCategory,
      byDay,
      currency: "USD",
      periodStart: filtered[0]?.recordedAt || new Date().toISOString(),
      periodEnd: filtered[filtered.length - 1]?.recordedAt || new Date().toISOString(),
    };
  }

  getByTenant(tenantId: string): CostRecord[] {
    return this.records.filter((r) => r.tenantId === tenantId);
  }

  getRates(): typeof COST_RATES { return COST_RATES; }
}
