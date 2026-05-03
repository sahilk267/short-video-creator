import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export interface Episode {
  episodeNumber: number;
  videoId?: string;
  title: string;
  summary: string;
  cliffhanger?: string;
  status: "planned" | "created" | "published";
  createdAt?: string;
  publishedAt?: string;
}

export interface Series {
  id: string;
  title: string;
  category: string;
  platform: string[];
  totalEpisodes: number;
  episodes: Episode[];
  style: "daily" | "weekly" | "mini";
  autoCliffhanger: boolean;
  createdAt: string;
  updatedAt: string;
}

const CLIFFHANGER_TEMPLATES = [
  "But wait — the most shocking part is in Part {next}...",
  "Ye toh bas shuruat hai — Part {next} mein pura sach aayega!",
  "What happened next will surprise you — stay tuned for Part {next}",
  "The real answer comes in Part {next} — you won't believe it",
  "I'll reveal the secret in Part {next} — follow so you don't miss it!",
  "Part {next} is where everything changes — link in bio",
  "Tomorrow's episode will blow your mind — make sure you're following!",
];

export class SeriesBuilderEngine {
  private seriesPath: string;
  private series: Series[] = [];

  constructor(dataDirPath: string) {
    this.seriesPath = path.join(dataDirPath, "series.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.seriesPath)) this.series = fs.readJsonSync(this.seriesPath);
    } catch { this.series = []; }
  }

  private save() {
    try { fs.writeJsonSync(this.seriesPath, this.series, { spaces: 2 }); } catch { /* ignore */ }
  }

  createSeries(data: { title: string; category: string; platform: string[]; totalEpisodes: number; style: Series["style"]; autoCliffhanger?: boolean }): Series {
    const series: Series = {
      id: `series_${Date.now()}`,
      title: data.title,
      category: data.category,
      platform: data.platform,
      totalEpisodes: data.totalEpisodes,
      episodes: [],
      style: data.style,
      autoCliffhanger: data.autoCliffhanger ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    for (let i = 1; i <= data.totalEpisodes; i++) {
      series.episodes.push({
        episodeNumber: i,
        title: `${data.title} - Part ${i}`,
        summary: "",
        status: "planned",
      });
    }
    this.series.push(series);
    this.save();
    logger.info({ seriesId: series.id, episodes: data.totalEpisodes }, "Series created");
    return series;
  }

  generateCliffhanger(seriesId: string, currentEpisode: number): string {
    const series = this.series.find((s) => s.id === seriesId);
    if (!series || !series.autoCliffhanger) return "";
    if (currentEpisode >= series.totalEpisodes) return "Thank you for watching the series!";
    const template = CLIFFHANGER_TEMPLATES[Math.floor(Math.random() * CLIFFHANGER_TEMPLATES.length)];
    return template.replace(/\{next\}/g, String(currentEpisode + 1));
  }

  updateEpisode(seriesId: string, episodeNumber: number, update: Partial<Episode>): boolean {
    const series = this.series.find((s) => s.id === seriesId);
    if (!series) return false;
    const ep = series.episodes.find((e) => e.episodeNumber === episodeNumber);
    if (!ep) return false;
    Object.assign(ep, update);
    series.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  getNextEpisode(seriesId: string): Episode | null {
    const series = this.series.find((s) => s.id === seriesId);
    if (!series) return null;
    return series.episodes.find((e) => e.status === "planned") || null;
  }

  getAllSeries(): Series[] { return this.series; }
  getSeries(id: string): Series | undefined { return this.series.find((s) => s.id === id); }

  deleteSeries(id: string): boolean {
    const before = this.series.length;
    this.series = this.series.filter((s) => s.id !== id);
    if (this.series.length !== before) { this.save(); return true; }
    return false;
  }
}
