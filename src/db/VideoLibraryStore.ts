import fs from "fs-extra";
import path from "path";
import cuid from "cuid";

export interface VideoRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  duration: number;
  platform: string;
  status: "draft" | "published" | "scheduled" | "archived";
  videoPath?: string;
  thumbnailPath?: string;
  tags: string[];
  engagementMetrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  publishedAt?: string;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
}

export class VideoLibraryStore {
  private storePath: string;

  constructor(basePath: string) {
    this.storePath = path.join(basePath, "videoLibrary.json");
    fs.ensureFileSync(this.storePath);
    if (!fs.readFileSync(this.storePath, "utf-8").trim()) {
      fs.writeFileSync(this.storePath, "[]", "utf-8");
    }
  }

  private async readAll(): Promise<VideoRecord[]> {
    const content = await fs.readFile(this.storePath, "utf-8");
    if (!content.trim()) return [];
    try {
      return JSON.parse(content) as VideoRecord[];
    } catch {
      await fs.writeFile(this.storePath, "[]", "utf-8");
      return [];
    }
  }

  private async writeAll(records: VideoRecord[]): Promise<void> {
    await fs.writeFile(this.storePath, JSON.stringify(records, null, 2), "utf-8");
  }

  async create(data: Omit<VideoRecord, "id" | "createdAt" | "updatedAt">): Promise<VideoRecord> {
    const records = await this.readAll();
    const now = new Date().toISOString();
    const record: VideoRecord = {
      id: `vid_${cuid()}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    records.push(record);
    await this.writeAll(records);
    return record;
  }

  async get(id: string): Promise<VideoRecord | undefined> {
    return (await this.readAll()).find((r) => r.id === id);
  }

  async list(limit = 50, offset = 0): Promise<{ videos: VideoRecord[]; total: number }> {
    const all = await this.readAll();
    const sorted = all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
      videos: sorted.slice(offset, offset + limit),
      total: sorted.length,
    };
  }

  async listByCategory(category: string, limit = 50, offset = 0): Promise<VideoRecord[]> {
    const all = await this.readAll();
    return all.filter((v) => v.category === category).slice(offset, offset + limit);
  }

  async listByStatus(status: VideoRecord["status"], limit = 50, offset = 0): Promise<VideoRecord[]> {
    const all = await this.readAll();
    return all.filter((v) => v.status === status).slice(offset, offset + limit);
  }

  async listByPlatform(platform: string, limit = 50, offset = 0): Promise<VideoRecord[]> {
    const all = await this.readAll();
    return all.filter((v) => v.platform === platform).slice(offset, offset + limit);
  }

  async search(query: string, limit = 50, offset = 0): Promise<VideoRecord[]> {
    const all = await this.readAll();
    const q = query.toLowerCase();
    return all
      .filter((v) => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q) || v.tags.some((t) => t.toLowerCase().includes(q)))
      .slice(offset, offset + limit);
  }

  async update(id: string, data: Partial<Omit<VideoRecord, "id" | "createdAt">>): Promise<VideoRecord | undefined> {
    const records = await this.readAll();
    const idx = records.findIndex((r) => r.id === id);
    if (idx < 0) return undefined;
    records[idx] = { ...records[idx], ...data, updatedAt: new Date().toISOString() };
    await this.writeAll(records);
    return records[idx];
  }

  async updateStatus(id: string, status: VideoRecord["status"]): Promise<VideoRecord | undefined> {
    return this.update(id, { status, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<boolean> {
    const records = await this.readAll();
    const idx = records.findIndex((r) => r.id === id);
    if (idx < 0) return false;
    records.splice(idx, 1);
    await this.writeAll(records);
    return true;
  }

  async updateMetrics(
    id: string,
    metrics: Partial<NonNullable<VideoRecord["engagementMetrics"]>>,
  ): Promise<VideoRecord | undefined> {
    const record = await this.get(id);
    if (!record) return undefined;
    const current = record.engagementMetrics ?? { views: 0, likes: 0, comments: 0, shares: 0 };
    return this.update(id, {
      engagementMetrics: {
        views: metrics.views ?? current.views,
        likes: metrics.likes ?? current.likes,
        comments: metrics.comments ?? current.comments,
        shares: metrics.shares ?? current.shares,
      },
    });
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byPlatform: Record<string, number>;
  }> {
    const records = await this.readAll();
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};

    records.forEach((v) => {
      byStatus[v.status] = (byStatus[v.status] || 0) + 1;
      byCategory[v.category] = (byCategory[v.category] || 0) + 1;
      byPlatform[v.platform] = (byPlatform[v.platform] || 0) + 1;
    });

    return { total: records.length, byStatus, byCategory, byPlatform };
  }

  async getTrendingTags(limit = 20): Promise<Array<{ tag: string; count: number }>> {
    const records = await this.readAll();
    const tagCounts: Record<string, number> = {};
    records.forEach((v) => {
      v.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}
