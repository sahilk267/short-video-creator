/**
 * Predictive Scoring Service - Assess topic viability before generation
 * Uses past patterns and keywords to predict engagement potential
 */

import { logger } from "../logger";
import type { MemoryService } from "../memory/memory.service";

export interface ViabilityAssessment {
  score: number; // 0-100
  confidence: number; // 0-1
  recommendation: "generate" | "risky" | "reject";
  reasons: string[];
}

export class PredictiveService {
  constructor(private memoryService?: MemoryService) {}

  /**
   * Assess topic viability before script generation
   */
  assessTopic(
    topic: string,
    category: string,
    options: {
      keywords?: string[];
      style?: "News" | "Viral" | "Explainer";
      pastEngagement?: { category: string; avgScore: number }[];
    } = {},
  ): ViabilityAssessment {
    const reasons: string[] = [];
    let score = 50; // Start neutral

    // Check topic specificity
    const topicWords = topic.split(/\s+/).length;
    if (topicWords >= 2 && topicWords <= 8) {
      score += 10;
      reasons.push("Good topic specificity");
    } else if (topicWords < 2) {
      score -= 15;
      reasons.push("Topic too vague");
    } else if (topicWords > 8) {
      score -= 10;
      reasons.push("Topic too long/complex");
    }

    // Check keyword strength
    if (options.keywords && options.keywords.length > 0) {
      const strongKeywords = options.keywords.filter((kw) => kw.length >= 5 && kw.length <= 20);
      if (strongKeywords.length >= 2) {
        score += 15;
        reasons.push(`Strong keyword set (${strongKeywords.length} keywords)`);
      } else {
        score -= 10;
        reasons.push("Weak or missing keywords");
      }
    } else {
      score -= 5;
      reasons.push("No keywords provided");
    }

    // Check category patterns
    if (options.pastEngagement && options.pastEngagement.length > 0) {
      const categoryPerf = options.pastEngagement.find((p) => p.category === category);
      if (categoryPerf) {
        if (categoryPerf.avgScore > 75) {
          score += 20;
          reasons.push(`Strong category performance (avg: ${categoryPerf.avgScore})`);
        } else if (categoryPerf.avgScore < 50) {
          score -= 15;
          reasons.push(`Weak category performance (avg: ${categoryPerf.avgScore})`);
        }
      }
    }

    // Check memory for similar patterns (if available)
    if (this.memoryService) {
      const similarPatterns = this.memoryService.getSimilarPatterns(
        options.keywords || [],
        category,
        5,
      );

      if (similarPatterns.length > 0) {
        const avgScore = similarPatterns.reduce((sum, p) => sum + p.score, 0) / similarPatterns.length;
        if (avgScore > 80) {
          score += 15;
          reasons.push(`Similar high-performers exist (avg: ${Math.round(avgScore)})`);
        } else if (similarPatterns.some((p) => p.score > 70)) {
          score += 8;
          reasons.push("Some similar patterns available");
        }
      } else {
        reasons.push("No similar patterns found (novel topic)");
      }
    }

    // Determine recommendation
    let recommendation: "generate" | "risky" | "reject" = "generate";
    let confidence = Math.min(0.95, Math.max(0.4, score / 100));

    if (score < 40) {
      recommendation = "reject";
      confidence = Math.max(0.7, confidence);
    } else if (score < 60) {
      recommendation = "risky";
    }

    // Cap score to 0-100
    score = Math.max(0, Math.min(100, score));

    logAss: logger.debug(
      {
        topic,
        category,
        score,
        confidence: Math.round(confidence * 100),
        recommendation,
      },
      "Topic viability assessed",
    );

    return {
      score,
      confidence,
      recommendation,
      reasons,
    };
  }

  /**
   * Predict engagement potential based on script metadata
   */
  predictEngagement(
    topic: string,
    options: {
      category?: string;
      keywords?: string[];
      style?: "News" | "Viral" | "Explainer";
      hasEmotionalTriggers?: boolean;
      hasUrgency?: boolean;
    } = {},
  ): { engagementScore: number; advice: string } {
    let score = 50;

    // Emotional triggers boost
    if (options.hasEmotionalTriggers) {
      score += 15;
    }

    // Urgency boost (especially for News/Viral)
    if (options.hasUrgency) {
      score += 10;
      if (options.style === "News" || options.style === "Viral") {
        score += 10;
      }
    }

    // Category-specific adjustments
    const categoryBoosts: Record<string, number> = {
      "Cricket": 20,
      "Sports": 15,
      "Technology": 12,
      "Business": 10,
      "Entertainment": 18,
      "Lifestyle": 8,
    };

    if (options.category && categoryBoosts[options.category]) {
      score += categoryBoosts[options.category];
    }

    // Keyword richness
    if (options.keywords && options.keywords.length >= 3) {
      score += 10;
    }

    // Cap and generate advice
    score = Math.max(0, Math.min(100, score));

    let advice = "Standard content strategy";
    if (score > 80) {
      advice = "High engagement potential - prioritize for peak hours";
    } else if (score > 60) {
      advice = "Good engagement potential - standard publishing schedule";
    } else if (score > 40) {
      advice = "Moderate potential - enhance with hashtags and CTAs";
    } else {
      advice = "Low potential - consider topic or keyword revision";
    }

    return { engagementScore: score, advice };
  }
}
