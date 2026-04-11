/**
 * Feedback Service - Improve scripts based on scoring feedback
 * Enables self-improving script generation within retry budget
 * 
 * PHASE 4: Integrated with DecisionEngine for intelligent decisions
 */

import { logger } from "../logger";
import type { DecisionEngineService } from "../decision/decision-engine.service";

export interface ScriptQualityIssue {
  type: "hook" | "engagement" | "clarity" | "length" | "keywords";
  severity: "low" | "medium" | "high";
  message: string;
}

export interface FeedbackContext {
  script: string;
  score: number;
  issues: ScriptQualityIssue[];
  category: string;
  style: "News" | "Viral" | "Explainer";
  keywords?: string[];
  topic?: string;
}

export class FeedbackService {
  /**
   * Optional DecisionEngine for intelligent retry decisions
   * If provided, uses intelligent decisions instead of score-threshold logic
   */
  private decisionEngine?: DecisionEngineService;
  private enableDecisionEngine: boolean;

  constructor(decisionEngine?: DecisionEngineService, enableDecisionEngine: boolean = false) {
    this.decisionEngine = decisionEngine;
    this.enableDecisionEngine = enableDecisionEngine;
  }
  /**
   * Analyze a script and return specific improvement suggestions
   */
  analyzeScript(
    script: string,
    score: number,
    options: {
      category?: string;
      style?: "News" | "Viral" | "Explainer";
      keywords?: string[];
    } = {},
  ): ScriptQualityIssue[] {
    const issues: ScriptQualityIssue[] = [];

    // Check hook strength (first 10 words)
    const hook = script.split("\n")[0] || script.substring(0, 50);
    const hookLength = hook.split(" ").length;

    if (hookLength < 5) {
      issues.push({
        type: "hook",
        severity: "high",
        message: "Hook is too short (< 5 words). First 3 seconds are critical.",
      });
    }

    if (!this.hasHookKeywords(hook)) {
      issues.push({
        type: "hook",
        severity: "medium",
        message: "Hook lacks curiosity/urgency words (why, what, breaking, just, etc.)",
      });
    }

    // Check keyword coverage
    if (options.keywords && options.keywords.length > 0) {
      const normalizedScript = script.toLowerCase();
      const coveredKeywords = options.keywords.filter((kw) => normalizedScript.includes(kw.toLowerCase()));

      if (coveredKeywords.length < Math.ceil(options.keywords.length * 0.5)) {
        issues.push({
          type: "keywords",
          severity: "medium",
          message: `Only ${coveredKeywords.length}/${options.keywords.length} keywords present in script`,
        });
      }
    }

    // Check length (appropriate for style)
    const wordCount = script.split(/\s+/).length;
    const targetRanges: Record<string, [number, number]> = {
      News: [80, 150],
      Viral: [60, 120],
      Explainer: [120, 200],
    };
    const [minWords, maxWords] = targetRanges[options.style || "News"] || [80, 150];

    if (wordCount < minWords) {
      issues.push({
        type: "length",
        severity: "medium",
        message: `Script too short (${wordCount} words, target: ${minWords}-${maxWords})`,
      });
    } else if (wordCount > maxWords) {
      issues.push({
        type: "length",
        severity: "low",
        message: `Script longer than ideal (${wordCount} words, target: ${minWords}-${maxWords})`,
      });
    }

    // Check clarity (simple heuristic: avg sentence length)
    const sentences = script.match(/[.!?]+/g) || [];
    if (sentences.length > 0) {
      const avgSentenceLength = wordCount / sentences.length;
      if (avgSentenceLength > 25) {
        issues.push({
          type: "clarity",
          severity: "low",
          message: `Average sentence length ${Math.round(avgSentenceLength)} words (target: < 20)`,
        });
      }
    }

    // If score is very low, add generic engagement warning
    if (score < 50) {
      issues.push({
        type: "engagement",
        severity: "high",
        message: "Script engagement score very low. Needs major restructuring.",
      });
    }

    return issues;
  }

  /**
   * Generate improvement prompt for LLM
   */
  generateImprovementPrompt(context: FeedbackContext): string {
    const issues = context.issues.slice(0, 3); // Top 3 issues
    const issueDescriptions = issues.map((i) => `- ${i.message} (${i.severity})`).join("\n");

    let prompt = `You are a viral content script writer. Improve the following script based on these issues:\n\n`;
    prompt += `Score: ${context.score}/100\n`;
    prompt += `Category: ${context.category}\n`;
    prompt += `Style: ${context.style}\n`;
    prompt += `Issues to fix:\n${issueDescriptions}\n\n`;

    if (context.keywords && context.keywords.length > 0) {
      prompt += `Must include these keywords: ${context.keywords.join(", ")}\n`;
    }

    if (context.topic) {
      prompt += `Topic: ${context.topic}\n`;
    }

    prompt += `\nOriginal script:\n${context.script}\n\n`;
    prompt += `Improved script (maintain same structure, fix issues above, output only the script):\n`;

    return prompt;
  }

  /**
   * Decide if script should be retried
   * PHASE 4: Uses DecisionEngine if enabled, otherwise falls back to simple threshold logic
   */
  shouldRetry(
    score: number,
    retryCount: number,
    maxRetries: number = 2,
    category: string = "News",
    issues: ScriptQualityIssue[] = [],
  ): boolean {
    // Use DecisionEngine if enabled
    if (this.enableDecisionEngine && this.decisionEngine) {
      const decision = this.decisionEngine.decide({
        step: "generation",
        score,
        issues: issues.map((i) => ({
          type: i.type,
          severity: i.severity,
          message: i.message,
        })),
        retryCount,
        maxRetries,
        category,
        budget: "quality",
      });

      const shouldRetry = decision.action !== "accept" && decision.action !== "skip";
      logger.debug(
        { action: decision.action, reason: decision.reason, shouldRetry },
        "DecisionEngine determined retry decision"
      );
      return shouldRetry;
    }

    // FALLBACK: Original simple logic
    if (retryCount >= maxRetries) {
      logger.debug({ retryCount, maxRetries }, "Max retries reached");
      return false;
    }

    if (score < 60) {
      logger.debug({ score, retryCount }, "Score below threshold, will retry");
      return true;
    }

    return false;
  }

  /**
   * Get category-specific quality threshold
   */
  getCategoryThreshold(category: string): number {
    // Different content types have different quality requirements
    const thresholds: Record<string, number> = {
      "News": 60,              // News: factual accuracy more important than viral appeal
      "Politics": 55,          // Politics: engagement from base supporters critical
      "Cricket": 72,           // Sports: high engagement needed
      "Entertainment": 68,     // Entertainment: viral coefficient high
      "Technology": 65,        // Tech: clarity important, good engagement medium
      "Viral": 75,             // Viral content: very high bar
      "Explainer": 70,         // Explainer: clarity + completeness high
      "Motivation": 65,        // Motivation: emotional engagement key
      "Business": 68,          // Business: credibility + engagement
      "Health": 70,            // Health: accuracy critical
    };

    return thresholds[category] || 65; // Default medium threshold
  }

  /**
   * Suggest partial regeneration target based on issues
   */
  suggestPartialRegenTarget(
    issues: ScriptQualityIssue[],
  ): "hook" | "keywords" | "full" | null {
    if (issues.length === 0) {
      return null;
    }

    // Count high-severity issues by type
    const highSeverity = issues.filter((i) => i.severity === "high");

    // If only hook is problematic, fix just the hook
    if (
      highSeverity.length === 1 &&
      highSeverity[0].type === "hook"
    ) {
      logger.debug({}, "Partial regeneration: hook only");
      return "hook";
    }

    // If only keywords are problematic, fix just keywords
    if (
      highSeverity.length === 1 &&
      highSeverity[0].type === "keywords"
    ) {
      logger.debug({}, "Partial regeneration: keywords only");
      return "keywords";
    }

    // Multiple issues or engagement issues = full regeneration needed
    logger.debug({ issueCount: issues.length }, "Full regeneration needed");
    return "full";
  }

  /**
   * Generate targeted improvement prompt for partial regen
   */
  generatePartialImprovementPrompt(
    context: FeedbackContext,
    target: "hook" | "keywords" | "full",
  ): string {
    let prompt = "";

    if (target === "hook") {
      prompt = `You are a viral content expert. The script below has a weak opening hook.\n`;
      prompt += `Generate only a NEW first line/paragraph (hook) that:\n`;
      prompt += `- Grabs attention in first 3 seconds\n`;
      prompt += `- Uses curiosity or urgency words\n`;
      prompt += `- Is under 15 words\n\n`;
      prompt += `Current hook: ${context.script.split("\n")[0]}\n`;
      prompt += `Topic: ${context.topic || context.category}\n`;
      prompt += `Output only the new hook line:\n`;
    } else if (target === "keywords") {
      prompt = `You are a content SEO expert. Your task is to enhance keyword coverage.\n`;
      prompt += `Script: ${context.script}\n\n`;
      prompt += `Must naturally incorporate these keywords: ${context.keywords?.join(", ")}\n`;
      prompt += `Output the full script with keywords naturally woven in:\n`;
    } else {
      // Full regeneration
      prompt = this.generateImprovementPrompt(context);
    }

    return prompt;
  }

  /**
   * Enhanced retry decision with detailed reasoning
   */
  makeRetryDecision(
    score: number,
    category: string,
    retryCount: number,
    maxRetries: number = 2,
    issues?: ScriptQualityIssue[],
  ): {
    shouldRetry: boolean;
    reason: string;
    suggestedTarget?: "hook" | "keywords" | "full";
  } {
    const threshold = this.getCategoryThreshold(category);

    if (retryCount >= maxRetries) {
      logger.debug(
        { retryCount, maxRetries, score, threshold },
        "Max retries reached",
      );
      return {
        shouldRetry: false,
        reason: `Max retries (${maxRetries}) reached`,
      };
    }

    if (score >= threshold) {
      logger.debug(
        { score, threshold },
        "Score acceptable for category",
      );
      return {
        shouldRetry: false,
        reason: `Score ${score} meets threshold ${threshold}`,
      };
    }

    // Suggest partial regen if possible
    const partial = issues ? this.suggestPartialRegenTarget(issues) : "full";

    logger.debug(
      { score, threshold, target: partial, retryCount },
      "Retry recommended",
    );

    return {
      shouldRetry: true,
      reason: `Score ${score} below threshold ${threshold}`,
      suggestedTarget: partial || "full",
    };
  }

  /**
   * Private helper: check for hook keywords
   */
  private hasHookKeywords(text: string): boolean {
    const hookKeywords = ["why", "what", "how", "breaking", "just", "latest", "twist", "shocking", "revealed"];
    const normalized = text.toLowerCase();
    return hookKeywords.some((kw) => normalized.includes(kw));
  }
}
