import fs from "fs-extra";
import path from "path";
import cuid from "cuid";

export interface ABVariantRecord {
  id: string;
  videoId: string;
  variantKey: string;
  title: string;
  thumbnail?: string;
  assignedCount: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export class ABVariantStore {
  private storePath: string;

  constructor(basePath: string) {
    this.storePath = path.join(basePath, "abVariants.json");
    fs.ensureFileSync(this.storePath);
    if (!fs.readFileSync(this.storePath, "utf-8").trim()) {
      fs.writeFileSync(this.storePath, "[]", "utf-8");
    }
  }

  private async readAll(): Promise<ABVariantRecord[]> {
    const content = await fs.readFile(this.storePath, "utf-8");
    if (!content.trim()) return [];
    try { return JSON.parse(content) as ABVariantRecord[]; } catch { return []; }
  }

  private async writeAll(records: ABVariantRecord[]): Promise<void> {
    await fs.writeFile(this.storePath, JSON.stringify(records, null, 2), "utf-8");
  }

  async create(params: Omit<ABVariantRecord, "id" | "assignedCount" | "clicks" | "createdAt" | "updatedAt">): Promise<ABVariantRecord> {
    const current = await this.readAll();
    const now = new Date().toISOString();
    const rec: ABVariantRecord = {
      id: cuid(),
      assignedCount: 0,
      clicks: 0,
      createdAt: now,
      updatedAt: now,
      ...params,
    };
    current.push(rec);
    await this.writeAll(current);
    return rec;
  }

  async list(videoId: string): Promise<ABVariantRecord[]> {
    return (await this.readAll()).filter((v) => v.videoId === videoId);
  }

  async assign(videoId: string): Promise<ABVariantRecord | undefined> {
    const current = await this.readAll();
    const candidates = current.filter((v) => v.videoId === videoId);
    if (candidates.length === 0) return undefined;
    candidates.sort((a, b) => a.assignedCount - b.assignedCount);
    const pick = candidates[0];
    const idx = current.findIndex((v) => v.id === pick.id);
    current[idx].assignedCount += 1;
    current[idx].updatedAt = new Date().toISOString();
    await this.writeAll(current);
    return current[idx];
  }
}
