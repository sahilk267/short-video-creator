import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import { logger } from "../logger";

export type AssetType = "video" | "image" | "audio" | "font" | "overlay" | "music" | "other";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  tags: string[];
  filePath: string;
  sizeMb: number;
  mimeType?: string;
  width?: number;
  height?: number;
  durationSec?: number;
  category?: string;
  source?: string;
  addedAt: string;
  lastUsedAt?: string;
  useCount: number;
}

export interface AssetSearchQuery {
  type?: AssetType;
  tags?: string[];
  category?: string;
  nameContains?: string;
  minWidth?: number;
  maxDurationSec?: number;
}

export interface ImportResult {
  asset: Asset;
  wasNew: boolean;
}

export class AssetLibraryEngine {
  private dataPath: string;
  private assets: Asset[] = [];

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "asset-library.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dataPath)) this.assets = fs.readJsonSync(this.dataPath);
    } catch { this.assets = []; }
  }

  private save() {
    try { fs.writeJsonSync(this.dataPath, this.assets, { spaces: 2 }); } catch { /* ignore */ }
  }

  private generateId(filePath: string): string {
    return "ast_" + crypto.createHash("sha256").update(filePath).digest("hex").substring(0, 12);
  }

  importAsset(filePath: string, opts: Partial<Asset> = {}): ImportResult {
    try {
      const id = this.generateId(filePath);
      const existing = this.assets.find((a) => a.id === id);
      if (existing) {
        logger.debug({ filePath }, "AssetLibraryEngine: asset already exists");
        return { asset: existing, wasNew: false };
      }

      let sizeMb = 0;
      try { sizeMb = Math.round(fs.statSync(filePath).size / 1024 / 1024 * 100) / 100; } catch { /* ignore */ }

      const ext = path.extname(filePath).toLowerCase().replace(".", "");
      const typeMap: Record<string, AssetType> = {
        mp4: "video", mov: "video", avi: "video", webm: "video",
        jpg: "image", jpeg: "image", png: "image", gif: "image", webp: "image", svg: "image",
        mp3: "audio", wav: "audio", ogg: "audio", aac: "audio",
        ttf: "font", otf: "font", woff: "font", woff2: "font",
      };

      const asset: Asset = {
        id,
        name: opts.name || path.basename(filePath),
        type: opts.type || typeMap[ext] || "other",
        tags: opts.tags || [],
        filePath,
        sizeMb,
        mimeType: opts.mimeType,
        width: opts.width,
        height: opts.height,
        durationSec: opts.durationSec,
        category: opts.category,
        source: opts.source || "local",
        addedAt: new Date().toISOString(),
        useCount: 0,
      };

      this.assets.push(asset);
      this.save();
      logger.debug({ id, name: asset.name, type: asset.type }, "AssetLibraryEngine: asset imported");
      return { asset, wasNew: true };
    } catch (err) {
      logger.error({ err, filePath }, "AssetLibraryEngine.importAsset error");
      throw err;
    }
  }

  addVirtual(opts: Omit<Asset, "id" | "addedAt" | "useCount">): Asset {
    const id = "ast_" + crypto.randomBytes(6).toString("hex");
    const asset: Asset = { ...opts, id, addedAt: new Date().toISOString(), useCount: 0 };
    this.assets.push(asset);
    this.save();
    return asset;
  }

  search(query: AssetSearchQuery): Asset[] {
    return this.assets.filter((a) => {
      if (query.type && a.type !== query.type) return false;
      if (query.category && a.category !== query.category) return false;
      if (query.nameContains && !a.name.toLowerCase().includes(query.nameContains.toLowerCase())) return false;
      if (query.tags && query.tags.length > 0) {
        const hasAll = query.tags.every((t) => a.tags.includes(t));
        if (!hasAll) return false;
      }
      if (query.minWidth && (a.width || 0) < query.minWidth) return false;
      if (query.maxDurationSec && (a.durationSec || Infinity) > query.maxDurationSec) return false;
      return true;
    });
  }

  recordUsage(assetId: string): void {
    const asset = this.assets.find((a) => a.id === assetId);
    if (asset) {
      asset.useCount++;
      asset.lastUsedAt = new Date().toISOString();
      this.save();
    }
  }

  updateTags(assetId: string, tags: string[]): Asset | undefined {
    const asset = this.assets.find((a) => a.id === assetId);
    if (asset) { asset.tags = tags; this.save(); }
    return asset;
  }

  delete(assetId: string): boolean {
    const idx = this.assets.findIndex((a) => a.id === assetId);
    if (idx >= 0) { this.assets.splice(idx, 1); this.save(); return true; }
    return false;
  }

  getById(id: string): Asset | undefined { return this.assets.find((a) => a.id === id); }
  getAll(): Asset[] { return this.assets; }
  getByType(type: AssetType): Asset[] { return this.assets.filter((a) => a.type === type); }
  getMostUsed(limit = 10): Asset[] { return [...this.assets].sort((a, b) => b.useCount - a.useCount).slice(0, limit); }

  getStats() {
    const byType: Record<string, number> = {};
    let totalSizeMb = 0;
    for (const a of this.assets) {
      byType[a.type] = (byType[a.type] || 0) + 1;
      totalSizeMb += a.sizeMb;
    }
    return { total: this.assets.length, byType, totalSizeMb: Math.round(totalSizeMb * 100) / 100 };
  }
}
