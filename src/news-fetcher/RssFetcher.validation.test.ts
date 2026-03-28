import nock from "nock";
import { afterEach, describe, expect, test } from "vitest";

import { RssFetcher } from "./RssFetcher";

afterEach(() => {
  nock.cleanAll();
});

describe("RssFetcher feed validation", () => {
  test("accepts a valid feed with usable items", async () => {
    nock("https://example.com")
      .get("/rss.xml")
      .reply(200, `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Example Feed</title>
            <item>
              <title>Valid story</title>
              <description>Story body</description>
              <link>https://example.com/story</link>
              <pubDate>Sat, 28 Mar 2026 04:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>`);

    const fetcher = new RssFetcher();
    const result = await fetcher.validateFeedUrl("https://example.com/rss.xml");

    expect(result).toEqual({ ok: true, itemCount: 1 });
  });

  test("rejects an empty feed", async () => {
    nock("https://example.com")
      .get("/empty.xml")
      .reply(200, `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Empty Feed</title>
          </channel>
        </rss>`);

    const fetcher = new RssFetcher();
    const result = await fetcher.validateFeedUrl("https://example.com/empty.xml");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("no usable items");
    }
  });
});
