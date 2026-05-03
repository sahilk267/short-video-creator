import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export interface AccountMetrics {
  totalVideos: number;
  totalViews: number;
  averageEngagement: number;
  followersGained: number;
  accountHealth: number;
  accountTier: "starter" | "growth" | "professional" | "elite";
}

export interface AccountGoal {
  goalId: string;
  type: "views" | "engagement" | "followers" | "growth";
  target: number;
  current: number;
  deadline: string;
  progress: number;
}

export class AccountManagerEngine {
  private dataPath: string;

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "account-metrics.json");
  }

  calculateAccountMetrics(
    totalVideos: number,
    totalViews: number,
    totalEngagement: number,
    followersGained: number,
  ): AccountMetrics {
    const averageEngagement = totalVideos > 0 ? totalEngagement / totalVideos : 0;

    let accountHealth = 50;
    if (averageEngagement > 0.05) accountHealth += 15;
    if (totalViews > 10000) accountHealth += 20;
    if (followersGained > 100) accountHealth += 15;

    let accountTier: "starter" | "growth" | "professional" | "elite" = "starter";
    if (totalViews > 100000) accountTier = "professional";
    if (totalViews > 1000000) accountTier = "elite";
    if (totalViews > 10000) accountTier = "growth";

    return {
      totalVideos,
      totalViews,
      averageEngagement,
      followersGained,
      accountHealth: Math.min(100, accountHealth),
      accountTier,
    };
  }

  setGoal(type: "views" | "engagement" | "followers" | "growth", target: number, deadline: string): AccountGoal {
    const goalId = `goal_${Date.now()}`;
    return {
      goalId,
      type,
      target,
      current: 0,
      deadline,
      progress: 0,
    };
  }

  updateGoalProgress(goal: AccountGoal, currentValue: number): AccountGoal {
    return {
      ...goal,
      current: currentValue,
      progress: (currentValue / goal.target) * 100,
    };
  }

  getAccountGuidance(metrics: AccountMetrics): string[] {
    const guidance: string[] = [];

    if (metrics.accountHealth < 50) {
      guidance.push("Focus on engagement - your videos need more interaction");
    }

    if (metrics.averageEngagement < 0.02) {
      guidance.push("Try different content formats or posting times");
    }

    if (metrics.accountTier === "starter") {
      guidance.push("Aim for 10K views to reach Growth tier");
    }

    if (metrics.followersGained < 10) {
      guidance.push("Include clear CTAs in your videos to grow followers");
    }

    if (metrics.accountHealth >= 80) {
      guidance.push("You're doing great! Keep up this quality");
    }

    return guidance;
  }

  saveMetrics(metrics: AccountMetrics): void {
    try {
      fs.ensureFileSync(this.dataPath);
      fs.writeJsonSync(this.dataPath, { ...metrics, savedAt: new Date().toISOString() }, { spaces: 2 });
    } catch (err) {
      logger.error({ err }, "Failed to save account metrics");
    }
  }

  loadMetrics(): AccountMetrics | null {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readJsonSync(this.dataPath);
        return {
          totalVideos: data.totalVideos || 0,
          totalViews: data.totalViews || 0,
          averageEngagement: data.averageEngagement || 0,
          followersGained: data.followersGained || 0,
          accountHealth: data.accountHealth || 0,
          accountTier: data.accountTier || "starter",
        };
      }
    } catch (err) {
      logger.warn("Failed to load account metrics");
    }
    return null;
  }
}
