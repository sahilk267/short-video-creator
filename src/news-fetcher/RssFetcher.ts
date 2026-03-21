import Parser from 'rss-parser';

export const NEWS_SOURCES = [
  { id: 'bbc', name: 'BBC News (World)', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
  { id: 'cnn', name: 'CNN (World)', url: 'http://rss.cnn.com/rss/edition_world.rss' },
  { id: 'reuters', name: 'Reuters (World)', url: 'http://feeds.reuters.com/reuters/worldNews' },
  { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { id: 'googlenews', name: 'Google News', url: 'https://news.google.com/rss' },
  { id: 'theverge', name: 'The Verge (Tech)', url: 'https://www.theverge.com/rss/index.xml' },
  { id: 'nasa', name: 'NASA Breaking News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' },
];

export interface NewsStory {
  title: string;
  content: string;
  link: string;
  pubDate: string;
}

export class RssFetcher {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  async fetchStories(sourceId: string): Promise<NewsStory[]> {
    const source = NEWS_SOURCES.find(s => s.id === sourceId);
    if (!source) {
      throw new Error(`Source ${sourceId} not found`);
    }

    console.log(`[RssFetcher] Fetching RSS from: ${source.url}`);
    try {
      const feed = await this.parser.parseURL(source.url);
      console.log(`[RssFetcher] Fetched ${feed.items?.length || 0} stories from ${source.id}`);
      
      return (feed.items || []).slice(0, 5).map(item => ({
        title: item.title || '',
        content: item.contentSnippet || item.content || '',
        link: item.link || '',
        pubDate: item.pubDate || '',
      }));
    } catch (error) {
      console.error(`[RssFetcher] Error fetching from ${source.id}:`, error);
      throw error;
    }
  }
}
