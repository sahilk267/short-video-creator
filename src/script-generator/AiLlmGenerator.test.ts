import { describe, expect, test, vi, beforeEach } from "vitest";
import axios from "axios";

import { AiLlmGenerator } from "./AiLlmGenerator";

vi.mock("axios");

const mockedAxios = vi.mocked(axios, true);

describe("AiLlmGenerator keyword-to-visual alignment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("merges priority keywords into scene keywords, search terms, and visual prompt", async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: {
        response: JSON.stringify([
          {
            text: "Chipmakers are reacting to fresh export controls and supply chain fears.",
            subcategory: "Semiconductors",
            keywords: ["chips", "exports"],
            searchTerms: ["factory floor"],
            headline: "CHIP PRESSURE BUILDS",
            visualPrompt: "A cinematic semiconductor factory interior",
          },
        ]),
      },
    } as never);

    const generator = new AiLlmGenerator("http://mocked", "model");
    const scenes = await generator.generateScript(
      [{ title: "Nvidia and AMD face export pressure", content: "Markets react to chip controls" }],
      {
        topic: "Chip Export Pressure",
        keywords: ["Nvidia", "AI chips", "export controls"],
      },
    );

    expect(scenes).toHaveLength(1);
    expect(scenes[0]?.keywords).toEqual(expect.arrayContaining(["Nvidia", "AI chips", "export controls"]));
    expect(scenes[0]?.searchTerms).toEqual(expect.arrayContaining(["Nvidia", "AI chips", "export controls"]));
    expect(scenes[0]?.visualPrompt).toContain("Focus on");
    expect(scenes[0]?.visualPrompt).toContain("Nvidia");
    expect(scenes[0]?.visualPrompt).toContain("AI chips");
    expect(scenes[0]?.visualPrompt).toContain("export controls");
  });

  test("ranks topic prompt stories by keyword relevance, freshness, and source weight", () => {
    const generator = new AiLlmGenerator("http://mocked", "model");

    const ranked = (generator as any).rankStoriesForPrompt(
      [
        {
          title: "Lifestyle roundup from the weekend",
          content: "Light feature story",
          pubDate: new Date(Date.now() - (72 * 60 * 60 * 1000)).toISOString(),
          sourceWeight: 5,
          sourceName: "Generic Feed",
        },
        {
          title: "Nvidia faces new AI chip export controls",
          content: "Fresh policy pressure on semiconductor exports",
          pubDate: new Date().toISOString(),
          sourceWeight: 10,
          sourceName: "Reuters",
        },
      ],
      {
        category: "Technology",
        keywords: ["Nvidia", "AI chips", "export controls"],
      },
    );

    expect(ranked[0]?.title).toBe("Nvidia faces new AI chip export controls");
  });

  test("ranks hook options and returns score guidance for selection", async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: {
        response: JSON.stringify([
          "Breaking down what just happened in Nvidia export controls today",
          "Weekend lifestyle chatter is getting attention online",
          "Why Nvidia export controls could change AI chips right now",
        ]),
      },
    } as never);

    const generator = new AiLlmGenerator("http://mocked", "model");
    const hooks = await generator.suggestHooks(
      [{ title: "Nvidia export controls shake AI chip market", content: "Fresh policy pressure builds today" }],
      {
        topic: "Nvidia export controls",
        style: "News",
        keywords: ["Nvidia", "AI chips", "export controls"],
      },
    );

    expect(hooks).toHaveLength(3);
    expect(hooks[0]?.text).toContain("Nvidia export controls");
    expect(hooks[0]?.score).toBeGreaterThanOrEqual(hooks[1]?.score || 0);
    expect(hooks[0]?.scoreLabel).toMatch(/Strong|Good/);
    expect(hooks[0]?.rationale).toContain("Aligned with selected topic");
  });
});
