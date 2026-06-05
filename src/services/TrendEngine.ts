/* eslint-disable @remotion/deterministic-randomness */

import Parser from "rss-parser";
import { logger } from "../logger";

export interface TrendTopic {
  title: string;
  category: string;
  source: string;
  trendScore: number;
  viralScore: number;
  keywords: string[];
  fetchedAt: string;
  link?: string;
}

export interface TrendResult {
  topics: TrendTopic[];
  fetchedAt: string;
  sources: string[];
}

const TREND_RSS_SOURCES = [
  { id: "google_trends_daily", url: "https://trends.google.com/trends/trendingsearches/daily/rss?geo=US", category: "General", source: "Google Trends" },
  { id: "google_trends_realtime", url: "https://trends.google.com/trends/trendingsearches/realtime/rss?geo=US&cat=all", category: "General", source: "Google Trends RT" },
  { id: "reddit_popular", url: "https://www.reddit.com/r/popular/.rss", category: "Social", source: "Reddit Popular" },
  { id: "reddit_worldnews", url: "https://www.reddit.com/r/worldnews/top/.rss?t=day", category: "News", source: "Reddit WorldNews" },
  { id: "reddit_technology", url: "https://www.reddit.com/r/technology/top/.rss?t=day", category: "Tech", source: "Reddit Tech" },
  { id: "reddit_business", url: "https://www.reddit.com/r/business/top/.rss?t=day", category: "Business", source: "Reddit Business" },
  { id: "hackernews", url: "https://news.ycombinator.com/rss", category: "Tech", source: "HackerNews" },
  { id: "producthunt", url: "https://www.producthunt.com/feed", category: "Tech", source: "ProductHunt" },
  { id: "youtube_trending_rss", url: "https://www.youtube.com/feeds/videos.xml?chart=most_popular&hl=en&gl=US", category: "Entertainment", source: "YouTube Trending" },
];

const VIRAL_KEYWORDS = [
  "breaking", "viral", "trending", "shocking", "exposed", "leaked", "secret",
  "nobody", "banned", "urgent", "alert", "warning", "exclusive", "first",
  "biggest", "worst", "best", "most", "top", "new", "latest", "update",
];

export class TrendEngine {
  private parser: Parser;
  private cache: { result: TrendResult; expiresAt: number } | null = null;
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 min

  constructor() {
    this.parser = new Parser({ timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } });
  }

  private scoreViralPotential(title: string): number {
    const lower = title.toLowerCase();
    let score = 30;
    for (const kw of VIRAL_KEYWORDS) {
      if (lower.includes(kw)) score += 8;
    }
    if (title.includes("?")) score += 5;
    if (title.includes("!")) score += 5;
    const wordCount = title.split(" ").length;
    if (wordCount >= 5 && wordCount <= 12) score += 10;
    return Math.min(100, score);
  }

  private extractKeywords(title: string): string[] {
    const stopwords = new Set(["the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "shall", "should", "may", "might", "must", "can", "could"]);
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopwords.has(w))
      .slice(0, 6);
  }

  private detectCategory(title: string, sourceCategory: string): string {
    const lower = title.toLowerCase();
    if (/tech|ai|software|app|crypto|bitcoin|code/.test(lower)) return "Technology";
    if (/sport|football|cricket|nba|soccer|game/.test(lower)) return "Sports";
    if (/politic|election|president|congress|senate|government/.test(lower)) return "Politics";
    if (/business|market|stock|economy|finance|startup/.test(lower)) return "Business";
    if (/science|research|study|discovery|nasa|space/.test(lower)) return "Science";
    if (/health|medical|covid|vaccine|disease/.test(lower)) return "Health";
    if (/movie|music|celebrity|entertainment/.test(lower)) return "Entertainment";
    return sourceCategory;
  }

  async fetchTrends(categories?: string[]): Promise<TrendResult> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      logger.debug("Returning cached trends");
      return this.cache.result;
    }

    const topics: TrendTopic[] = [];
    const usedSources: string[] = [];

    await Promise.allSettled(
      TREND_RSS_SOURCES.map(async (src) => {
        try {
          const feed = await this.parser.parseURL(src.url);
          usedSources.push(src.source);
          const items = feed.items.slice(0, 10);
          for (const item of items) {
            const title = item.title || "";
            if (!title) continue;
            const category = this.detectCategory(title, src.category);
            if (categories && categories.length > 0 && !categories.includes(category)) continue;
            const viralScore = this.scoreViralPotential(title);
            const trendScore = Math.min(100, viralScore + Math.floor(Math.random() * 20));
            topics.push({
              title,
              category,
              source: src.source,
              trendScore,
              viralScore,
              keywords: this.extractKeywords(title),
              fetchedAt: new Date().toISOString(),
              link: item.link,
            });
          }
        } catch (err) {
          logger.warn({ source: src.id, err: (err as Error).message }, "Failed to fetch trend source");
        }
      }),
    );

    const sorted = topics.sort((a, b) => b.trendScore - a.trendScore).slice(0, 50);
    const result: TrendResult = { topics: sorted, fetchedAt: new Date().toISOString(), sources: usedSources };
    this.cache = { result, expiresAt: Date.now() + this.CACHE_TTL_MS };
    logger.info({ count: sorted.length, sources: usedSources.length }, "Trends fetched");
    return result;
  }

  async getTopByCategory(category: string, limit = 10): Promise<TrendTopic[]> {
    const result = await this.fetchTrends([category]);
    return result.topics.filter((t) => t.category === category).slice(0, limit);
  }

  clearCache() {
    this.cache = null;
  }
}
