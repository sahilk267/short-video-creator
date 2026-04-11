/**
 * Goal Service - Defines what "success" means for each goal
 * 
 * Goals drive behavior:
 * - maximize_engagement: higher quality bar, more retries
 * - fast_generation: lower quality bar, fewer retries
 * - cost_optimized: minimal retries, accept good-enough
 * - balanced: medium on all axes
 */

import { logger } from "../logger";

export type GoalType = "maximize_engagement" | "fast_generation" | "cost_optimized" | "balanced";

export interface Goal {
  name: GoalType;
  scoreThreshold: number;          // Min score to accept
  maxRetries: number;              // Max retry attempts
  maxTotalDurationMs: number;      // Max time per video
  retryBudget: "quality" | "speed"; // How to allocate retry attempts
  assetRetries: number;            // Separate retry budget for assets
  prioritizeSpeed: boolean;        // Prefer faster over perfect
  failureMode: "strict" | "lenient"; // "strict": fail fast, "lenient": keep trying
}

export class GoalService {
  private goals: Map<GoalType, Goal> = new Map();

  constructor() {
    this.initializeDefaultGoals();
  }

  /**
   * Set up built-in goals
   */
  private initializeDefaultGoals(): void {
    this.goals.set("maximize_engagement", {
      name: "maximize_engagement",
      scoreThreshold: 75,           // High bar
      maxRetries: 3,                // More attempts
      maxTotalDurationMs: 120_000,  // 2 minutes
      retryBudget: "quality",       // Quality-focused
      assetRetries: 2,
      prioritizeSpeed: false,
      failureMode: "strict",        // Reject poor quality entirely
    });

    this.goals.set("fast_generation", {
      name: "fast_generation",
      scoreThreshold: 60,           // Lower bar
      maxRetries: 1,                // Minimal retries
      maxTotalDurationMs: 30_000,   // 30 seconds
      retryBudget: "speed",         // Speed-focused
      assetRetries: 1,
      prioritizeSpeed: true,
      failureMode: "lenient",       // Accept good-enough
    });

    this.goals.set("cost_optimized", {
      name: "cost_optimized",
      scoreThreshold: 65,           // Minimal threshold
      maxRetries: 2,                // Few retries
      maxTotalDurationMs: 60_000,   // 1 minute
      retryBudget: "speed",         // Speed-focused
      assetRetries: 1,
      prioritizeSpeed: true,
      failureMode: "lenient",       // Accept quickly
    });

    this.goals.set("balanced", {
      name: "balanced",
      scoreThreshold: 70,           // Medium bar
      maxRetries: 2,                // Standard retries
      maxTotalDurationMs: 90_000,   // 1.5 minutes
      retryBudget: "quality",       // Quality-focused but reasonable
      assetRetries: 2,
      prioritizeSpeed: false,
      failureMode: "strict",        // Reasonable quality
    });
  }

  /**
   * Get goal by name
   */
  getGoal(goalType: GoalType): Goal | null {
    const goal = this.goals.get(goalType);
    if (!goal) {
      logger.warn({ goalType }, "Unknown goal, using balanced");
      return this.goals.get("balanced") || null;
    }
    return goal;
  }

  /**
   * Register custom goal
   */
  registerGoal(goal: Goal): void {
    this.goals.set(goal.name, goal);
    logger.info({ goalName: goal.name }, "Custom goal registered");
  }

  /**
   * Select goal based on context
   */
  selectGoal(context: {
    category?: string;
    platform?: string;
    isLiveEvent?: boolean;  // Cricket live = fast
    audienceSize?: "small" | "medium" | "large";
  }): Goal {
    // Live events → fast
    if (context.isLiveEvent) {
      return this.goals.get("fast_generation")!;
    }

    // Small audience → cost optimized
    if (context.audienceSize === "small") {
      return this.goals.get("cost_optimized")!;
    }

    // Large audience → maximize engagement
    if (context.audienceSize === "large") {
      return this.goals.get("maximize_engagement")!;
    }

    // News/Breaking → fast
    if (context.category === "News" || context.category === "Politics") {
      return this.goals.get("fast_generation")!;
    }

    // Everything else → balanced
    return this.goals.get("balanced")!;
  }

  /**
   * Adjust goal based on performance
   */
  adaptGoal(goal: Goal, metrics: {
    failureRate: number;  // 0-1
    averageRetries: number;
    averageDurationMs: number;
  }): Goal {
    // If failing too often, ease up
    if (metrics.failureRate > 0.3) {
      logger.info(
        { failureRate: metrics.failureRate },
        "High failure rate, easing goal"
      );
      return {
        ...goal,
        scoreThreshold: Math.max(50, goal.scoreThreshold - 5),
        maxRetries: Math.max(1, goal.maxRetries - 1),
        failureMode: "lenient",
      };
    }

    // If too slow, speed up
    if (metrics.averageDurationMs > goal.maxTotalDurationMs * 0.8) {
      logger.info(
        { durationMs: metrics.averageDurationMs },
        "Slow generation, speeding up"
      );
      return {
        ...goal,
        maxRetries: Math.max(1, goal.maxRetries - 1),
        prioritizeSpeed: true,
      };
    }

    return goal;
  }

  /**
   * Get all goals for API
   */
  listGoals(): Goal[] {
    return Array.from(this.goals.values());
  }

  /**
   * Validate goal is achievable
   */
  isGoalAchievable(goal: Goal): boolean {
    // Sanity checks
    if (goal.scoreThreshold < 0 || goal.scoreThreshold > 100) {
      logger.warn({ threshold: goal.scoreThreshold }, "Invalid threshold");
      return false;
    }

    if (goal.maxRetries < 0) {
      logger.warn({ maxRetries: goal.maxRetries }, "Invalid maxRetries");
      return false;
    }

    if (goal.maxTotalDurationMs < 5000) {
      logger.warn({ maxDurationMs: goal.maxTotalDurationMs }, "Duration too short");
      return false;
    }

    return true;
  }
}
