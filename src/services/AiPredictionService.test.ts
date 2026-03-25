import { describe, expect, it } from "vitest";
import { AiPredictionService } from "./AiPredictionService";
import type { LearningModelState } from "../db/AiLearningStore";

const model: LearningModelState = {
  updatedAt: new Date().toISOString(),
  version: 2,
  weights: {
    successRate: 0.5,
    engagementRate: 0.3,
    speedScore: 0.2,
  },
  samples: 20,
  metrics: {
    accuracy: 0.8,
    drift: 0.1,
    biasRisk: "low",
  },
};

describe("AiPredictionService", () => {
  it("returns suggestion score and recommendation", () => {
    const service = new AiPredictionService();
    const suggestion = service.predict(model, {
      recentFailures: 1,
      recentEngagementRate: 0.25,
      avgDurationSec: 90,
      category: "tech",
    });

    expect(suggestion.score).toBeGreaterThan(0);
    expect(suggestion.score).toBeLessThanOrEqual(100);
    expect(suggestion.recommendation.length).toBeGreaterThan(10);
    expect(suggestion.fallbackUsed).toBe(false);
  });

  it("retrain increases model version", () => {
    const service = new AiPredictionService();
    const next = service.retrain(
      [
        { id: "1", jobId: "a", phase: "render", outcome: "success", latencyMs: 1000, createdAt: new Date().toISOString() },
        { id: "2", jobId: "b", phase: "publish", outcome: "success", latencyMs: 2000, createdAt: new Date().toISOString() },
        { id: "3", jobId: "c", phase: "publish", outcome: "failed", latencyMs: 4000, createdAt: new Date().toISOString() },
        { id: "4", jobId: "d", phase: "analytics", outcome: "success", latencyMs: 3000, createdAt: new Date().toISOString() },
        { id: "5", jobId: "e", phase: "render", outcome: "success", latencyMs: 1500, createdAt: new Date().toISOString() },
      ],
      model,
    );

    expect(next.version).toBe(model.version + 1);
    expect(next.samples).toBeGreaterThan(model.samples);
  });
});
