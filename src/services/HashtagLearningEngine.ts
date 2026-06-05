import fs from "fs-extra";
import path from "path";
export interface HashtagPerformance {
  hashtag: string;
  platform: string;
  category: string;
  totalUses: number;
  avgImpressions: number;
  avgReach: number;
  avgEngagement: number;
  lastUsedAt: string;
  trending: boolean;
  score: number;
}

export interface HashtagRecommendation {
  hashtags: string[];
  mix: { top: string[]; medium: string[]; niche: string[] };
  platform: string;
  category: string;
}

const DEFAULT_HASHTAGS: Record<string, Record<string, string[]>> = {
  instagram: {
    General: ["#viral", "#trending", "#reels", "#explore", "#fyp"],
    Tech: ["#technology", "#ai", "#coding", "#tech", "#innovation"],
    Business: ["#entrepreneur", "#business", "#success", "#marketing", "#startup"],
    Motivation: ["#motivation", "#mindset", "#success", "#inspiration", "#goals"],
    News: ["#news", "#breakingnews", "#world", "#trending", "#update"],
  },
  youtube: {
    General: ["#shorts", "#viral", "#trending", "#youtube"],
    Tech: ["#technology", "#ai", "#programming", "#tech"],
  },
  tiktok: {
    General: ["#fyp", "#foryou", "#viral", "#trending"],
    Tech: ["#tech", "#ai", "#coding", "#learnontiktok"],
  },
  linkedin: {
    General: ["#innovation", "#leadership", "#future"],
    Business: ["#entrepreneur", "#business", "#startup", "#growth"],
  },
};

export class HashtagLearningEngine {
  private dataPath: string;
  private performances: HashtagPerformance[] = [];

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "hashtag-performance.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dataPath)) this.performances = fs.readJsonSync(this.dataPath);
    } catch { this.performances = []; }
  }

  private save() {
    try { fs.writeJsonSync(this.dataPath, this.performances, { spaces: 2 }); } catch { /* ignore */ }
  }

  recordPerformance(hashtag: string, platform: string, category: string, impressions: number, reach: number, engagement: number) {
    const existing = this.performances.find((p) => p.hashtag === hashtag && p.platform === platform);
    if (existing) {
      const n = existing.totalUses;
      existing.avgImpressions = (existing.avgImpressions * n + impressions) / (n + 1);
      existing.avgReach = (existing.avgReach * n + reach) / (n + 1);
      existing.avgEngagement = (existing.avgEngagement * n + engagement) / (n + 1);
      existing.totalUses++;
      existing.score = this.calcScore(existing);
      existing.trending = engagement > existing.avgEngagement * 1.5;
      existing.lastUsedAt = new Date().toISOString();
    } else {
      const perf: HashtagPerformance = {
        hashtag, platform, category, totalUses: 1,
        avgImpressions: impressions, avgReach: reach, avgEngagement: engagement,
        lastUsedAt: new Date().toISOString(), trending: false, score: 50,
      };
      perf.score = this.calcScore(perf);
      this.performances.push(perf);
    }
    this.save();
  }

  private calcScore(p: HashtagPerformance): number {
    const engScore = Math.min(50, p.avgEngagement * 10);
    const impScore = Math.min(30, (p.avgImpressions / 1000) * 3);
    const useScore = Math.min(20, p.totalUses * 2);
    return Math.round(engScore + impScore + useScore);
  }

  recommend(platform: string, category: string, count = 15): HashtagRecommendation {
    const learned = this.performances
      .filter((p) => p.platform === platform)
      .sort((a, b) => b.score - a.score);

    const defaults = DEFAULT_HASHTAGS[platform]?.[category] || DEFAULT_HASHTAGS[platform]?.General || [];
    const learnedTags = learned.map((p) => p.hashtag);
    const top = learnedTags.slice(0, 5).length > 0 ? learnedTags.slice(0, 5) : defaults.slice(0, 3);
    const medium = learnedTags.slice(5, 10).length > 0 ? learnedTags.slice(5, 10) : defaults.slice(3);
    const niche = [`#${category.toLowerCase()}`, `#${platform}creator`, `#content`];

    const all = [...new Set([...top, ...medium, ...niche])].slice(0, count);
    return { hashtags: all, mix: { top, medium, niche }, platform, category };
  }

  getTrending(platform: string): HashtagPerformance[] {
    return this.performances.filter((p) => p.platform === platform && p.trending)
      .sort((a, b) => b.score - a.score).slice(0, 10);
  }

  getAll(platform?: string): HashtagPerformance[] {
    return platform ? this.performances.filter((p) => p.platform === platform) : this.performances;
  }
}
