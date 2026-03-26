import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeAISuggestion, executeAITraining } from "./useAITraining";

const success = vi.fn();
const error = vi.fn();

describe("useAITraining", () => {
  beforeEach(() => {
    success.mockReset();
    error.mockReset();
  });

  it("triggers retraining and refresh callback on success", async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const train = vi.fn().mockResolvedValue({ ok: true });

    const result = await executeAITraining(train, { success, error }, onComplete);

    expect(train).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledWith("AI model retraining completed");
    expect(result.error).toBeNull();
  });

  it("stores suggestion responses and reports errors when generation fails", async () => {
    const getSuggestion = vi.fn().mockResolvedValue({
      suggestion: {
        score: 74,
        confidence: 0.81,
        recommendation: "Run targeted experiment on title and publish timing",
        fallbackUsed: false,
      },
      health: {
        healthy: true,
        reasons: [],
        fallbackMode: false,
      },
    });

    const first = await executeAISuggestion(
      getSuggestion,
      {
        category: "World",
        platform: "youtube",
        avgDurationSec: 45,
        recentFailures: 1,
        recentEngagementRate: 0.22,
      },
      { success, error },
    );

    expect(getSuggestion).toHaveBeenCalledTimes(1);
    expect(first.data?.suggestion.score).toBe(74);
    expect(success).toHaveBeenCalledWith("Suggestion generated from current model state");

    getSuggestion.mockRejectedValueOnce(new Error("network unavailable"));

    const second = await executeAISuggestion(
      getSuggestion,
      { category: "Tech" },
      { success, error },
    );

    expect(second.error).toBe("network unavailable");
    expect(error).toHaveBeenCalledWith("network unavailable");
  });
});