import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export interface TrendHijackResult {
  originalTopic: string;
  niche: string;
  hijackedHook: string;
  adaptedTitle: string;
  formatSuggestion: string;
  audioTrend?: string;
  isEvergreen: boolean;
  confidence: number;
}

export interface TrendFormat {
  name: string;
  template: string;
  platforms: string[];
  engagementMultiplier: number;
}

const TREND_FORMATS: TrendFormat[] = [
  { name: "POV", template: "POV: You just discovered {topic} changes everything", platforms: ["tiktok", "instagram"], engagementMultiplier: 1.8 },
  { name: "Would you rather", template: "Would you rather: {topic} or stick with old ways?", platforms: ["tiktok", "instagram"], engagementMultiplier: 1.6 },
  { name: "This or That", template: "{topic}: This or That? Comment below!", platforms: ["tiktok", "instagram"], engagementMultiplier: 1.5 },
  { name: "Expectation vs Reality", template: "{topic} Expectation vs Reality 💀", platforms: ["tiktok", "instagram", "youtube"], engagementMultiplier: 1.7 },
  { name: "Day in the life", template: "Day in the life of someone who mastered {topic}", platforms: ["tiktok", "instagram", "youtube"], engagementMultiplier: 1.4 },
  { name: "Rating Trend", template: "Rating every {topic} tip from 1-10 🔥", platforms: ["tiktok", "instagram"], engagementMultiplier: 1.6 },
  { name: "Hot Take", template: "Unpopular opinion: {topic} is overrated (here's why)", platforms: ["x", "tiktok", "youtube"], engagementMultiplier: 2.1 },
  { name: "Story Time", template: "Story time: How {topic} completely changed my life", platforms: ["tiktok", "instagram", "youtube"], engagementMultiplier: 1.9 },
];

const TRENDING_AUDIO_TRENDS = [
  "Original sound - viral voiceover",
  "Trending beat drop",
  "CapCut viral audio",
  "Dramatic orchestra swell",
  "Lo-fi study beats",
  "Comedy sound effect",
];

const EVERGREEN_TOPICS = ["how to", "tips", "guide", "ultimate", "best", "complete", "master", "learn"];

interface HijackRecord {
  topic: string;
  niche: string;
  createdAt: string;
  result: TrendHijackResult;
}

export class TrendHijackingEngine {
  private dataPath: string;
  private records: HijackRecord[] = [];

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "trend-hijacking.json");
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

  private isEvergreen(topic: string): boolean {
    const lower = topic.toLowerCase();
    return EVERGREEN_TOPICS.some((kw) => lower.includes(kw));
  }

  private pickBestFormat(platform?: string, engagementThreshold = 1.5): TrendFormat {
    const candidates = platform
      ? TREND_FORMATS.filter((f) => f.platforms.includes(platform.toLowerCase()))
      : TREND_FORMATS;
    const high = candidates.filter((f) => f.engagementMultiplier >= engagementThreshold);
    const pool = high.length > 0 ? high : candidates;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  hijackTrend(topic: string, niche: string, platform?: string): TrendHijackResult {
    try {
      const format = this.pickBestFormat(platform);
      const hijackedHook = format.template.replace(/\{topic\}/g, topic);
      const nicheTag = niche ? ` [${niche}]` : "";
      const adaptedTitle = `${hijackedHook}${nicheTag}`;
      const audioTrend = TRENDING_AUDIO_TRENDS[Math.floor(Math.random() * TRENDING_AUDIO_TRENDS.length)];
      const isEvergreen = this.isEvergreen(topic);
      const confidence = Math.round((format.engagementMultiplier / 2.1) * 100);

      const result: TrendHijackResult = {
        originalTopic: topic,
        niche,
        hijackedHook,
        adaptedTitle,
        formatSuggestion: format.name,
        audioTrend,
        isEvergreen,
        confidence,
      };

      this.records.push({ topic, niche, createdAt: new Date().toISOString(), result });
      if (this.records.length > 2000) this.records = this.records.slice(-1500);
      this.save();
      logger.debug({ topic, niche, format: format.name }, "Trend hijacked");
      return result;
    } catch (err) {
      logger.error({ err, topic }, "TrendHijackingEngine error");
      return {
        originalTopic: topic, niche, hijackedHook: `The truth about ${topic} nobody tells you`,
        adaptedTitle: `${topic} — What you need to know`, formatSuggestion: "Hot Take",
        isEvergreen: true, confidence: 50,
      };
    }
  }

  getEvergreenFallback(niche: string): TrendHijackResult {
    const fallbackTopics: Record<string, string> = {
      tech: "AI tools", finance: "saving money", health: "daily habits",
      food: "quick meals", fitness: "workout routines", education: "learning faster",
    };
    const topic = fallbackTopics[niche.toLowerCase()] || `${niche} basics`;
    return this.hijackTrend(topic, niche);
  }

  getAllFormats(): TrendFormat[] { return TREND_FORMATS; }
  getHistory(): HijackRecord[] { return this.records; }
}
