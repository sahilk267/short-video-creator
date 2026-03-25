import { describe, expect, it } from "vitest";
import { ContentEnhancementService } from "./ContentEnhancementService";

describe("ContentEnhancementService", () => {
  it("generates ideation list with trend influence", () => {
    const service = new ContentEnhancementService();
    const ideas = service.ideate({
      category: "tech",
      trendKeywords: ["ai agents", "edge devices"],
      userPreferences: ["developers"],
    });

    expect(ideas.length).toBeGreaterThan(2);
    expect(ideas.join(" ").toLowerCase()).toContain("tech");
  });

  it("flags banned moderation tokens", () => {
    const service = new ContentEnhancementService();
    const result = service.moderate("This contains hate and violent_threat words");

    expect(result.safe).toBe(false);
    expect(result.flags.length).toBeGreaterThan(0);
    expect(result.sanitizedText).toContain("[redacted]");
  });

  it("produces accessibility artifacts", () => {
    const service = new ContentEnhancementService();
    const result = service.accessibility("First scene. Second scene with details. Final scene.");

    expect(result.altText.length).toBeGreaterThan(10);
    expect(result.extendedCaptions.length).toBeGreaterThan(1);
  });
});
