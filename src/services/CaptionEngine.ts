import { logger } from "../logger";
import { LlmGenerator } from "./LlmGenerator";
import { RuleBasedGenerator } from "./RuleBasedGenerator";

export interface CaptionOptions {
  topic: string;
  platform: string;
  category?: string;
  mood?: "hype" | "educational" | "emotional" | "humorous" | "professional";
  includeHashtags?: boolean;
  includeEmoji?: boolean;
  maxLength?: number;
  language?: string;
}

export interface CaptionResult {
  caption: string;
  hashtags: string[];
  emojis: string[];
  charCount: number;
  platform: string;
  generatedBy: "llm" | "rule-based";
}

const PLATFORM_LIMITS: Record<string, number> = {
  tiktok: 2200, instagram: 2200, youtube: 5000,
  linkedin: 3000, x: 280, facebook: 63206, telegram: 1024, general: 2200,
};

const MOOD_EMOJIS: Record<string, string[]> = {
  hype: ["🔥", "💥", "⚡", "🚀", "😱", "👀", "💯"],
  educational: ["📚", "🎓", "💡", "🧠", "✅", "📝", "🔑"],
  emotional: ["❤️", "😢", "🙏", "💙", "🫶", "✨", "🌟"],
  humorous: ["😂", "💀", "🤣", "😭", "👀", "🙃", "💀"],
  professional: ["💼", "📊", "🎯", "✅", "💡", "🔑", "📈"],
};

const HASHTAG_SETS: Record<string, string[]> = {
  Tech: ["#tech", "#ai", "#innovation", "#digital", "#future", "#coding", "#technology"],
  Finance: ["#money", "#investing", "#finance", "#wealth", "#crypto", "#stocks", "#budget"],
  Health: ["#health", "#wellness", "#fitness", "#mindset", "#nutrition", "#selfcare", "#healthy"],
  Food: ["#food", "#recipe", "#cooking", "#foodie", "#delicious", "#homecooking", "#yummy"],
  Fitness: ["#fitness", "#gym", "#workout", "#motivation", "#gains", "#training", "#bodybuilding"],
  General: ["#viral", "#trending", "#fyp", "#foryou", "#content", "#creator", "#shorts"],
  Entertainment: ["#entertainment", "#funny", "#viral", "#trending", "#comedy", "#memes"],
  Motivation: ["#motivation", "#success", "#mindset", "#hustle", "#goals", "#inspiration", "#growth"],
};

const PLATFORM_SPECIFIC_TAGS: Record<string, string[]> = {
  tiktok: ["#fyp", "#foryou", "#foryoupage", "#viral", "#trending"],
  instagram: ["#reels", "#instareels", "#explore", "#viral", "#trending"],
  youtube: ["#shorts", "#youtubeshorts", "#viral"],
  linkedin: ["#linkedin", "#professional", "#career"],
  x: [],
  telegram: [],
  facebook: ["#facebook", "#reels"],
};

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export class CaptionEngine {
  async generate(opts: CaptionOptions): Promise<CaptionResult> {
    try {
      const maxLength = opts.maxLength || PLATFORM_LIMITS[opts.platform] || 2200;

      if (LlmGenerator.isAvailable()) {
        try {
          const prompt = `Write a ${opts.platform} caption for a video about "${opts.topic}" in ${opts.category || "General"} niche. Mood: ${opts.mood || "educational"}. ${opts.includeHashtags ? "Include relevant hashtags." : "No hashtags."} ${opts.includeEmoji !== false ? "Include emojis." : ""} Max ${maxLength} characters.`;
          const raw = await LlmGenerator.generate(prompt);
          const hashtags = (raw.match(/#\w+/g) || []);
          const emojis = (raw.match(/[\u{1F300}-\u{1FFFF}]/gu) || []);
          const result: CaptionResult = { caption: raw, hashtags, emojis, charCount: raw.length, platform: opts.platform, generatedBy: "llm" };
          logger.debug({ platform: opts.platform }, "CaptionEngine: LLM caption generated");
          return result;
        } catch { /* fall through */ }
      }

      return this.generateRuleBased(opts, maxLength);
    } catch (err) {
      logger.error({ err }, "CaptionEngine.generate error");
      return this.generateRuleBased(opts, opts.maxLength || 2200);
    }
  }

  private generateRuleBased(opts: CaptionOptions, maxLength: number): CaptionResult {
    const baseCaption = RuleBasedGenerator.generate("caption", opts.topic);
    const mood = opts.mood || "educational";
    const emojis = pickRandom(MOOD_EMOJIS[mood] || MOOD_EMOJIS.educational, 3);
    const categoryTags = pickRandom(HASHTAG_SETS[opts.category || "General"] || HASHTAG_SETS.General, 5);
    const platformTags = pickRandom(PLATFORM_SPECIFIC_TAGS[opts.platform] || [], 3);
    const hashtags = [...new Set([...categoryTags, ...platformTags])];

    let caption = opts.includeEmoji !== false
      ? `${emojis[0]} ${baseCaption} ${emojis[1]}`
      : baseCaption;

    if (opts.includeHashtags !== false) {
      caption = `${caption}\n\n${hashtags.join(" ")}`;
    }

    if (caption.length > maxLength) {
      caption = caption.substring(0, maxLength - 3) + "...";
    }

    logger.debug({ platform: opts.platform }, "CaptionEngine: rule-based caption generated");
    return { caption, hashtags, emojis, charCount: caption.length, platform: opts.platform, generatedBy: "rule-based" };
  }

  getPlatformLimit(platform: string): number {
    return PLATFORM_LIMITS[platform] || 2200;
  }
}
