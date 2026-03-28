import { describe, expect, test, vi, beforeEach } from "vitest";
import axios from "axios";

import { MetadataGenerator } from "./MetadataGenerator";

vi.mock("axios");

const mockedAxios = vi.mocked(axios, true);

describe("MetadataGenerator", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("passes headlines and keyword context into generated metadata", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        response: JSON.stringify({
          title: "Nvidia export controls reshape AI chip race",
          description: "A tighter look at the latest export pressure and market response.",
          tags: ["Nvidia", "AI chips"],
          hashtags: "#Nvidia #AIchips",
        }),
      },
    } as never);

    const generator = new MetadataGenerator({
      aiLlmUrl: "http://mocked",
      aiLlmModel: "model",
    } as never);

    const result = await generator.generate(
      "youtube",
      "Nvidia export controls",
      "Markets reacted after a fresh export-control move.",
      "en",
      {
        category: "Technology",
        subcategory: "Semiconductors",
        keywords: ["Nvidia", "AI chips", "export controls"],
        headlines: ["CHIP PRESSURE BUILDS", "EXPORT RULES TIGHTEN"],
      },
    );

    expect(result.title).toContain("Nvidia");
    expect(result.tags).toEqual(expect.arrayContaining(["Nvidia", "AI chips", "export controls"]));
    expect(result.hashtags).toContain("#Nvidia");
  });

  test("fallback uses keywords to build stronger tags and hashtags", async () => {
    mockedAxios.post.mockRejectedValue(new Error("LLM unavailable"));

    const generator = new MetadataGenerator({
      aiLlmUrl: "http://mocked",
      aiLlmModel: "model",
    } as never);

    const result = await generator.generate(
      "instagram",
      "Nvidia export controls",
      "Markets reacted after a fresh export-control move.",
      "en",
      {
        keywords: ["Nvidia", "AI chips", "export controls"],
      },
    );

    expect(result.tags).toEqual(expect.arrayContaining(["Nvidia", "AI chips", "export controls"]));
    expect(result.hashtags).toContain("#Nvidia");
    expect(result.description).toContain("Key terms:");
  });
});
