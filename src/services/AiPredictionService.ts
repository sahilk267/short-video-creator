import type { LearningEvent, LearningModelState } from "../db/AiLearningStore";

export interface SuggestionContext {
  tenantId?: string;
  category?: string;
  platform?: string;
  avgDurationSec?: number;
  recentFailures?: number;
  recentEngagementRate?: number;
}

export interface AiSuggestion {
  score: number;
  confidence: number;
  recommendation: string;
  fallbackUsed: boolean;
}

export class AiPredictionService {
  public predict(
    model: LearningModelState,
    context: SuggestionContext,
  ): AiSuggestion {
    const failPenalty = Math.min(1, (context.recentFailures ?? 0) / 5);
    const engagement = Math.max(0, Math.min(1, context.recentEngagementRate ?? 0.2));
    const speed = context.avgDurationSec ? Math.max(0, 1 - context.avgDurationSec / 300) : 0.5;

    const weighted =
      model.weights.successRate * (1 - failPenalty) +
      model.weights.engagementRate * engagement +
      model.weights.speedScore * speed;

    const score = Math.round(weighted * 100);
    const confidence = Math.max(0.4, Math.min(0.95, model.metrics.accuracy - model.metrics.drift * 0.2));

    let recommendation = "Maintain current pipeline settings";
    if (score < 45) {
      recommendation = "Reduce duration and switch to high-performing category/title template";
    } else if (score < 70) {
      recommendation = "Run A/B title variation and prioritize high-engagement publish slot";
    }

    return {
      score,
      confidence,
      recommendation,
      fallbackUsed: false,
    };
  }

  public retrain(events: LearningEvent[], previous: LearningModelState): LearningModelState {
    if (events.length < 5) {
      return {
        ...previous,
        updatedAt: new Date().toISOString(),
        metrics: {
          ...previous.metrics,
          drift: Math.min(1, previous.metrics.drift + 0.02),
        },
      };
    }

    const successRate =
      events.filter((e) => e.outcome === "success").length / Math.max(1, events.length);

    const engagementRate = events.reduce((acc, e) => {
      const engagement = e.engagement;
      if (!engagement) return acc;
      const views = Math.max(1, engagement.views);
      return acc + (engagement.likes + engagement.shares + engagement.comments) / views;
    }, 0) / Math.max(1, events.filter((e) => e.engagement).length);

    const speedScore = events.reduce((acc, e) => acc + Math.max(0, 1 - e.latencyMs / 180000), 0) / events.length;

    const nextWeights = {
      successRate: 0.5 + (successRate - 0.5) * 0.4,
      engagementRate: 0.3 + (engagementRate - 0.2) * 0.3,
      speedScore: 0.2 + (speedScore - 0.5) * 0.3,
    };

    const normalizedSum = nextWeights.successRate + nextWeights.engagementRate + nextWeights.speedScore;

    const weights = {
      successRate: nextWeights.successRate / normalizedSum,
      engagementRate: nextWeights.engagementRate / normalizedSum,
      speedScore: nextWeights.speedScore / normalizedSum,
    };

    const drift = Math.abs(previous.weights.successRate - weights.successRate);
    const accuracy = Math.max(0.5, Math.min(0.98, 0.55 + successRate * 0.35 + engagementRate * 0.1));
    const biasRisk = successRate < 0.4 || engagementRate < 0.05 ? "medium" : "low";

    return {
      updatedAt: new Date().toISOString(),
      version: previous.version + 1,
      weights,
      samples: previous.samples + events.length,
      metrics: {
        accuracy,
        drift,
        biasRisk,
      },
    };
  }
}
