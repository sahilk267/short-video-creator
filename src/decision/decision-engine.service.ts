/**
 * Decision Engine Service - Core brain for intelligent decisions
 * 
 * Decides WHAT to do next based on:
 * - Current score and issues
 * - Current step in pipeline
 * - Retry count and limits
 * - Goal-driven criteria
 * 
 * Output: Specific action vs blind retry
 */

import { logger } from "../logger";

export type DecisionAction =
  | "accept"           // Script is good enough
  | "retry_full"       // Regenerate entire script
  | "fix_hook"         // Regenerate only opening
  | "fix_structure"    // Regenerate main body
  | "refetch_assets"   // Get different assets (not script)
  | "skip";            // Skip to next step

export interface DecisionContext {
  step: string;                    // "generation", "assets", "metadata", etc.
  score: number;                   // Quality score (0-100)
  issues: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
  retryCount: number;
  maxRetries: number;
  category: string;                // "Cricket", "News", etc.
  platform?: string;
  budget?: "speed" | "quality";    // Goal-driven budget
}

export interface DecisionOutput {
  action: DecisionAction;
  reason: string;
  estimatedCost: "low" | "medium" | "high";  // Time/CPU cost
}

export class DecisionEngineService {
  /**
   * Make a decision based on context
   */
  decide(context: DecisionContext): DecisionOutput {
    // Hard constraints first
    if (context.retryCount >= context.maxRetries) {
      logger.debug(
        { retryCount: context.retryCount, maxRetries: context.maxRetries },
        "Max retries exhausted, accepting"
      );
      return {
        action: "accept",
        reason: `Max retries (${context.maxRetries}) reached`,
        estimatedCost: "low",
      };
    }

    // Different logic per step
    if (context.step === "generation") {
      return this.decideForGeneration(context);
    } else if (context.step === "assets") {
      return this.decideForAssets(context);
    } else if (context.step === "metadata") {
      return this.decideForMetadata(context);
    }

    // Default for other steps
    return this.decideGeneric(context);
  }

  /**
   * Decide for generation step (most complex)
   */
  private decideForGeneration(context: DecisionContext): DecisionOutput {
    const threshold = this.getThresholdForCategory(context.category);
    const budget = context.budget || "quality";

    // If good enough, accept
    if (context.score >= threshold) {
      logger.debug(
        { score: context.score, threshold },
        "Score acceptable, accepting"
      );
      return {
        action: "accept",
        reason: `Score ${context.score} >= threshold ${threshold}`,
        estimatedCost: "low",
      };
    }

    // If critically low, full retry
    if (context.score < 40) {
      logger.info({ score: context.score }, "Critically low score, full retry");
      return {
        action: "retry_full",
        reason: "Score critically low (<40)",
        estimatedCost: "high",
      };
    }

    // If speed budget, only do partial fixes
    if (budget === "speed") {
      return this.decidePartialFix(context);
    }

    // If quality budget, analyze deeply
    if (context.issues.length === 0) {
      return {
        action: "accept",
        reason: "No issues detected",
        estimatedCost: "low",
      };
    }

    return this.decidePartialFix(context);
  }

  /**
   * Decide on partial fix vs full (hook, structure, or full)
   */
  private decidePartialFix(context: DecisionContext): DecisionOutput {
    // Count high-severity issues by type
    const highSeverity = context.issues.filter((i) => i.severity === "high");

    if (highSeverity.length === 0) {
      // Only low/medium issues, try full
      logger.debug({}, "Only minor issues, full retry");
      return {
        action: "retry_full",
        reason: "Multiple moderate issues detected",
        estimatedCost: "high",
      };
    }

    // Prioritize fixes by impact
    const hookIssues = highSeverity.filter((i) => i.type === "hook");
    if (hookIssues.length > 0 && context.retryCount < context.maxRetries - 1) {
      logger.debug({}, "Weak hook detected, targeted fix");
      return {
        action: "fix_hook",
        reason: "Hook effectiveness critically low",
        estimatedCost: "low",
      };
    }

    const structureIssues = highSeverity.filter((i) =>
      ["structure", "flow", "clarity"].includes(i.type)
    );
    if (structureIssues.length > 0 && context.retryCount < context.maxRetries - 1) {
      logger.debug({}, "Structure issues, targeted fix");
      return {
        action: "fix_structure",
        reason: "Script structure/flow problematic",
        estimatedCost: "medium",
      };
    }

    // Multiple high-severity issues, full retry
    logger.debug({ issueCount: highSeverity.length }, "Multiple critical issues");
    return {
      action: "retry_full",
      reason: `${highSeverity.length} critical issues`,
      estimatedCost: "high",
    };
  }

  /**
   * Decide for asset selection step
   */
  private decideForAssets(context: DecisionContext): DecisionOutput {
    // Assets have simpler logic: try or skip
    if (context.score < 50) {
      logger.debug({ score: context.score }, "Low score, refetch assets");
      return {
        action: "refetch_assets",
        reason: "Asset relevance may improve score",
        estimatedCost: "medium",
      };
    }

    return {
      action: "accept",
      reason: "Asset quality acceptable",
      estimatedCost: "low",
    };
  }

  /**
   * Decide for metadata step
   */
  private decideForMetadata(context: DecisionContext): DecisionOutput {
    // Metadata rarely needs retry (low risk)
    if (context.score >= 60) {
      return {
        action: "accept",
        reason: "Metadata generation acceptable",
        estimatedCost: "low",
      };
    }

    // Too low, might affect metadata quality
    return {
      action: "accept",
      reason: "Metadata generation continues regardless",
      estimatedCost: "low",
    };
  }

  /**
   * Generic decision for unknown steps
   */
  private decideGeneric(context: DecisionContext): DecisionOutput {
    if (context.score >= 70) {
      return {
        action: "accept",
        reason: "Score acceptable",
        estimatedCost: "low",
      };
    }

    if (context.score < 50 && context.retryCount < context.maxRetries - 1) {
      return {
        action: "retry_full",
        reason: "Score below acceptable",
        estimatedCost: "high",
      };
    }

    return {
      action: "accept",
      reason: "Accepting due to constraints",
      estimatedCost: "low",
    };
  }

  /**
   * Get category-specific quality threshold
   */
  private getThresholdForCategory(category: string): number {
    const thresholds: Record<string, number> = {
      "News": 60,
      "Cricket": 72,
      "Viral": 75,
      "Explainer": 70,
      "Technology": 65,
      "Entertainment": 68,
      "Health": 75,
      "Politics": 55,
      "Business": 68,
      "Motivation": 65,
    };

    return thresholds[category] || 65;
  }

  /**
   * Score decisions by cost (for optimization)
   */
  scoreDecisionCost(decision: DecisionOutput): number {
    const costs = { low: 1, medium: 5, high: 10 };
    return costs[decision.estimatedCost] || 1;
  }

  /**
   * Analyze if decision is worth making (avoid thrashing)
   */
  shouldMakeDecision(
    previousDecisions: DecisionAction[],
    currentDecision: DecisionAction
  ): boolean {
    // Avoid repeating same decision twice
    const recent = previousDecisions.slice(-2);
    if (recent.every((d) => d === currentDecision)) {
      logger.warn({ decision: currentDecision }, "Avoiding repeated decision");
      return false;
    }

    return true;
  }
}
