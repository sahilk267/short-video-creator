import type { Config } from "../config";
import axios from "axios";
import { logger } from "../logger";

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  hashtags: string;
}

const LIMITS: Record<string, { title: number; description: number; tags: number }> = {
  youtube:   { title: 100, description: 5000, tags: 500 },
  telegram:  { title: 256, description: 1024, tags: 0 },
  instagram: { title: 0, description: 2200, tags: 30 },
  facebook:  { title: 255, description: 63206, tags: 0 },
};

export class MetadataGenerator {
  constructor(private config: Config) {}

  private normalizeKeywordList(keywords?: string[]): string[] {
    return Array.from(new Set(
      (keywords || [])
        .map((keyword) => String(keyword).trim())
        .filter(Boolean),
    )).slice(0, 12);
  }

  private normalizeHashtags(tags: string[]): string {
    return Array.from(new Set(
      tags
        .map((tag) => `#${tag.replace(/[^a-zA-Z0-9]/g, "")}`)
        .filter((tag) => tag.length > 1),
    )).slice(0, 8).join(" ");
  }

  private getPlatformStrategy(platform: string): string {
    if (platform === "youtube") {
      return "Prioritize search-friendly title clarity, keyword relevance, and a strong first-line description.";
    }
    if (platform === "instagram") {
      return "Prioritize punchy caption opening, curiosity, and hashtag-friendly language.";
    }
    if (platform === "facebook") {
      return "Prioritize readability, shareability, and a clean headline-description combination.";
    }
    if (platform === "telegram") {
      return "Prioritize concise, direct copy that works well in a channel feed.";
    }
    return "Balance SEO relevance with readability.";
  }

  async generate(
    platform: string,
    topic: string,
    summary: string,
    language: string = "en",
    options?: {
      keywords?: string[];
      subcategory?: string | null;
      category?: string | null;
      headlines?: string[];
    },
  ): Promise<VideoMetadata> {
    const limits = LIMITS[platform] ?? LIMITS.youtube;

    try {
      const prompt = this.buildPrompt(platform, topic, summary, language, limits, options);
      const res = await axios.post(
        `${this.config.aiLlmUrl}/api/generate`,
        { model: this.config.aiLlmModel, prompt, stream: false, format: "text" },
        { timeout: 30000 },
      );
      const raw: string = res.data?.response ?? "";
      return this.parseResponse(raw, topic, limits, options?.keywords);
    } catch (err: any) {
      logger.warn({ err: err.message, platform, topic }, "LLM metadata generation failed, using template");
      return this.templateFallback(topic, summary, limits, options?.keywords);
    }
  }

  private buildPrompt(
    platform: string,
    topic: string,
    summary: string,
    language: string,
    limits: { title: number; description: number; tags: number },
    options?: {
      keywords?: string[];
      subcategory?: string | null;
      category?: string | null;
      headlines?: string[];
    },
  ): string {
    const keywords = this.normalizeKeywordList(options?.keywords).join(", ");
    const headlines = (options?.headlines || []).slice(0, 3).join(" | ");
    const strategy = this.getPlatformStrategy(platform);

    return `Generate SEO-optimised video metadata for ${platform} in language "${language}".

Platform strategy: ${strategy}

Topic: ${topic}
Category: ${options?.category || ""}
Subcategory: ${options?.subcategory || ""}
Keywords: ${keywords}
Supporting headlines: ${headlines}
Summary: ${summary}

Return ONLY valid JSON with these keys:
{
  "title": "max ${limits.title || 100} chars",
  "description": "max ${limits.description} chars, newlines allowed",
  "tags": ["array", "of", "keywords"],
  "hashtags": "#tag1 #tag2 #tag3"
}
No extra text, no code fences.`;
  }

  private parseResponse(
    raw: string,
    topic: string,
    limits: { title: number; description: number; tags: number },
    fallbackKeywords?: string[],
  ): VideoMetadata {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<VideoMetadata>;

    const normalizedFallbackKeywords = this.normalizeKeywordList(fallbackKeywords);
    const tags = Array.from(new Set(
      [...
        (((parsed.tags ?? []) as string[]) || []),
        ...normalizedFallbackKeywords,
      ].map((tag) => String(tag).trim()).filter(Boolean),
    )).slice(0, limits.tags || 500);

    return {
      title: (parsed.title ?? topic).slice(0, limits.title || 100),
      description: (parsed.description ?? "").slice(0, limits.description),
      tags,
      hashtags: (parsed.hashtags && String(parsed.hashtags).trim()) || this.normalizeHashtags(tags),
    };
  }

  private templateFallback(
    topic: string,
    summary: string,
    limits: { title: number; description: number; tags: number },
    fallbackKeywords?: string[],
  ): VideoMetadata {
    const words = fallbackKeywords && fallbackKeywords.length > 0
      ? this.normalizeKeywordList(fallbackKeywords).slice(0, 8)
      : topic.split(" ").slice(0, 5);
    const titleSeed = Array.from(new Set(
      [topic, ...words].map((value) => String(value).trim()).filter(Boolean),
    )).join(" | ");
    const descriptionSeed = [summary, words.join(", ")]
      .filter(Boolean)
      .join("\n\nKey terms: ")
      .slice(0, limits.description);

    return {
      title: titleSeed.slice(0, limits.title || 100),
      description: descriptionSeed,
      tags: words.slice(0, Math.max(limits.tags, 10)),
      hashtags: this.normalizeHashtags(words),
    };
  }
}
