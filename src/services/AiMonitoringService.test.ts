import { describe, expect, it } from "vitest";
import { AiMonitoringService } from "./AiMonitoringService";

describe("AiMonitoringService", () => {
  it("switches to fallback when model metrics degrade", () => {
    const service = new AiMonitoringService();
    const health = service.evaluateModelHealth({
      updatedAt: new Date().toISOString(),
      version: 1,
      weights: { successRate: 0.5, engagementRate: 0.3, speedScore: 0.2 },
      samples: 10,
      metrics: { accuracy: 0.4, drift: 0.5, biasRisk: "high" },
    });

    expect(health.healthy).toBe(false);
    expect(health.fallbackMode).toBe(true);
    expect(health.reasons.length).toBeGreaterThan(0);
  });
});
