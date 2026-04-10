/**
 * Feedback Service - Improve scripts based on scoring feedback
 * Enables self-improving script generation within retry budget
 */

import { logger } from "../logger";

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
   */
  shouldRetry(score: number, retryCount: number, maxRetries: number = 2): boolean {
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
   * Private helper: check for hook keywords
   */
  private hasHookKeywords(text: string): boolean {
    const hookKeywords = ["why", "what", "how", "breaking", "just", "latest", "twist", "shocking", "revealed"];
    const normalized = text.toLowerCase();
    return hookKeywords.some((kw) => normalized.includes(kw));
  }
}
