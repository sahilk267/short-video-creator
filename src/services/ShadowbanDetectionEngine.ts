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

  generateRecoveryPlan(platform: string, accountId: string): RecoveryPlan {
    const status = this.analyze(platform, accountId);
    if (!status.isSuspected) {
      return {
        platform, accountId, severity: "none",
        steps: ["No recovery needed — account is performing normally"],
        estimatedRecoveryDays: 0,
        postingRestrictions: "Normal posting schedule",
        contentGuidelines: [],
        warmupSchedule: [],
      };
    }

    const warmupSchedule: WarmupDay[] = [];
    if (status.severity === "severe") {
      warmupSchedule.push(
        { day: 1, postsAllowed: 0, note: "Complete posting pause — no content" },
        { day: 2, postsAllowed: 0, note: "Continue pause — engage with other content only" },
        { day: 3, postsAllowed: 0, note: "Continue pause" },
        { day: 4, postsAllowed: 1, note: "1 evergreen post, NO hashtags" },
        { day: 5, postsAllowed: 1, note: "1 post, max 3 hashtags (niche only)" },
        { day: 6, postsAllowed: 1, note: "1 post, max 5 hashtags" },
        { day: 7, postsAllowed: 2, note: "Resume cautiously — 2 posts/day max" },
        { day: 10, postsAllowed: 3, note: "Gradual ramp up — 3 posts/day" },
        { day: 14, postsAllowed: 4, note: "Normal schedule resume if metrics improve" }
      );
    } else if (status.severity === "moderate") {
      warmupSchedule.push(
        { day: 1, postsAllowed: 1, note: "Reduce to 1 post/day, change hashtags" },
        { day: 3, postsAllowed: 1, note: "Continue reduced posting" },
        { day: 5, postsAllowed: 2, note: "Slowly increase if engagement recovers" },
        { day: 7, postsAllowed: 3, note: "Resume if metrics normalize" }
      );
    } else {
      warmupSchedule.push(
        { day: 1, postsAllowed: 2, note: "Slight reduction — change hashtag set" },
        { day: 3, postsAllowed: 3, note: "Monitor and adjust" }
      );
    }

    const steps: string[] = [];
    if (status.severity === "severe") {
      steps.push(
        "IMMEDIATE: Stop all posting for 48-72 hours",
        "Delete any content that may have triggered the ban",
        "Clear all hashtags from recent posts if platform allows",
        "Engage authentically — comment, like, and watch other content",
        "Review community guidelines and remove any borderline content",
        "After pause: resume with evergreen content, no trending hashtags",
        "Gradually increase posting frequency over 2 weeks"
      );
    } else if (status.severity === "moderate") {
      steps.push(
        "Reduce posting to 1x/day for the next 5-7 days",
        "Switch to a completely new hashtag set (avoid previously used tags)",
        "Post only high-quality evergreen content",
        "Avoid trending or controversial topics temporarily",
        "Engage with your audience's comments immediately after posting"
      );
    } else {
      steps.push(
        "Reduce hashtag count by 50% in next 3 posts",
        "Vary content format — try a new style or template",
        "Post at different times to test audience response",
        "Monitor engagement metrics daily"
      );
    }

    const plan: RecoveryPlan = {
      platform, accountId, severity: status.severity,
      steps,
      estimatedRecoveryDays: status.severity === "severe" ? 14 : status.severity === "moderate" ? 7 : 3,
      postingRestrictions: status.severity === "severe" ? "Pause for 3 days, then 1/day for 7 days" : "Reduce to 1-2/day",
      contentGuidelines: [
        "Use only original, high-quality content",
        "Avoid recycled or watermarked content",
        "Keep captions natural — no keyword stuffing",
        status.severity === "severe" ? "Avoid all hashtags for first 3 days" : "Use max 5 niche-specific hashtags",
      ],
      warmupSchedule,
    };

    const existingStatus = this.statuses.find((s) => s.platform === platform && s.accountId === accountId);
    if (existingStatus) {
      (existingStatus as ShadowbanStatus & { recoveryPlan?: RecoveryPlan }).recoveryPlan = plan;
      this.save();
    }

    logger.info({ platform, accountId, severity: status.severity }, "Shadowban recovery plan generated");
    return plan;
  }
}

export interface WarmupDay {
  day: number;
  postsAllowed: number;
  note: string;
}

export interface RecoveryPlan {
  platform: string;
  accountId: string;
  severity: ShadowbanStatus["severity"];
  steps: string[];
  estimatedRecoveryDays: number;
  postingRestrictions: string;
  contentGuidelines: string[];
  warmupSchedule: WarmupDay[];
}
