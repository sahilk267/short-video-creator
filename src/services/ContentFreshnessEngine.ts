import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export interface FreshnessRecord {
  keyword: string;
  category: string;
  lastUsedAt: string;
  useCount: number;
}

export interface FreshnessCheckResult {
  allowed: boolean;
  reason?: string;
  waitMs?: number;
  similarUsedAt?: string;
}

const FRESHNESS_RULES = {
  sameKeywordGapHours: 24,
  sameCategoryGapHours: 4,
  similarTopicSimilarity: 0.7,
};

export class ContentFreshnessEngine {
  private recordsPath: string;
  private records: FreshnessRecord[] = [];

  constructor(dataDirPath: string) {
    this.recordsPath = path.join(dataDirPath, "freshness-records.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.recordsPath)) this.records = fs.readJsonSync(this.recordsPath);
    } catch { this.records = []; }
  }

  private save() {
    try { fs.writeJsonSync(this.recordsPath, this.records, { spaces: 2 }); } catch { /* ignore */ }
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w) => w.length > 3).slice(0, 8);
  }

  check(keyword: string, category: string): FreshnessCheckResult {
    const now = Date.now();
    const kwLower = keyword.toLowerCase();

    const kwRecord = this.records.find((r) => r.keyword === kwLower && r.category === category);
    if (kwRecord) {
      const elapsed = now - new Date(kwRecord.lastUsedAt).getTime();
      const requiredMs = FRESHNESS_RULES.sameKeywordGapHours * 3600 * 1000;
      if (elapsed < requiredMs) {
        return {
          allowed: false,
          reason: `Keyword "${keyword}" used ${Math.round(elapsed / 60000)} min ago (need ${FRESHNESS_RULES.sameKeywordGapHours}h gap)`,
          waitMs: requiredMs - elapsed,
          similarUsedAt: kwRecord.lastUsedAt,
        };
      }
    }

    const catRecords = this.records.filter((r) => r.category === category);
    const recentCat = catRecords.filter((r) => {
      const elapsed = now - new Date(r.lastUsedAt).getTime();
      return elapsed < FRESHNESS_RULES.sameCategoryGapHours * 3600 * 1000;
    });

    if (recentCat.length >= 3) {
      const oldest = recentCat.sort((a, b) => new Date(a.lastUsedAt).getTime() - new Date(b.lastUsedAt).getTime())[0];
      const elapsed = now - new Date(oldest.lastUsedAt).getTime();
      const requiredMs = FRESHNESS_RULES.sameCategoryGapHours * 3600 * 1000;
      return {
        allowed: false,
        reason: `Category "${category}" has ${recentCat.length} recent posts. Need ${FRESHNESS_RULES.sameCategoryGapHours}h gap.`,
        waitMs: requiredMs - elapsed,
      };
    }

    return { allowed: true };
  }

  record(keyword: string, category: string) {
    const kwLower = keyword.toLowerCase();
    const existing = this.records.find((r) => r.keyword === kwLower && r.category === category);
    if (existing) {
      existing.lastUsedAt = new Date().toISOString();
      existing.useCount++;
    } else {
      this.records.push({ keyword: kwLower, category, lastUsedAt: new Date().toISOString(), useCount: 1 });
    }
    if (this.records.length > 5000) this.records = this.records.slice(-4000);
    this.save();
  }

  getRecentByCategory(category: string, hours = 24): FreshnessRecord[] {
    const since = Date.now() - hours * 3600 * 1000;
    return this.records.filter((r) => r.category === category && new Date(r.lastUsedAt).getTime() > since);
  }
}
