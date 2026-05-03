import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export interface PlatformMetrics {
  platform: string;
  accountId: string;
  date: string;
  impressions: number;
  engagement: number;
  reach: number;
  followerCount: number;
}

export interface ShadowbanStatus {
  platform: string;
  accountId: string;
  isSuspected: boolean;
  severity: "none" | "mild" | "moderate" | "severe";
  engagementDrop: number;
  impressionDrop: number;
  detectedAt?: string;
  recommendation: string;
  autoAction: "none" | "pause" | "reduce_frequency" | "change_hashtags";
}

const THRESHOLDS = {
  engagementDropPercent: 70,
  impressionDropPercent: 80,
  analysisDays: 7,
};

export class ShadowbanDetectionEngine {
  private metricsPath: string;
  private metrics: PlatformMetrics[] = [];
  private statusPath: string;
  private statuses: ShadowbanStatus[] = [];

  constructor(dataDirPath: string) {
    this.metricsPath = path.join(dataDirPath, "platform-metrics.json");
    this.statusPath = path.join(dataDirPath, "shadowban-status.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.metricsPath)) this.metrics = fs.readJsonSync(this.metricsPath);
      if (fs.existsSync(this.statusPath)) this.statuses = fs.readJsonSync(this.statusPath);
    } catch { /* ignore */ }
  }

  private save() {
    try {
      fs.writeJsonSync(this.metricsPath, this.metrics, { spaces: 2 });
      fs.writeJsonSync(this.statusPath, this.statuses, { spaces: 2 });
    } catch { /* ignore */ }
  }

  recordMetrics(metrics: PlatformMetrics) {
    this.metrics.push(metrics);
    if (this.metrics.length > 10000) this.metrics = this.metrics.slice(-8000);
    this.save();
  }

  analyze(platform: string, accountId: string): ShadowbanStatus {
    const accountMetrics = this.metrics
      .filter((m) => m.platform === platform && m.accountId === accountId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (accountMetrics.length < 4) {
      return {
        platform, accountId, isSuspected: false, severity: "none",
        engagementDrop: 0, impressionDrop: 0, recommendation: "Not enough data yet",
        autoAction: "none",
      };
    }

    const half = Math.floor(accountMetrics.length / 2);
    const baseline = accountMetrics.slice(0, half);
    const recent = accountMetrics.slice(half);

    const avgBaselineEngagement = baseline.reduce((a, m) => a + m.engagement, 0) / baseline.length;
    const avgRecentEngagement = recent.reduce((a, m) => a + m.engagement, 0) / recent.length;
    const avgBaselineImpressions = baseline.reduce((a, m) => a + m.impressions, 0) / baseline.length;
    const avgRecentImpressions = recent.reduce((a, m) => a + m.impressions, 0) / recent.length;

    const engagementDrop = avgBaselineEngagement > 0
      ? Math.round(((avgBaselineEngagement - avgRecentEngagement) / avgBaselineEngagement) * 100) : 0;
    const impressionDrop = avgBaselineImpressions > 0
      ? Math.round(((avgBaselineImpressions - avgRecentImpressions) / avgBaselineImpressions) * 100) : 0;

    let severity: ShadowbanStatus["severity"] = "none";
    let isSuspected = false;
    let recommendation = "Account performing normally";
    let autoAction: ShadowbanStatus["autoAction"] = "none";

    if (impressionDrop >= THRESHOLDS.impressionDropPercent || engagementDrop >= THRESHOLDS.engagementDropPercent) {
      isSuspected = true;
      severity = "severe";
      recommendation = "Severe shadowban detected. Pause posting for 48-72h, clear hashtags, review recent content for violations.";
      autoAction = "pause";
    } else if (impressionDrop >= 50 || engagementDrop >= 50) {
      isSuspected = true;
      severity = "moderate";
      recommendation = "Moderate drop detected. Reduce posting frequency and change hashtag strategy.";
      autoAction = "reduce_frequency";
    } else if (impressionDrop >= 30 || engagementDrop >= 30) {
      severity = "mild";
      recommendation = "Mild engagement drop. Try varying content style and hashtags.";
      autoAction = "change_hashtags";
    }

    const status: ShadowbanStatus = {
      platform, accountId, isSuspected, severity, engagementDrop, impressionDrop,
      detectedAt: isSuspected ? new Date().toISOString() : undefined,
      recommendation, autoAction,
    };

    const existingIdx = this.statuses.findIndex((s) => s.platform === platform && s.accountId === accountId);
    if (existingIdx >= 0) this.statuses[existingIdx] = status;
    else this.statuses.push(status);
    this.save();

    if (isSuspected) logger.warn({ platform, accountId, severity, engagementDrop, impressionDrop }, "Shadowban suspected");
    return status;
  }

  getAllStatuses(): ShadowbanStatus[] { return this.statuses; }

  getStatus(platform: string, accountId: string): ShadowbanStatus | undefined {
    return this.statuses.find((s) => s.platform === platform && s.accountId === accountId);
  }
}
