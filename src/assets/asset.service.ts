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
}

export class AssetService {
  private localAssetsPath: string;
  private sources: AssetSource[] = [];

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
}
