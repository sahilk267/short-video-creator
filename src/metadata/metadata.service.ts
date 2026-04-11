/**
 * Metadata Service - Generate platform-specific metadata
 * Creates titles, descriptions, and hashtags optimized per platform
 */

import { logger } from "../logger";

export type PlatformType = "youtube" | "instagram" | "tiktok" | "telegram" | "facebook";

export interface PlatformMetadata {
  title: string;
  description: string;
  hashtags: string[];
  platform: PlatformType;
  keywords: string[];
}

export interface PlatformLimits {
  maxTitleLength: number;
  maxDescriptionLength: number;
  maxHashtagCount: number;
  maxHashtagLength: number;
  supportEmojis: boolean;
}

export class MetadataService {
  /**
   * Platform-specific content limits
   */
  private platformLimits: Record<PlatformType, PlatformLimits> = {
    youtube: {
      maxTitleLength: 70,
      maxDescriptionLength: 5000,
      maxHashtagCount: 30,
      maxHashtagLength: 30,
      supportEmojis: true,
    },
    instagram: {
      maxTitleLength: 30, // caption header
      maxDescriptionLength: 2200,
      maxHashtagCount: 30,
      maxHashtagLength: 30,
      supportEmojis: true,
    },
    tiktok: {
      maxTitleLength: 150,
      maxDescriptionLength: 2200,
      maxHashtagCount: 10,
      maxHashtagLength: 30,
      supportEmojis: true,
    },
    telegram: {
      maxTitleLength: 100,
      maxDescriptionLength: 4096,
      maxHashtagCount: 10,
      maxHashtagLength: 30,
      supportEmojis: false,
    },
    facebook: {
      maxTitleLength: 70,
      maxDescriptionLength: 63206,
      maxHashtagCount: 30,
      maxHashtagLength: 30,
      supportEmojis: true,
    },
  };

  /**
   * Generate platform-specific metadata from script
   */
  generateMetadata(
    script: string,
    platform: PlatformType,
    options: {
      category?: string;
      keywords?: string[];
      topic?: string;
      style?: "News" | "Viral" | "Explainer";
    } = {},
  ): PlatformMetadata {
    const limits = this.platformLimits[platform];

    // Extract key phrases from script
    const keyPhrases = this.extractKeyPhrases(script, 3);

    // Generate title based on platform
    const title = this.generateTitle(script, platform, options, limits);

    // Generate description
    const description = this.generateDescription(script, platform, options, limits);

    // Generate hashtags
    const hashtags = this.generateHashtags(
      {
        ...options,
        keyPhrases,
        title,
      },
      platform,
      limits,
    );

    return {
      title,
      description,
      hashtags,
      platform,
      keywords: options.keywords || keyPhrases,
    };
  }

  /**
   * Generate platform-optimized title
   */
  private generateTitle(
    script: string,
    platform: PlatformType,
    options: {
      category?: string;
      keywords?: string[];
      style?: string;
    },
    limits: PlatformLimits,
  ): string {
    let title = "";

    // Extract first compelling sentence
    const sentences = script.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const hook = sentences[0]?.trim() || script.substring(0, 50);

    // Platform-specific formatting
    switch (platform) {
      case "youtube":
        // YouTube: descriptive, includes keywords
        title = `${options.category || "Latest"}: ${hook}`;
        if (options.keywords && options.keywords.length > 0) {
          title += ` [${options.keywords[0]}]`;
        }
        break;

      case "instagram":
        // Instagram: short, punchy, emoji-friendly
        title = hook.substring(0, 30);
        if (limits.supportEmojis) {
          title = this.addRelevantEmoji(options.category || "") + " " + title;
        }
        break;

      case "tiktok":
        // TikTok: trendy, formatted with #
        title = `${hook.substring(0, 100)} #${(options.category || "viral").toLowerCase().replace(/\s+/g, "")}`;
        break;

      case "telegram":
        // Telegram: clear, informative
        title = `📰 ${hook.substring(0, 100)}`;
        break;

      case "facebook":
        // Facebook: descriptive with call-to-action
        title = `${hook.substring(0, 60)} - Don't miss this!`;
        break;

      default:
        title = hook.substring(0, 50);
    }

    // Truncate to platform limit
    return title.substring(0, limits.maxTitleLength);
  }

  /**
   * Generate platform-optimized description
   */
  private generateDescription(
    script: string,
    platform: PlatformType,
    options: {
      category?: string;
      topic?: string;
      style?: string;
      keywords?: string[];
    },
    limits: PlatformLimits,
  ): string {
    let description = "";
    const scriptSnippet = script.substring(0, 200);

    switch (platform) {
      case "youtube":
        description = `${scriptSnippet}...\n\n`;
        description += `Category: ${options.category}\n`;
        description += `Keywords: ${options.keywords?.join(", ") || "general"}\n`;
        description += `\nSubscribe for more content!`;
        break;

      case "instagram":
        // Instagram: conversational, action-oriented
        description = `${scriptSnippet}...\n\n`;
        description += `💭 What do you think?\n`;
        description += `👉 Comment below!\n`;
        description += `❤️ Like and share with friends`;
        break;

      case "tiktok":
        // TikTok: casual, engaging
        description = `${scriptSnippet}...\n\nFollow for more!`;
        break;

      case "telegram":
        // Telegram: informative, clean
        description = `${scriptSnippet}...\n\nCategory: ${options.category || "News"}`;
        break;

      case "facebook":
        // Facebook: story-like, engagement-focused
        description = `Check this out! ${scriptSnippet}...\n\nWhat's your take? Drop a comment! 👇`;
        break;

      default:
        description = scriptSnippet;
    }

    return description.substring(0, limits.maxDescriptionLength);
  }

  /**
   * Generate platform-optimized hashtags
   */
  private generateHashtags(
    options: {
      category?: string;
      keywords?: string[];
      keyPhrases?: string[];
      topic?: string;
      title?: string;
    },
    platform: PlatformType,
    limits: PlatformLimits,
  ): string[] {
    const hashtags: Set<string> = new Set();

    // Add category hashtag
    if (options.category) {
      hashtags.add(`#${options.category.toLowerCase().replace(/\s+/g, "")}`);
    }

    // Add keyword hashtags
    if (options.keywords && options.keywords.length > 0) {
      options.keywords.slice(0, 2).forEach((kw) => {
        if (kw.length <= limits.maxHashtagLength) {
          hashtags.add(`#${kw.toLowerCase().replace(/\s+/g, "")}`);
        }
      });
    }

    // Add key phrase hashtags (multi-word)
    if (options.keyPhrases && options.keyPhrases.length > 0) {
      options.keyPhrases.forEach((phrase) => {
        const hashtag = `#${phrase.split(/\s+/).join("")}`;
        if (hashtag.length <= limits.maxHashtagLength) {
          hashtags.add(hashtag);
        }
      });
    }

    // Add platform-specific trending hashtags
    const trendingHashtags: Record<PlatformType, string[]> = {
      youtube: ["#viral", "#trending", "#video"],
      instagram: ["#reels", "#explore", "#instagood"],
      tiktok: ["#foryou", "#viral", "#trending"],
      telegram: ["#news", "#update"],
      facebook: ["#viral", "#trending", "#share"],
    };

    trendingHashtags[platform].forEach((tag) => {
      if (hashtags.size < limits.maxHashtagCount) {
        hashtags.add(tag);
      }
    });

    return Array.from(hashtags).slice(0, limits.maxHashtagCount);
  }

  /**
   * Extract key phrases from script
   */
  private extractKeyPhrases(script: string, count: number): string[] {
    const words = script.toLowerCase().split(/\s+/);
    const phrases: Record<string, number> = {};

    // Simple: count consecutive word pairs
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (this.isValidPhrase(phrase)) {
        phrases[phrase] = (phrases[phrase] || 0) + 1;
      }
    }

    return Object.entries(phrases)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([phrase]) => phrase);
  }

  /**
   * Check if phrase is valid for hashtag
   */
  private isValidPhrase(phrase: string): boolean {
    const stopwords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "is",
      "are",
      "was",
      "were",
      "to",
      "of",
      "in",
      "on",
      "at",
      "for",
      "with",
    ]);
    const words = phrase.split(/\s+/);
    return !words.some((w) => stopwords.has(w)) && phrase.length > 5;
  }

  /**
   * Generate metadata with A/B testing variants
   */
  generateMetadataWithVariants(
    script: string,
    platform: PlatformType,
    options: {
      category?: string;
      keywords?: string[];
      topic?: string;
      style?: "News" | "Viral" | "Explainer";
      generateVariants?: boolean;
    } = {},
  ): {
    primary: PlatformMetadata;
    variants: PlatformMetadata[];
  } {
    const primary = this.generateMetadata(script, platform, options);

    // Generate 1-2 variants if requested
    const variants: PlatformMetadata[] = [];

    if (options.generateVariants && options.keywords && options.keywords.length > 0) {
      // Variant 1: Keyword-focused (better SEO)
      const keywordVariant = this.generateKeywordFocusedVariant(
        primary,
        options.keywords,
        platform,
      );
      variants.push(keywordVariant);

      // Variant 2: Emotion-focused (better engagement)
      if (platform !== "telegram") {
        // Telegram users prefer facts over emotion
        const emotionVariant = this.generateEmotionFocusedVariant(
          primary,
          options.category,
          platform,
        );
        variants.push(emotionVariant);
      }
    }

    return { primary, variants };
  }

  /**
   * Generate SEO-optimized keywords for script
   */
  generateSEOKeywords(
    script: string,
    category: string,
    limit: number = 5,
  ): {
    primary: string[];
    secondary: string[];
  } {
    const words = script.toLowerCase().split(/\s+/);
    const stopwords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "is",
      "are",
      "was",
      "were",
      "to",
      "of",
      "in",
      "on",
      "at",
      "for",
      "with",
      "from",
      "as",
      "by",
    ]);

    // Count word frequency
    const wordFreq: Record<string, number> = {};
    words.forEach((word) => {
      const clean = word.replace(/[^\w]/g, "");
      if (clean.length > 3 && !stopwords.has(clean)) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1;
      }
    });

    // Sort by frequency
    const sorted = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);

    return {
      primary: sorted.slice(0, limit),
      secondary: sorted.slice(limit, limit * 2),
    };
  }

  /**
   * Private: generate keyword-focused variant
   */
  private generateKeywordFocusedVariant(
    primary: PlatformMetadata,
    keywords: string[],
    platform: PlatformType,
  ): PlatformMetadata {
    const variant = { ...primary };

    // Prepend keywords to title for SEO
    if (keywords.length > 0) {
      variant.title = `${keywords[0]}: ${primary.title}`;
      const limits = this.platformLimits[platform];
      variant.title = variant.title.substring(0, limits.maxTitleLength);
    }

    // Add keywords to description
    variant.description =
      `Keywords: ${keywords.join(", ")}\n\n${primary.description}`;
    const limits = this.platformLimits[platform];
    variant.description = variant.description.substring(0, limits.maxDescriptionLength);

    return variant;
  }

  /**
   * Private: generate emotion/engagement-focused variant
   */
  private generateEmotionFocusedVariant(
    primary: PlatformMetadata,
    category: string | undefined,
    platform: PlatformType,
  ): PlatformMetadata {
    const variant = { ...primary };

    // Add emotional/CTA elements
    const emotionTriggers: Record<string, string[]> = {
      general: ["🔥 ", "✨ Would you believe this: "],
      news: ["⚡ Breaking: ", "📢 Just in: "],
      viral: ["🤯 Incredible: ", "😱 Watch: "],
      sports: ["⚽ Amazing: ", "🏆 Epic: "],
      tech: ["💡 New: ", "🚀 Innovation: "],
    };

    const triggers = emotionTriggers[category?.toLowerCase() || "general"] || emotionTriggers.general;
    const trigger = triggers[Math.floor(Math.random() * triggers.length)];

    variant.title = (trigger + primary.title).substring(
      0,
      this.platformLimits[platform].maxTitleLength,
    );

    // Add engagement CTA
    const ctaMap: Record<PlatformType, string> = {
      youtube: "\n\nDon't forget to like and subscribe!",
      instagram: "\n\n💬 Tag someone who'd love this!",
      tiktok: "\n\nShare this! #fyp",
      telegram: "\n\nShare with your friends!",
      facebook: "\n\n👍 React and comment below!",
    };

    variant.description = (primary.description + (ctaMap[platform] || "")).substring(
      0,
      this.platformLimits[platform].maxDescriptionLength,
    );

    return variant;
  }

  /**
   * Generate prompt for LLM to create metadata variants
   */
  generateLLMPrompt(
    script: string,
    category: string,
    keywords?: string[],
  ): {
    seoPrompt: string;
    titleVariantPrompt: string;
    descriptionPrompt: string;
  } {
    return {
      seoPrompt: `Extract 5 primary and 5 secondary SEO keywords from this script about ${category}.\nScript: ${script.substring(0, 500)}\n\nReturn as JSON: { primary: [...], secondary: [...] }`,

      titleVariantPrompt: `Generate 2 alternative titles for a ${category} video.\nOriginal title: ${script.split("\n")[0]}\nKeywords: ${keywords?.join(", ") || "general"}\n\nMake them: 1) SEO-focused with keywords, 2) Emotion-focused with emojis.`,

      descriptionPrompt: `Generate platform-specific descriptions (YouTube, Instagram, TikTok) for this ${category} content.\nTopic: ${keywords?.join(", ") || script.substring(0, 50)}\n\nReturn concise descriptions tailored for each platform.`,
    };
  }
}

