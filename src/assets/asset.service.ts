/**
 * Asset Service - Multi-source fallback for video assets
 * Gracefully falls back when primary source (Pexels) fails
 */

import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export interface AssetSource {
  name: string;
  type: "web" | "local";
  priority: number;
  available: boolean;
}

export interface FallbackAsset {
  source: string;
  keywords: string[];
  path?: string;
  url?: string;
  duration?: number;
  relevance?: number;
}

export interface AssetUsageRecord {
  assetKey: string;
  keywords: string[];
  timestamp: string;
  videoId: string;
}

export class AssetService {
  private localAssetsPath: string;
  private sources: AssetSource[] = [];
  private usedAssets: Map<string, AssetUsageRecord> = new Map();
  private resultCache: Map<string, FallbackAsset> = new Map();
  private cacheTTL: number = 60 * 60 * 1000; // 1 hour default

  constructor(dataDirPath: string) {
    this.localAssetsPath = path.join(dataDirPath, "assets");
    fs.ensureDirSync(this.localAssetsPath);
    this.initializeSources();
  }

  /**
   * Initialize available asset sources
   */
  private initializeSources(): void {
    this.sources = [
      {
        name: "pexels",
        type: "web",
        priority: 1,
        available: true,
      },
      {
        name: "local",
        type: "local",
        priority: 2,
        available: true,
      },
    ];

    logger.debug({ sources: this.sources.map((s) => s.name) }, "Asset sources initialized");
  }

  /**
   * Try to fetch video with fallback chain
   * Returns null if all sources fail
   */
  async getVideoWithFallback(
    keywords: string[],
    fallbackLogic: {
      pexelsApi?: { findVideo: (keywords: string[], duration: number) => Promise<string> };
      duration?: number;
    },
  ): Promise<FallbackAsset | null> {
    const duration = fallbackLogic.duration || 5;

    // Try each source in priority order
    for (const source of this.sources.sort((a, b) => a.priority - b.priority)) {
      try {
        if (source.name === "pexels" && fallbackLogic.pexelsApi) {
          logger.debug({ keywords }, "Trying Pexels API");
          const url = await fallbackLogic.pexelsApi.findVideo(keywords, duration);
          if (url) {
            return {
              source: "pexels",
              keywords,
              url,
            };
          }
        }

        if (source.name === "local") {
          logger.debug({ keywords }, "Trying local assets");
          const localAsset = await this.findLocalAsset(keywords);
          if (localAsset) {
            return localAsset;
          }
        }
      } catch (error) {
        logger.warn(
          { source: source.name, error: (error as Error).message },
          "Asset source failed, trying next",
        );
        continue;
      }
    }

    logger.warn({ keywords }, "All asset sources exhausted, returning fallback");

    // Last resort: generate placeholder or retry with modified keywords
    return this.generateFallbackAsset(keywords);
  }

  /**
   * Find video asset in local directory
   */
  private async findLocalAsset(keywords: string[]): Promise<FallbackAsset | null> {
    try {
      const files = await fs.readdir(this.localAssetsPath);
      const videoExtensions = [".mp4", ".webm", ".mov"];

      // Try to match files with keywords
      for (const keyword of keywords) {
        const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, "_");

        const match = files.find(
          (file) =>
            videoExtensions.some((ext) => file.endsWith(ext)) &&
            file.toLowerCase().includes(normalizedKeyword),
        );

        if (match) {
          return {
            source: "local",
            keywords: [keyword],
            path: path.join(this.localAssetsPath, match),
          };
        }
      }

      // If no exact match, return first available video
      const firstVideo = files.find((file) => videoExtensions.some((ext) => file.endsWith(ext)));
      if (firstVideo) {
        return {
          source: "local",
          keywords,
          path: path.join(this.localAssetsPath, firstVideo),
        };
      }
    } catch (error) {
      logger.debug({ error: (error as Error).message }, "Error searching local assets");
    }

    return null;
  }

  /**
   * Generate placeholder asset info when all sources fail
   * Allows pipeline to continue with degraded mode
   */
  private generateFallbackAsset(keywords: string[]): FallbackAsset {
    logger.warn({ keywords }, "Using fallback asset placeholder");

    return {
      source: "fallback",
      keywords,
      // In degraded mode, caller should handle missing asset gracefully
      // Could use static placeholder video or adjust rendering strategy
    };
  }

  /**
   * Get stats on available local assets
   */
  async getLocalAssetStats(): Promise<{
    totalAssets: number;
    byExtension: Record<string, number>;
  }> {
    try {
      const files = await fs.readdir(this.localAssetsPath);
      const videoExtensions = [".mp4", ".webm", ".mov"];

      const assets = files.filter((file) => videoExtensions.some((ext) => file.endsWith(ext)));

      const byExtension: Record<string, number> = {};
      assets.forEach((file) => {
        const ext = path.extname(file);
        byExtension[ext] = (byExtension[ext] || 0) + 1;
      });

      return {
        totalAssets: assets.length,
        byExtension,
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, "Error getting local asset stats");
      return { totalAssets: 0, byExtension: {} };
    }
  }

  /**
   * Register custom asset source (for future extensibility)
   */
  registerSource(source: AssetSource): void {
    if (!this.sources.find((s) => s.name === source.name)) {
      this.sources.push(source);
      this.sources.sort((a, b) => a.priority - b.priority);
      logger.info({ sourceName: source.name }, "Custom asset source registered");
    }
  }

  /**
   * Score asset relevance based on keyword match
   */
  scoreAssetRelevance(searchKeywords: string[], assetKeywords: string[]): number {
    if (assetKeywords.length === 0) {
      return 0.5; // Neutral/default score
    }

    const matched = searchKeywords.filter((keyword) =>
      assetKeywords.some((akw) =>
        akw.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(akw.toLowerCase())
      )
    ).length;

    // Score 0-1 based on match percentage
    return Math.min(1, matched / Math.max(1, searchKeywords.length));
  }

  /**
   * Track asset usage to prevent duplicates
   */
  recordAssetUsage(videoId: string, asset: FallbackAsset): void {
    const assetKey = asset.url || asset.path || `fallback-${Math.random()}`;
    const record: AssetUsageRecord = {
      assetKey,
      keywords: asset.keywords,
      timestamp: new Date().toISOString(),
      videoId,
    };

    this.usedAssets.set(assetKey, record);
    logger.debug({ videoId, assetKey }, "Asset usage recorded");
  }

  /**
   * Check if asset has been used recently (duplicate prevention)
   */
  hasRecentlyUsed(assetKey: string, withinMinutes: number = 30): boolean {
    const record = this.usedAssets.get(assetKey);
    if (!record) return false;

    const recordTime = new Date(record.timestamp).getTime();
    const now = Date.now();
    const ageMs = now - recordTime;

    return ageMs < withinMinutes * 60 * 1000;
  }

  /**
   * Get all assets used by a video
   */
  getVideoAssets(videoId: string): AssetUsageRecord[] {
    const videoAssets: AssetUsageRecord[] = [];

    for (const record of this.usedAssets.values()) {
      if (record.videoId === videoId) {
        videoAssets.push(record);
      }
    }

    return videoAssets;
  }

  /**
   * Cache search result for faster subsequent lookups
   */
  private setCacheResult(keywords: string[], asset: FallbackAsset): void {
    const cacheKey = keywords.sort().join("|");
    this.resultCache.set(cacheKey, asset);

    // Auto-expire cache entry after TTL
    setTimeout(() => {
      this.resultCache.delete(cacheKey);
    }, this.cacheTTL);
  }

  /**
   * Get cached search result if available
   */
  private getCachedResult(keywords: string[]): FallbackAsset | undefined {
    const cacheKey = keywords.sort().join("|");
    return this.resultCache.get(cacheKey);
  }

  /**
   * Clear cache and usage tracking (for testing)
   */
  clearCache(): void {
    this.resultCache.clear();
    logger.debug({}, "Asset cache cleared");
  }

  /**
   * Clean old usage records
   */
  cleanOldRecords(olderThanDays: number = 7): number {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    let removed = 0;

    for (const [key, record] of this.usedAssets.entries()) {
      const recordTime = new Date(record.timestamp).getTime();
      if (recordTime < cutoff) {
        this.usedAssets.delete(key);
        removed++;
      }
    }

    logger.debug({ removed, days: olderThanDays }, "Old asset records cleaned");
    return removed;
  }
}

