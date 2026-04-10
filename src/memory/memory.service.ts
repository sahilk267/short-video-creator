/**
 * Memory Service - Store and retrieve high-performing script patterns
 * Enables the system to learn from successful content
 */

import fs from "fs-extra";
import path from "path";
import cuid from "cuid";
import { logger } from "../logger";

export interface StoredPattern {
  id: string;
  category: string;
  topic?: string;
  script: string;
  score: number;
  style: "News" | "Viral" | "Explainer";
  engagement?: {
    views: number;
    likes: number;
    shares: number;
  };
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PatternQuery {
  category: string;
  style?: string;
  minScore?: number;
  limit?: number;
}

export class MemoryService {
  private patternsPath: string;
  private patterns: StoredPattern[] = [];

  constructor(basePath: string) {
    this.patternsPath = path.join(basePath, "script-patterns.json");
    fs.ensureFileSync(this.patternsPath);
    this.loadPatterns();
  }

  /**
   * Load patterns from disk
   */
  private loadPatterns(): void {
    try {
      const content = fs.readFileSync(this.patternsPath, "utf-8");
      if (content.trim()) {
        this.patterns = JSON.parse(content);
      } else {
        this.patterns = [];
      }
    } catch (error) {
      logger.warn({ patternsPath: this.patternsPath }, "Failed to load patterns, starting fresh");
      this.patterns = [];
    }
  }

  /**
   * Save patterns to disk
   */
  private async savePatterns(): Promise<void> {
    try {
      await fs.writeFile(this.patternsPath, JSON.stringify(this.patterns, null, 2), "utf-8");
    } catch (error) {
      logger.error({ error, patternsPath: this.patternsPath }, "Failed to save patterns");
    }
  }

  /**
   * Store a high-performing script pattern
   */
  async savePattern(
    script: string,
    score: number,
    category: string,
    options: {
      style?: "News" | "Viral" | "Explainer";
      topic?: string;
      keywords?: string[];
      engagement?: { views: number; likes: number; shares: number };
    } = {},
  ): Promise<StoredPattern> {
    if (score < 65) {
      logger.debug({ score }, "Pattern score too low, not storing");
      return null as any;
    }

    const pattern: StoredPattern = {
      id: cuid(),
      category,
      script,
      score,
      style: options.style || "News",
      topic: options.topic,
      keywords: options.keywords || [],
      engagement: options.engagement,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.patterns.push(pattern);

    // Keep only top 1000 patterns per category to avoid bloat
    this.pruneOldPatterns(category);

    await this.savePatterns();
    logger.info({ patternId: pattern.id, category, score }, "Stored high-performing pattern");

    return pattern;
  }

  /**
   * Retrieve top patterns for a category
   */
  getTopPatterns(query: PatternQuery): StoredPattern[] {
    let results = this.patterns.filter((p) => p.category === query.category);

    if (query.style) {
      results = results.filter((p) => p.style === query.style);
    }

    if (query.minScore !== undefined) {
      results = results.filter((p) => p.score >= query.minScore);
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    const limit = query.limit || 5;
    return results.slice(0, limit);
  }

  /**
   * Get similar patterns by keywords
   */
  getSimilarPatterns(keywords: string[], category: string, limit: number = 3): StoredPattern[] {
    const scored = this.patterns
      .filter((p) => p.category === category)
      .map((p) => {
        const matchedKeywords = keywords.filter((k) => p.keywords.includes(k)).length;
        return { pattern: p, matchedCount: matchedKeywords };
      })
      .filter((item) => item.matchedCount > 0)
      .sort((a, b) => {
        // Sort by matched keyword count first, then by score
        if (a.matchedCount !== b.matchedCount) {
          return b.matchedCount - a.matchedCount;
        }
        return b.pattern.score - a.pattern.score;
      });

    return scored.slice(0, limit).map((item) => item.pattern);
  }

  /**
   * Remove old/low-scoring patterns to keep memory size bounded
   */
  private pruneOldPatterns(category: string): void {
    const categoryPatterns = this.patterns.filter((p) => p.category === category);

    if (categoryPatterns.length > 1000) {
      // Keep only top 800 by score
      const sorted = categoryPatterns.sort((a, b) => b.score - a.score);
      const toRemove = new Set(sorted.slice(800).map((p) => p.id));

      this.patterns = this.patterns.filter((p) => !toRemove.has(p.id));
    }
  }

  /**
   * Update pattern engagement data (called after publish analytics)
   */
  async updatePatternEngagement(
    patternId: string,
    engagement: { views: number; likes: number; shares: number },
  ): Promise<void> {
    const pattern = this.patterns.find((p) => p.id === patternId);
    if (pattern) {
      pattern.engagement = engagement;
      pattern.updatedAt = new Date().toISOString();
      await this.savePatterns();
    }
  }

  /**
   * Get memory stats for monitoring
   */
  getStats(): {
    totalPatterns: number;
    byCategory: Record<string, number>;
    topScores: { category: string; score: number }[];
  } {
    const byCategory: Record<string, number> = {};
    this.patterns.forEach((p) => {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    });

    const topScores = Array.from(Object.entries(byCategory))
      .map(([category]) => {
        const topPattern = this.patterns
          .filter((p) => p.category === category)
          .sort((a, b) => b.score - a.score)[0];
        return { category, score: topPattern?.score || 0 };
      })
      .sort((a, b) => b.score - a.score);

    return {
      totalPatterns: this.patterns.length,
      byCategory,
      topScores,
    };
  }
}
