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
   * Enforce strict threshold for critical scoring
   */
  enforceScoreThreshold(
    score: number,
    category: string,
    strictMode: boolean = false,
  ): {
    passed: boolean;
    reason: string;
    enforced: boolean;
  } {
    const thresholds: Record<string, { soft: number; strict: number }> = {
      "News": { soft: 50, strict: 65 },
      "Cricket": { soft: 65, strict: 75 },
      "Entertainment": { soft: 55, strict: 70 },
      "Technology": { soft: 50, strict: 60 },
      "Viral": { soft: 70, strict: 80 },
      "Explainer": { soft: 60, strict: 72 },
      "Politics": { soft: 45, strict: 60 },
      "Business": { soft: 55, strict: 68 },
      "Health": { soft: 60, strict: 75 },
      "Motivation": { soft: 50, strict: 65 },
    };

    const config = thresholds[category] || { soft: 55, strict: 70 };
    const threshold = strictMode ? config.strict : config.soft;
    const passed = score >= threshold;

    const reason = passed
      ? `Score ${score} meets ${strictMode ? "strict" : "soft"} threshold (${threshold})`
      : `Score ${score} below ${strictMode ? "strict" : "soft"} threshold (${threshold})`;

    logger.debug(
      { score, threshold, category, strictMode, passed },
      "Score threshold enforced",
    );

    return {
      passed,
      reason,
      enforced: strictMode,
    };
  }

  /**
   * Get memory-based engagement forecast
   */
  getForecastWithMemory(
    topic: string,
    category: string,
    keywords?: string[],
  ): {
    forecast: number;
    baseScore: number;
    memoryBoosted: number;
    confidence: number;
  } {
    const baseScore = 50;

    if (!this.memoryService || !keywords || keywords.length === 0) {
      return {
        forecast: baseScore,
        baseScore,
        memoryBoosted: 0,
        confidence: 0.5,
      };
    }

    try {
      // Get similar high-performing patterns from memory
      const similarPatterns = this.memoryService.getSimilarPatterns(
        keywords,
        category,
        10,
      );

      if (similarPatterns.length === 0) {
        return {
          forecast: baseScore,
          baseScore,
          memoryBoosted: 0,
          confidence: 0.4,
        };
      }

      // Calculate boost from similar patterns
      const topScore = similarPatterns[0].score;
      const avgScore = similarPatterns.reduce((sum, p) => sum + p.score, 0) / similarPatterns.length;

      // Bounded boost: up to +15 points
      const memoryBoost = Math.min(15, (avgScore - 50) * 0.3);
      const forecast = Math.min(100, baseScore + memoryBoost);

      logger.debug(
        { category, patternCount: similarPatterns.length, avgScore, boost: memoryBoost },
        "Memory forecast calculated",
      );

      return {
        forecast,
        baseScore,
        memoryBoosted: memoryBoost,
        confidence: Math.min(0.9, 0.5 + similarPatterns.length * 0.05),
      };
    } catch (error) {
      logger.warn({ error }, "Memory forecast failed");
      return {
        forecast: baseScore,
        baseScore,
        memoryBoosted: 0,
        confidence: 0.3,
      };
    }
  }

  /**
   * Detailed viability report with all factors
   */
  getDetailedAssessment(
    topic: string,
    category: string,
    options: {
      keywords?: string[];
      style?: "News" | "Viral" | "Explainer";
      pastEngagement?: { category: string; avgScore: number }[];
      memoryEnabled?: boolean;
    } = {},
  ): {
    viability: ViabilityAssessment;
    memory: ReturnType<PredictiveService["getForecastWithMemory"]>;
    threshold: ReturnType<PredictiveService["enforceScoreThreshold"]>;
    detailed: {
      factors: Record<string, number | string>;
      riskFactors: string[];
      opportunities: string[];
    };
  } {
    const viability = this.assessTopic(topic, category, options);
    const memory = options.memoryEnabled
      ? this.getForecastWithMemory(topic, category, options.keywords)
      : { forecast: 50, baseScore: 50, memoryBoosted: 0, confidence: 0 };

    const threshold = this.enforceScoreThreshold(viability.score, category, false);

    const detailed = {
      factors: {
        topic_score: viability.score,
        memory_forecast: memory.forecast,
        confidence: Math.round(viability.confidence * 100) + "%",
        style: options.style || "News",
        keyword_count: options.keywords?.length || 0,
      },
      riskFactors: viability.reasons.filter((r) =>
        r.toLowerCase().includes("low") ||
        r.toLowerCase().includes("weak") ||
        r.toLowerCase().includes("vague")
      ),
      opportunities: viability.reasons.filter((r) =>
        r.toLowerCase().includes("high") ||
        r.toLowerCase().includes("strong") ||
        r.toLowerCase().includes("similar")
      ),
    };

    return {
      viability,
      memory,
      threshold,
      detailed,
    };
  }
}

