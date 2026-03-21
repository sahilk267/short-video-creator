import Parser from 'rss-parser';

export const NEWS_SOURCES = [
  // World News
  { id: 'bbc', name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', category: 'World', subCategory: 'General' },
  { id: 'cnn', name: 'CNN International', url: 'http://rss.cnn.com/rss/edition_world.rss', category: 'World', subCategory: 'General' },
  { id: 'reuters', name: 'Reuters World', url: 'http://feeds.reuters.com/reuters/worldNews', category: 'World', subCategory: 'Politics' },
  { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'World', subCategory: 'Politics' },
  { id: 'googlenews', name: 'Google News (World)', url: 'https://news.google.com/rss', category: 'World', subCategory: 'General' },

  // General News (Requested)
  { id: 'bbc_gen', name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', category: 'General' },
  { id: 'reuters_gen', name: 'Reuters', url: 'https://www.reutersagency.com/feed/', category: 'General' },

  // Cricket News (Requested)
  { id: 'espncricinfo', name: 'ESPNcricinfo', url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', category: 'Cricket' },
  { id: 'icc', name: 'ICC News', url: 'https://www.icc-cricket.com/rss/news', category: 'Cricket' },

  // NBA News (Requested)
  { id: 'nba', name: 'NBA.com', url: 'https://www.nba.com/rss/nba_rss.xml', category: 'NBA' },
  { id: 'espn_nba', name: 'ESPN NBA', url: 'https://www.espn.com/espn/rss/nba/news', category: 'NBA' },

  // Technology
  { id: 'theverge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Technology', subCategory: 'Gadgets' },
  { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Technology', subCategory: 'Startups' },
  { id: 'wired', name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'Technology', subCategory: 'Reviews' },
  { id: 'engadget', name: 'Engadget', url: 'https://www.engadget.com/rss.xml', category: 'Technology', subCategory: 'Gadgets' },

  // Business
  { id: 'ft', name: 'Financial Times', url: 'https://www.ft.com/?format=rss', category: 'Business', subCategory: 'Finance' },
  { id: 'forbes', name: 'Forbes', url: 'https://www.forbes.com/real-time/feed2/', category: 'Business', subCategory: 'Wealth' },
  { id: 'bloomberg', name: 'Bloomberg', url: 'https://www.bloomberg.com/feeds/bview/rss', category: 'Business', subCategory: 'Markets' },

  // Sports (Other)
  { id: 'espn', name: 'ESPN General', url: 'https://www.espn.com/espn/rss/news', category: 'Sports', subCategory: 'All Sports' },
  { id: 'bbcsport', name: 'BBC Sport', url: 'http://feeds.bbci.co.uk/sport/rss.xml', category: 'Sports', subCategory: 'International' },

  // Science
  { id: 'nasa', name: 'NASA News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', category: 'Science', subCategory: 'Space' },
  { id: 'sciencedaily', name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/all.xml', category: 'Science', subCategory: 'General' },
  { id: 'physorg', name: 'Phys.org', url: 'https://phys.org/rss-feed/', category: 'Science', subCategory: 'Physics' },
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
