import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export type RecycleAction = "repost" | "repurpose" | "recycle" | "archive";

export interface RecycleCandidate {
  videoId: string;
  title: string;
  category: string;
  originalCreatedAt: string;
  ageDays: number;
  viewCount: number;
  engagementScore: number;
  recycleAction: RecycleAction;
  recycledCount: number;
  isEvergreen: boolean;
  nextScheduledAt?: string;
}

interface RecycleRecord {
  videoId: string;
  title: string;
  category: string;
  originalCreatedAt: string;
  viewCount: number;
  engagementScore: number;
  recycledCount: number;
  isEvergreen: boolean;
  lastRecycledAt?: string;
}

const RECYCLE_RULES = {
  repostAfterDays: 30,
  repurposeAfterDays: 90,
  evergreenRecycleAfterDays: 60,
};

export class ContentRecycleEngine {
  private recordsPath: string;
  private records: RecycleRecord[] = [];

  constructor(dataDirPath: string) {
    this.recordsPath = path.join(dataDirPath, "recycle-records.json");
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

  register(videoId: string, title: string, category: string, isEvergreen = false) {
    const existing = this.records.find((r) => r.videoId === videoId);
    if (existing) return;
    this.records.push({
      videoId, title, category, originalCreatedAt: new Date().toISOString(),
      viewCount: 0, engagementScore: 0, recycledCount: 0, isEvergreen,
    });
    this.save();
  }

  updateMetrics(videoId: string, viewCount: number, engagementScore: number) {
    const r = this.records.find((r) => r.videoId === videoId);
    if (!r) return;
    r.viewCount = viewCount;
    r.engagementScore = engagementScore;
    this.save();
  }

  getCandidates(): RecycleCandidate[] {
    const now = Date.now();
    const candidates: RecycleCandidate[] = [];

    for (const r of this.records) {
      const ageDays = Math.floor((now - new Date(r.originalCreatedAt).getTime()) / 86400000);
      let action: RecycleAction | null = null;

      if (r.isEvergreen && ageDays >= RECYCLE_RULES.evergreenRecycleAfterDays) action = "recycle";
      else if (ageDays >= RECYCLE_RULES.repurposeAfterDays) action = "repurpose";
      else if (ageDays >= RECYCLE_RULES.repostAfterDays && r.engagementScore > 60) action = "repost";

      if (action) {
        candidates.push({
          videoId: r.videoId, title: r.title, category: r.category,
          originalCreatedAt: r.originalCreatedAt, ageDays, viewCount: r.viewCount,
          engagementScore: r.engagementScore, recycleAction: action,
          recycledCount: r.recycledCount, isEvergreen: r.isEvergreen,
        });
      }
    }

    return candidates.sort((a, b) => b.engagementScore - a.engagementScore);
  }

  markRecycled(videoId: string) {
    const r = this.records.find((r) => r.videoId === videoId);
    if (!r) return;
    r.recycledCount++;
    r.lastRecycledAt = new Date().toISOString();
    this.save();
    logger.info({ videoId, recycledCount: r.recycledCount }, "Content marked as recycled");
  }

  getStats(): { total: number; readyToRecycle: number; evergreen: number } {
    const candidates = this.getCandidates();
    return {
      total: this.records.length,
      readyToRecycle: candidates.length,
      evergreen: this.records.filter((r) => r.isEvergreen).length,
    };
  }
}
