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

  async generate(
    platform: string,
    topic: string,
    summary: string,
    language: string = "en",
    options?: {
      keywords?: string[];
      subcategory?: string | null;
      category?: string | null;
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
    },
  ): string {
    const keywords = (options?.keywords || []).slice(0, 10).join(", ");

    return `Generate SEO-optimised video metadata for ${platform} in language "${language}".

Topic: ${topic}
Category: ${options?.category || ""}
Subcategory: ${options?.subcategory || ""}
Keywords: ${keywords}
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

    return {
      title: (parsed.title ?? topic).slice(0, limits.title || 100),
      description: (parsed.description ?? "").slice(0, limits.description),
      tags: ((parsed.tags ?? fallbackKeywords ?? []) as string[]).slice(0, limits.tags || 500),
      hashtags: parsed.hashtags ?? "",
    };
  }

  private templateFallback(
    topic: string,
    summary: string,
    limits: { title: number; description: number; tags: number },
    fallbackKeywords?: string[],
  ): VideoMetadata {
    const words = fallbackKeywords && fallbackKeywords.length > 0
      ? fallbackKeywords.slice(0, 8)
      : topic.split(" ").slice(0, 5);

    return {
      title: topic.slice(0, limits.title || 100),
      description: summary.slice(0, limits.description),
      tags: words.slice(0, Math.max(limits.tags, 10)),
      hashtags: words.map((w) => `#${w.replace(/[^a-zA-Z0-9]/g, "")}`).join(" "),
    };
  }
}
