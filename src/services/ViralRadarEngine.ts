/* eslint-disable @remotion/deterministic-randomness */

import { logger } from "../logger";
import { TrendEngine, type TrendTopic } from "./TrendEngine";

export interface ViralAlert {
  id: string;
  title: string;
  category: string;
  source: string;
  priority: "critical" | "high" | "medium";
  risingScore: number;
  saturationScore: number;
  action: "generate_now" | "queue_soon" | "monitor";
  detectedAt: string;
  keywords: string[];
  bypassQueue: boolean;
}

export interface RadarResult {
  alerts: ViralAlert[];
  scanAt: string;
  criticalCount: number;
  highCount: number;
}

export class ViralRadarEngine {
  private trendEngine: TrendEngine;
  private history: Map<string, { score: number; seenAt: number }[]> = new Map();
  private readonly SATURATION_THRESHOLD = 70;
  private readonly RISING_FAST_BOOST = 25;

  constructor(trendEngine: TrendEngine) {
    this.trendEngine = trendEngine;
  }

  private computeRisingScore(topic: TrendTopic): number {
    const key = topic.title.toLowerCase().substring(0, 40);
    const history = this.history.get(key) || [];
    history.push({ score: topic.trendScore, seenAt: Date.now() });
    if (history.length > 10) history.shift();
    this.history.set(key, history);

    if (history.length < 2) return topic.trendScore;
    const prev = history[history.length - 2].score;
    const curr = history[history.length - 1].score;
    const delta = curr - prev;
    return Math.min(100, topic.trendScore + (delta > 10 ? this.RISING_FAST_BOOST : 0));
  }

  private computeSaturation(topic: TrendTopic): number {
    const key = topic.title.toLowerCase().substring(0, 40);
    const history = this.history.get(key) || [];
    if (history.length < 3) return 0;
    const scores = history.map((h) => h.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const isFlat = scores.slice(-3).every((s) => Math.abs(s - avg) < 5);
    return isFlat ? Math.min(100, avg + 20) : avg * 0.6;
  }

  private prioritize(rising: number, saturation: number): ViralAlert["priority"] {
    if (saturation > this.SATURATION_THRESHOLD) return "medium";
    if (rising >= 85) return "critical";
    if (rising >= 65) return "high";
    return "medium";
  }

  private action(priority: ViralAlert["priority"], saturation: number): ViralAlert["action"] {
    if (saturation > this.SATURATION_THRESHOLD) return "monitor";
    if (priority === "critical") return "generate_now";
    if (priority === "high") return "queue_soon";
    return "monitor";
  }

  async scan(): Promise<RadarResult> {
    const trends = await this.trendEngine.fetchTrends();
    const alerts: ViralAlert[] = [];

    for (const topic of trends.topics) {
      const risingScore = this.computeRisingScore(topic);
      const saturationScore = this.computeSaturation(topic);
      const priority = this.prioritize(risingScore, saturationScore);
      const action = this.action(priority, saturationScore);

      if (priority === "critical" || priority === "high") {
        alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          title: topic.title,
          category: topic.category,
          source: topic.source,
          priority,
          risingScore,
          saturationScore,
          action,
          detectedAt: new Date().toISOString(),
          keywords: topic.keywords,
          bypassQueue: priority === "critical",
        });
      }
    }

    const result: RadarResult = {
      alerts: alerts.sort((a, b) => b.risingScore - a.risingScore).slice(0, 20),
      scanAt: new Date().toISOString(),
      criticalCount: alerts.filter((a) => a.priority === "critical").length,
      highCount: alerts.filter((a) => a.priority === "high").length,
    };

    logger.info({ critical: result.criticalCount, high: result.highCount }, "Viral radar scan complete");
    return result;
  }
}
