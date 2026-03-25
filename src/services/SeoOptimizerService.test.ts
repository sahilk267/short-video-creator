import { describe, expect, it } from "vitest";
import { SeoOptimizerService } from "./SeoOptimizerService";

describe("SeoOptimizerService", () => {
  it("returns hashtags and score", () => {
    const svc = new SeoOptimizerService();
    const out = svc.optimize({
      title: "Breaking market update",
      description: "desc",
      keywords: ["finance", "stocks", "market"],
      category: "Business",
    });
    expect(out.title.startsWith("Business")).toBe(true);
    expect(out.hashtags.length).toBeGreaterThan(0);
    expect(out.keywordDensityScore).toBeGreaterThan(0);
  });
});
