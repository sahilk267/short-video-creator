import { describe, expect, test, vi } from "vitest";

import { RssFetcher, type NewsStory } from "./RssFetcher";

describe("RssFetcher aggregation quality control", () => {
  test("limits all-sources aggregation by category trust cap", async () => {
    const fetcher = new RssFetcher();
    const fetchStoriesSpy = vi
      .spyOn(fetcher, "fetchStories")
      .mockResolvedValue([
        {
          title: "Story",
          content: "Body",
          link: "https://example.com/story",
          pubDate: new Date().toISOString(),
        },
      ]);

    await fetcher.fetchStoriesFromSources(["bbc", "cnn", "reuters", "aljazeera", "googlenews"]);

    expect(fetchStoriesSpy).toHaveBeenCalledTimes(4);
    expect(fetchStoriesSpy.mock.calls.map((call) => call[0])).toEqual([
      "bbc",
      "reuters",
      "aljazeera",
      "cnn",
    ]);
  });

  test("prefers fresher higher-trust stories when ranking merged results", async () => {
    const fetcher = new RssFetcher();
    vi.spyOn(fetcher, "fetchStories")
      .mockImplementation(async (sourceId: string): Promise<NewsStory[]> => {
        if (sourceId === "bbc") {
          return [
            {
              title: "Major summit talks begin",
              content: "Fresh trusted coverage",
              link: "https://example.com/fresh",
              pubDate: new Date().toISOString(),
              sourceId,
              sourceName: "BBC News",
              sourceWeight: 10,
            },
          ];
        }

        return [
          {
            title: "Major summit talks begin",
            content: "Older lower-trust coverage",
            link: "https://example.com/older",
            pubDate: new Date(Date.now() - (72 * 60 * 60 * 1000)).toISOString(),
            sourceId,
            sourceName: "Google News",
            sourceWeight: 6,
          },
          {
            title: "Background angle",
            content: "Older background story",
            link: "https://example.com/background",
            pubDate: new Date(Date.now() - (96 * 60 * 60 * 1000)).toISOString(),
            sourceId,
            sourceName: "Google News",
            sourceWeight: 6,
          },
        ];
      });

    const stories = await fetcher.fetchStoriesFromSources(["bbc", "googlenews"]);

    expect(stories[0]?.link).toBe("https://example.com/fresh");
  });
});
