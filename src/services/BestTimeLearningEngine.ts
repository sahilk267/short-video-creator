import fs from "fs-extra";
import path from "path";
export interface TimeSlotPerformance {
  platform: string;
  category: string;
  dayOfWeek: number;
  hourUTC: number;
  totalPosts: number;
  avgEngagement: number;
  avgViews: number;
  avgLikes: number;
  lastUpdatedAt: string;
}

export interface BestTimeRecommendation {
  platform: string;
  category: string;
  bestHours: { hour: number; dayName: string; avgEngagement: number }[];
  timezone: string;
  confidence: "high" | "medium" | "low";
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_BEST_TIMES: Record<string, number[]> = {
  instagram: [8, 11, 14, 17, 20],
  tiktok: [6, 10, 14, 19, 22],
  youtube: [14, 15, 16, 17, 20],
  youtube_shorts: [8, 12, 16, 20],
  facebook: [9, 13, 16, 20],
  linkedin: [8, 12, 17, 18],
  telegram: [8, 12, 18, 21],
  x: [8, 9, 12, 17, 20],
};

export class BestTimeLearningEngine {
  private dataPath: string;
  private slots: TimeSlotPerformance[] = [];

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "best-time-data.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dataPath)) this.slots = fs.readJsonSync(this.dataPath);
    } catch { this.slots = []; }
  }

  private save() {
    try { fs.writeJsonSync(this.dataPath, this.slots, { spaces: 2 }); } catch { /* ignore */ }
  }

  recordPerformance(platform: string, category: string, publishedAt: Date, engagement: number, views: number, likes: number) {
    const dayOfWeek = publishedAt.getUTCDay();
    const hourUTC = publishedAt.getUTCHours();
    const existing = this.slots.find((s) => s.platform === platform && s.category === category && s.dayOfWeek === dayOfWeek && s.hourUTC === hourUTC);

    if (existing) {
      const n = existing.totalPosts;
      existing.avgEngagement = (existing.avgEngagement * n + engagement) / (n + 1);
      existing.avgViews = (existing.avgViews * n + views) / (n + 1);
      existing.avgLikes = (existing.avgLikes * n + likes) / (n + 1);
      existing.totalPosts++;
      existing.lastUpdatedAt = new Date().toISOString();
    } else {
      this.slots.push({
        platform, category, dayOfWeek, hourUTC, totalPosts: 1,
        avgEngagement: engagement, avgViews: views, avgLikes: likes,
        lastUpdatedAt: new Date().toISOString(),
      });
    }
    this.save();
  }

  getBestTimes(platform: string, category: string = "General"): BestTimeRecommendation {
    const platformSlots = this.slots
      .filter((s) => s.platform === platform && s.totalPosts >= 3)
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5);

    if (platformSlots.length >= 3) {
      return {
        platform, category,
        bestHours: platformSlots.map((s) => ({
          hour: s.hourUTC,
          dayName: DAY_NAMES[s.dayOfWeek],
          avgEngagement: Math.round(s.avgEngagement),
        })),
        timezone: "UTC",
        confidence: platformSlots.length >= 5 ? "high" : "medium",
      };
    }

    const defaults = DEFAULT_BEST_TIMES[platform] || [9, 13, 18];
    return {
      platform, category,
      bestHours: defaults.map((h) => ({ hour: h, dayName: "Any", avgEngagement: 0 })),
      timezone: "UTC",
      confidence: "low",
    };
  }

  getNextBestTime(platform: string): Date {
    const best = this.getBestTimes(platform);
    const now = new Date();
    const currentHour = now.getUTCHours();
    const bestHours = best.bestHours.map((b) => b.hour).sort((a, b) => a - b);
    const nextHour = bestHours.find((h) => h > currentHour) || bestHours[0];
    const next = new Date(now);
    if (nextHour <= currentHour) next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(nextHour, 0, 0, 0);
    return next;
  }
}
