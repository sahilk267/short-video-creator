import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export type BucketType = "viral_trending" | "evergreen" | "educational" | "personal_brand";

export interface ContentBucket {
  type: BucketType;
  label: string;
  targetPercent: number;
  currentPercent: number;
  count: number;
  description: string;
}

export interface BucketRecord {
  videoId: string;
  bucketType: BucketType;
  category: string;
  addedAt: string;
}

const DEFAULT_TARGETS: Record<BucketType, number> = {
  viral_trending: 40,
  evergreen: 25,
  educational: 20,
  personal_brand: 15,
};

const BUCKET_KEYWORDS: Record<BucketType, string[]> = {
  viral_trending: ["breaking", "trending", "viral", "latest", "news", "today", "now", "update"],
  evergreen: ["how to", "guide", "tutorial", "tips", "secrets", "ultimate", "complete", "best"],
  educational: ["explained", "learn", "understand", "what is", "why", "science", "facts", "history"],
  personal_brand: ["my story", "i learned", "my experience", "opinion", "thoughts", "journey"],
};

export class ContentBucketEngine {
  private recordsPath: string;
  private records: BucketRecord[] = [];
  private targets: Record<BucketType, number>;

  constructor(dataDirPath: string, targets?: Partial<Record<BucketType, number>>) {
    this.recordsPath = path.join(dataDirPath, "content-buckets.json");
    this.targets = { ...DEFAULT_TARGETS, ...targets };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.recordsPath)) {
        this.records = fs.readJsonSync(this.recordsPath);
      }
    } catch { this.records = []; }
  }

  private save() {
    try { fs.writeJsonSync(this.recordsPath, this.records, { spaces: 2 }); } catch { /* ignore */ }
  }

  detectBucket(title: string, category: string): BucketType {
    const lower = (title + " " + category).toLowerCase();
    const scores: Record<BucketType, number> = {
      viral_trending: 0, evergreen: 0, educational: 0, personal_brand: 0,
    };
    for (const [bucket, keywords] of Object.entries(BUCKET_KEYWORDS) as [BucketType, string[]][]) {
      for (const kw of keywords) {
        if (lower.includes(kw)) scores[bucket]++;
      }
    }
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    return sorted[0][0] as BucketType;
  }

  addContent(videoId: string, title: string, category: string, bucketOverride?: BucketType): BucketRecord {
    const bucketType = bucketOverride || this.detectBucket(title, category);
    const record: BucketRecord = { videoId, bucketType, category, addedAt: new Date().toISOString() };
    this.records.push(record);
    this.save();
    logger.debug({ videoId, bucketType }, "Content added to bucket");
    return record;
  }

  getStats(): ContentBucket[] {
    const total = this.records.length || 1;
    const counts = { viral_trending: 0, evergreen: 0, educational: 0, personal_brand: 0 };
    for (const r of this.records) counts[r.bucketType]++;

    const labels: Record<BucketType, string> = {
      viral_trending: "Viral & Trending", evergreen: "Evergreen",
      educational: "Educational", personal_brand: "Personal Brand",
    };
    const descs: Record<BucketType, string> = {
      viral_trending: "Trending topics, breaking news, viral content",
      evergreen: "Timeless content that stays relevant",
      educational: "How-to, explainers, tutorials",
      personal_brand: "Opinion, stories, brand voice",
    };

    return (Object.keys(DEFAULT_TARGETS) as BucketType[]).map((type) => ({
      type,
      label: labels[type],
      targetPercent: this.targets[type],
      currentPercent: Math.round((counts[type] / total) * 100),
      count: counts[type],
      description: descs[type],
    }));
  }

  getNextRecommendedBucket(): BucketType {
    const stats = this.getStats();
    const mostUnder = stats.sort((a, b) => (a.targetPercent - a.currentPercent) - (b.targetPercent - b.currentPercent));
    return mostUnder[mostUnder.length - 1].type;
  }

  updateTargets(newTargets: Partial<Record<BucketType, number>>) {
    const total = Object.values({ ...this.targets, ...newTargets }).reduce((a, b) => a + b, 0);
    if (total !== 100) throw new Error("Bucket targets must sum to 100");
    this.targets = { ...this.targets, ...newTargets };
  }
}
