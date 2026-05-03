import axios from "axios";
import { logger } from "../../logger";

export interface PixabayVideo {
  id: number;
  url: string;
  duration: number;
  width: number;
  height: number;
  tags: string;
  user: string;
  videos: {
    large?: { url: string; width: number; height: number; size: number };
    medium?: { url: string; width: number; height: number; size: number };
    small?: { url: string; width: number; height: number; size: number };
  };
}

export class PixabayAPI {
  private apiKey: string;
  private baseUrl = "https://pixabay.com/api/videos/";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async findVideo(searchTerms: string[], minDuration: number = 3): Promise<string | null> {
    if (!this.apiKey) {
      logger.warn("Pixabay API key not set");
      return null;
    }
    const query = searchTerms.slice(0, 3).join(" ");
    try {
      const res = await axios.get(this.baseUrl, {
        params: { key: this.apiKey, q: query, per_page: 10, min_width: 720, video_type: "film" },
        timeout: 8000,
      });
      const hits: PixabayVideo[] = res.data.hits || [];
      const valid = hits.filter((h) => h.duration >= minDuration);
      if (valid.length === 0) return null;
      const selected = valid[Math.floor(Math.random() * Math.min(5, valid.length))];
      const videoUrl = selected.videos.large?.url || selected.videos.medium?.url || selected.videos.small?.url;
      if (!videoUrl) return null;
      logger.debug({ query, videoId: selected.id, url: videoUrl }, "Pixabay video found");
      return videoUrl;
    } catch (err) {
      logger.warn({ err: (err as Error).message, query }, "Pixabay fetch failed");
      return null;
    }
  }

  async findImage(searchTerms: string[]): Promise<string | null> {
    if (!this.apiKey) return null;
    const query = searchTerms.slice(0, 3).join(" ");
    try {
      const res = await axios.get("https://pixabay.com/api/", {
        params: { key: this.apiKey, q: query, per_page: 10, image_type: "photo", min_width: 1280 },
        timeout: 8000,
      });
      const hits = res.data.hits || [];
      if (hits.length === 0) return null;
      const selected = hits[Math.floor(Math.random() * Math.min(5, hits.length))];
      return selected.largeImageURL || selected.webformatURL || null;
    } catch (err) {
      logger.warn({ err: (err as Error).message, query }, "Pixabay image fetch failed");
      return null;
    }
  }

  isConfigured(): boolean { return Boolean(this.apiKey); }
}
