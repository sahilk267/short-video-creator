import { describe, expect, it } from "vitest";
import { normalizeAIMetricsData, type LearningEvent, type ModelState } from "./useAIMetrics";

const model: ModelState = {
  updatedAt: "2026-03-26T10:00:00.000Z",
  version: 4,
  weights: {
    successRate: 0.52,
    engagementRate: 0.28,
    speedScore: 0.2,
  },
  samples: 120,
  metrics: {
    accuracy: 0.82,
    drift: 0.12,
    biasRisk: "low",
  },
};

const events: LearningEvent[] = [
  {
    id: "evt-1",
    jobId: "job-1",
    phase: "render",
    outcome: "success",
    latencyMs: 54000,
    engagement: { views: 1000, likes: 120, shares: 30, comments: 20 },
    createdAt: "2026-03-20T10:00:00.000Z",
  },
  {
    id: "evt-2",
    jobId: "job-2",
    phase: "publish",
    outcome: "failed",
    latencyMs: 143000,
    errorCode: "publish_timeout",
    engagement: { views: 300, likes: 9, shares: 2, comments: 1 },
    createdAt: "2026-03-22T11:00:00.000Z",
  },
  {
    id: "evt-3",
    jobId: "job-3",
    phase: "analytics",
    outcome: "success",
    latencyMs: 62000,
    engagement: { views: 1400, likes: 160, shares: 42, comments: 18 },
    createdAt: "2026-03-24T12:00:00.000Z",
  },
];

describe("normalizeAIMetricsData", () => {
  it("derives dashboard metrics, predictions, and comparisons from backend responses", () => {
    const normalized = normalizeAIMetricsData(
      {
        summary: {
          totalEvents: 3,
          successRate: 2 / 3,
          failures: 1,
          avgLatencyMs: 86333,
        },
        model,
        monitoring: {
          healthy: true,
          reasons: [],
          fallbackMode: false,
        },
        recentFailures: [events[1]],
      },
      { model },
      events,
    );

    expect(normalized.metrics.totalEvents).toBe(3);
    expect(normalized.metrics.failures).toBe(1);
    expect(normalized.metrics.accuracy).toBeCloseTo(0.82);
    expect(normalized.metrics.precision).toBeGreaterThan(0.7);
    expect(normalized.predictions).toHaveLength(3);
    expect(normalized.predictions[0]?.recommendation.length).toBeGreaterThan(10);
    expect(normalized.trainingHistory).toHaveLength(3);
    expect(normalized.comparison).toHaveLength(4);
    expect(normalized.recommendations.length).toBeGreaterThan(0);
    expect(normalized.alerts[0]?.severity).toBe("warning");
  });

  it("raises fallback alerts and warning recommendations when health is degraded", () => {
    const normalized = normalizeAIMetricsData(
      {
        summary: {
          totalEvents: 8,
          successRate: 0.5,
          failures: 4,
          avgLatencyMs: 131000,
        },
        model: {
          ...model,
          metrics: {
            accuracy: 0.5,
            drift: 0.4,
            biasRisk: "high",
          },
        },
        monitoring: {
          healthy: false,
          reasons: ["accuracy_below_threshold", "model_drift_high"],
          fallbackMode: true,
        },
        recentFailures: new Array(5).fill(events[1]),
      },
      {
        model: {
          ...model,
          metrics: {
            accuracy: 0.5,
            drift: 0.4,
            biasRisk: "high",
          },
        },
      },
      events,
    );

    expect(normalized.health.fallbackMode).toBe(true);
    expect(normalized.alerts.some((alert) => alert.id === "fallback-mode")).toBe(true);
    expect(normalized.recommendations.some((recommendation) => recommendation.severity === "error")).toBe(true);
    expect(normalized.metrics.anomalyRate).toBe(0.5);
  });
});