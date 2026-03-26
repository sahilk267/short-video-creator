import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const useAIMetricsMock = vi.fn();
const useAutoRefreshMock = vi.fn();
const useAITrainingMock = vi.fn();

vi.mock("../hooks/useAIMetrics", () => ({
  useAIMetrics: () => useAIMetricsMock(),
}));

vi.mock("../hooks/useAutoRefresh", () => ({
  useAutoRefresh: () => useAutoRefreshMock(),
}));

vi.mock("../hooks/useAITraining", () => ({
  useAITraining: () => useAITrainingMock(),
}));

import AIDashboard from "./AIDashboard";

describe("AIDashboard", () => {
  it("renders the empty telemetry state with auto-refresh controls", () => {
    useAIMetricsMock.mockReturnValue({
      data: null,
      latestFailure: null,
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    useAutoRefreshMock.mockReturnValue({
      autoRefreshEnabled: true,
      lastUpdatedAt: "2026-03-26T12:00:00.000Z",
      setAutoRefreshEnabled: vi.fn(),
      refreshNow: vi.fn(),
    });
    useAITrainingMock.mockReturnValue({
      training: false,
      suggesting: false,
      trainingError: null,
      suggestionError: null,
      suggestion: null,
      triggerTraining: vi.fn(),
      requestSuggestion: vi.fn(),
    });

    const markup = renderToStaticMarkup(<AIDashboard />);

    expect(markup).toContain("AI Monitoring Dashboard");
    expect(markup).toContain("Auto-refresh");
    expect(markup).toContain("No AI telemetry yet");
    expect(markup).toContain("Refresh AI dashboard");
  });

  it("renders the no-events state when dashboard data exists but no telemetry has been recorded", () => {
    useAIMetricsMock.mockReturnValue({
      data: {
        health: { healthy: true, reasons: [], fallbackMode: false },
        metrics: { totalEvents: 0, successRate: 0, failures: 0, avgLatencyMs: 0, accuracy: 0.5, drift: 0, precision: 0.5, recall: 0.5, anomalyRate: 0, avgConfidence: 0 },
        trainingHistory: [],
        predictions: [],
        recommendations: [],
        comparison: [],
        alerts: [],
        recentFailures: [],
        model: {
          updatedAt: "2026-03-26T12:00:00.000Z",
          version: 1,
          weights: { successRate: 0.5, engagementRate: 0.3, speedScore: 0.2 },
          samples: 0,
          metrics: { accuracy: 0.5, drift: 0, biasRisk: "low" },
        },
      },
      latestFailure: null,
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    useAutoRefreshMock.mockReturnValue({
      autoRefreshEnabled: false,
      lastUpdatedAt: null,
      setAutoRefreshEnabled: vi.fn(),
      refreshNow: vi.fn(),
    });
    useAITrainingMock.mockReturnValue({
      training: false,
      suggesting: false,
      trainingError: null,
      suggestionError: null,
      suggestion: null,
      triggerTraining: vi.fn(),
      requestSuggestion: vi.fn(),
    });

    const markup = renderToStaticMarkup(<AIDashboard />);

    expect(markup).toContain("No AI events recorded yet");
    expect(markup).toContain("No recent failures recorded.");
  });
});
