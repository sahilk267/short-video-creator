import Parser from "rss-parser";
import path from "path";
import { CustomNewsSourceStore, type CustomNewsSourceRecord } from "../db/CustomNewsSourceStore";

export interface NewsSourceDefinition {
  id: string;
  name: string;
  url: string;
  category: string;
  subCategory?: string;
  custom?: boolean;
}

export const NEWS_SOURCES: NewsSourceDefinition[] = [
  { id: "bbc", name: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "World", subCategory: "General" },
  { id: "cnn", name: "CNN International", url: "http://rss.cnn.com/rss/edition_world.rss", category: "World", subCategory: "General" },
  { id: "reuters", name: "Reuters World", url: "https://www.reuters.com/arc/outboundfeeds/v1/article?size=10&content=world", category: "World", subCategory: "Politics" },
  { id: "aljazeera", name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "World", subCategory: "Politics" },
  { id: "googlenews", name: "Google News (World)", url: "https://news.google.com/rss", category: "World", subCategory: "General" },
  { id: "bbc_gen", name: "BBC News", url: "https://feeds.bbci.co.uk/news/rss.xml", category: "General" },
  { id: "reuters_gen", name: "Reuters", url: "https://www.reuters.com/arc/outboundfeeds/v1/article?size=10", category: "General" },
  { id: "espncricinfo", name: "ESPNcricinfo", url: "https://www.espncricinfo.com/rss/content/story/feeds/0.xml", category: "Cricket" },
  { id: "icc", name: "ICC News", url: "https://www.icc-cricket.com/rss/news", category: "Cricket" },
  { id: "nba", name: "NBA.com", url: "https://www.nba.com/rss/nba_rss.xml", category: "NBA" },
  { id: "espn_nba", name: "ESPN NBA", url: "https://www.espn.com/espn/rss/nba/news", category: "NBA" },
  { id: "theverge", name: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "Technology", subCategory: "Gadgets" },
  { id: "techcrunch", name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "Technology", subCategory: "Startups" },
  { id: "wired", name: "Wired", url: "https://www.wired.com/feed/rss", category: "Technology", subCategory: "Reviews" },
  { id: "engadget", name: "Engadget", url: "https://www.engadget.com/rss.xml", category: "Technology", subCategory: "Gadgets" },
  { id: "ft", name: "Financial Times", url: "https://www.ft.com/?format=rss", category: "Business", subCategory: "Finance" },
  { id: "forbes", name: "Forbes", url: "https://www.forbes.com/real-time/feed2/", category: "Business", subCategory: "Wealth" },
  { id: "bloomberg", name: "Bloomberg", url: "https://www.bloomberg.com/feeds/bview/rss", category: "Business", subCategory: "Markets" },
  { id: "espn", name: "ESPN General", url: "https://www.espn.com/espn/rss/news", category: "Sports", subCategory: "All Sports" },
  { id: "bbcsport", name: "BBC Sport", url: "http://feeds.bbci.co.uk/sport/rss.xml", category: "Sports", subCategory: "International" },
  { id: "nasa", name: "NASA News", url: "https://www.nasa.gov/rss/dyn/breaking_news.rss", category: "Science", subCategory: "Space" },
  { id: "sciencedaily", name: "ScienceDaily", url: "https://www.sciencedaily.com/rss/all.xml", category: "Science", subCategory: "General" },
  { id: "physorg", name: "Phys.org", url: "https://phys.org/rss-feed/", category: "Science", subCategory: "Physics" },
];

export interface NewsStory {
  title: string;
  content: string;
  link: string;
  pubDate: string;
}

export class RssFetcher {
  private parser: Parser;
  private customSourceStore: CustomNewsSourceStore;

  constructor(basePath: string = process.env.DATA_DIR_PATH || path.join(process.cwd(), "data")) {
    this.parser = new Parser();
    this.customSourceStore = new CustomNewsSourceStore(basePath);
  }

  public listSourcesSync(): NewsSourceDefinition[] {
    const customSources = this.customSourceStore.listSync().map((source) => this.mapCustomSource(source));
    return [...NEWS_SOURCES, ...customSources]
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }

  private mapCustomSource(source: CustomNewsSourceRecord): NewsSourceDefinition {
    return {
      id: source.id,
      name: source.name,
      url: source.url,
      category: source.category,
      subCategory: source.subCategory,
      custom: true,
    };
  }

  private findSource(sourceId: string): NewsSourceDefinition | undefined {
    return this.listSourcesSync().find((source) => source.id === sourceId);
  }

  async fetchStories(sourceId: string): Promise<NewsStory[]> {
    const source = this.findSource(sourceId);
    if (!source) {
      throw new Error(`Source ${sourceId} not found`);
    }

    try {
      console.log(`[RssFetcher] Parsing feed URL: ${source.url}`);
      const feed = await this.parser.parseURL(source.url);
      console.log(`[RssFetcher] Fetched ${feed.items?.length || 0} stories from ${source.id}`);

      return (feed.items || []).slice(0, 5).map((item) => ({
        title: item.title || "",
        content: item.contentSnippet || item.content || "",
        link: item.link || "",
        pubDate: item.pubDate || "",
      }));
    } catch (error) {
      console.error(`[RssFetcher] Error fetching from ${source.id}:`, error);
      throw error;
    }
  }

  async fetchStoriesFromSources(sourceIds: string[]): Promise<NewsStory[]> {
    const uniqueSourceIds = Array.from(new Set(sourceIds.filter(Boolean)));
    if (uniqueSourceIds.length === 0) {
      return [];
    }

    const settled = await Promise.allSettled(
      uniqueSourceIds.map((sourceId) => this.fetchStories(sourceId)),
    );

    const mergedStories = settled.flatMap((result) => (
      result.status === "fulfilled" ? result.value : []
    ));

    const deduped = Array.from(new Map(
      mergedStories.map((story) => {
        const key = (story.link || story.title).trim().toLowerCase();
        return [key, story];
      }),
    ).values());

    return deduped
      .sort((a, b) => {
        const aTime = Date.parse(a.pubDate || "") || 0;
        const bTime = Date.parse(b.pubDate || "") || 0;
        return bTime - aTime;
      })
      .slice(0, 12);
  }
}
