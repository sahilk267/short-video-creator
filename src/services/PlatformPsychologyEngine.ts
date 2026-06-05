export type Platform = "instagram" | "tiktok" | "youtube" | "youtube_shorts" | "telegram" | "linkedin" | "facebook" | "x";

export interface PlatformProfile {
  platform: Platform;
  aesthetic: boolean;
  emotional: boolean;
  funny: boolean;
  raw: boolean;
  informative: boolean;
  professional: boolean;
  optimalDurationSec: { min: number; max: number };
  optimalAspectRatio: "9:16" | "16:9" | "1:1" | "4:5";
  captionMaxChars: number;
  hashtagCount: { min: number; max: number };
  bestHookDurationSec: number;
  musicImportance: "critical" | "high" | "medium" | "low";
  subtitleImportance: "critical" | "high" | "medium" | "low";
  emotionTone: string[];
  contentStyle: string[];
  avoidList: string[];
  postingFrequency: string;
  viralFormats: string[];
}

const PROFILES: Record<Platform, PlatformProfile> = {
  instagram: {
    platform: "instagram", aesthetic: true, emotional: true, funny: true, raw: false,
    informative: true, professional: false,
    optimalDurationSec: { min: 15, max: 90 }, optimalAspectRatio: "9:16",
    captionMaxChars: 2200, hashtagCount: { min: 5, max: 30 }, bestHookDurationSec: 3,
    musicImportance: "critical", subtitleImportance: "high",
    emotionTone: ["inspiration", "curiosity", "humor", "aesthetics"],
    contentStyle: ["cinematic", "trendy", "colorful", "story-driven"],
    avoidList: ["dry", "text-heavy", "slow-paced"],
    postingFrequency: "1-3x per day",
    viralFormats: ["before_after", "tutorial", "reaction", "trend_audio", "carousel"],
  },
  tiktok: {
    platform: "tiktok", aesthetic: false, emotional: true, funny: true, raw: true,
    informative: true, professional: false,
    optimalDurationSec: { min: 15, max: 60 }, optimalAspectRatio: "9:16",
    captionMaxChars: 2200, hashtagCount: { min: 3, max: 8 }, bestHookDurationSec: 2,
    musicImportance: "critical", subtitleImportance: "critical",
    emotionTone: ["humor", "surprise", "curiosity", "relatability"],
    contentStyle: ["raw", "authentic", "fast-paced", "trend-following"],
    avoidList: ["polished", "corporate", "slow-open"],
    postingFrequency: "1-4x per day",
    viralFormats: ["duet", "stitch", "trend_audio", "pov", "educational"],
  },
  youtube: {
    platform: "youtube", aesthetic: true, emotional: true, funny: false, raw: false,
    informative: true, professional: true,
    optimalDurationSec: { min: 480, max: 1200 }, optimalAspectRatio: "16:9",
    captionMaxChars: 5000, hashtagCount: { min: 3, max: 10 }, bestHookDurationSec: 5,
    musicImportance: "medium", subtitleImportance: "high",
    emotionTone: ["education", "inspiration", "curiosity", "entertainment"],
    contentStyle: ["structured", "informative", "storytelling", "well-edited"],
    avoidList: ["low-quality", "thin-content", "clickbait-without-delivery"],
    postingFrequency: "2-5x per week",
    viralFormats: ["tutorial", "list", "case_study", "reaction", "documentary"],
  },
  youtube_shorts: {
    platform: "youtube_shorts", aesthetic: true, emotional: true, funny: true, raw: false,
    informative: true, professional: false,
    optimalDurationSec: { min: 15, max: 60 }, optimalAspectRatio: "9:16",
    captionMaxChars: 1000, hashtagCount: { min: 3, max: 10 }, bestHookDurationSec: 3,
    musicImportance: "high", subtitleImportance: "high",
    emotionTone: ["curiosity", "surprise", "education", "humor"],
    contentStyle: ["fast-paced", "informative", "punchy"],
    avoidList: ["slow-open", "long-intro"],
    postingFrequency: "1-3x per day",
    viralFormats: ["quick_tip", "fact", "reaction", "tutorial_snippet"],
  },
  telegram: {
    platform: "telegram", aesthetic: false, emotional: false, funny: false, raw: true,
    informative: true, professional: false,
    optimalDurationSec: { min: 30, max: 300 }, optimalAspectRatio: "16:9",
    captionMaxChars: 1024, hashtagCount: { min: 0, max: 5 }, bestHookDurationSec: 5,
    musicImportance: "low", subtitleImportance: "medium",
    emotionTone: ["informative", "urgent", "news"],
    contentStyle: ["news-style", "factual", "concise"],
    avoidList: ["entertainment-only", "music-heavy"],
    postingFrequency: "5-10x per day",
    viralFormats: ["news_clip", "analysis", "update"],
  },
  linkedin: {
    platform: "linkedin", aesthetic: true, emotional: true, funny: false, raw: false,
    informative: true, professional: true,
    optimalDurationSec: { min: 60, max: 300 }, optimalAspectRatio: "16:9",
    captionMaxChars: 3000, hashtagCount: { min: 3, max: 10 }, bestHookDurationSec: 5,
    musicImportance: "low", subtitleImportance: "critical",
    emotionTone: ["professional", "inspiration", "education", "thought-leadership"],
    contentStyle: ["professional", "data-driven", "storytelling", "case-study"],
    avoidList: ["informal", "humor", "crude"],
    postingFrequency: "1x per day (weekdays)",
    viralFormats: ["career_story", "industry_insight", "how_to", "opinion"],
  },
  facebook: {
    platform: "facebook", aesthetic: true, emotional: true, funny: true, raw: false,
    informative: true, professional: false,
    optimalDurationSec: { min: 60, max: 240 }, optimalAspectRatio: "16:9",
    captionMaxChars: 63206, hashtagCount: { min: 1, max: 10 }, bestHookDurationSec: 3,
    musicImportance: "medium", subtitleImportance: "critical",
    emotionTone: ["family", "community", "humor", "nostalgia"],
    contentStyle: ["relatable", "shareable", "story-driven"],
    avoidList: ["niche-jargon", "overly-technical"],
    postingFrequency: "1-2x per day",
    viralFormats: ["story", "challenge", "community", "news"],
  },
  x: {
    platform: "x", aesthetic: false, emotional: true, funny: true, raw: true,
    informative: true, professional: false,
    optimalDurationSec: { min: 15, max: 140 }, optimalAspectRatio: "16:9",
    captionMaxChars: 280, hashtagCount: { min: 1, max: 3 }, bestHookDurationSec: 2,
    musicImportance: "low", subtitleImportance: "high",
    emotionTone: ["controversy", "humor", "news", "opinion"],
    contentStyle: ["punchy", "viral", "opinion-driven", "news-breaking"],
    avoidList: ["long-form", "corporate-speak"],
    postingFrequency: "3-10x per day",
    viralFormats: ["hot_take", "thread_teaser", "breaking_news", "meme"],
  },
};

export class PlatformPsychologyEngine {
  getProfile(platform: Platform): PlatformProfile {
    return PROFILES[platform];
  }

  getAllProfiles(): PlatformProfile[] {
    return Object.values(PROFILES);
  }

  getOptimalPlatformsForContent(options: {
    category?: string; duration?: number; isVertical?: boolean; hasMusic?: boolean;
  }): Platform[] {
    const results: { platform: Platform; score: number }[] = [];
    for (const [platform, profile] of Object.entries(PROFILES) as [Platform, PlatformProfile][]) {
      let score = 50;
      if (options.isVertical && profile.optimalAspectRatio === "9:16") score += 20;
      if (!options.isVertical && profile.optimalAspectRatio === "16:9") score += 15;
      if (options.duration) {
        const { min, max } = profile.optimalDurationSec;
        if (options.duration >= min && options.duration <= max) score += 25;
        else if (options.duration < min) score -= 10;
        else score -= 15;
      }
      if (options.hasMusic && profile.musicImportance === "critical") score += 10;
      if (options.category) {
        if (options.category === "News" && ["telegram", "youtube", "x"].includes(platform)) score += 15;
        if (options.category === "Business" && ["linkedin", "youtube"].includes(platform)) score += 15;
        if (options.category === "Entertainment" && ["tiktok", "instagram"].includes(platform)) score += 15;
      }
      results.push({ platform, score });
    }
    return results.sort((a, b) => b.score - a.score).map((r) => r.platform);
  }

  adaptScriptForPlatform(script: string, platform: Platform): string {
    if (platform === "linkedin") {
      return script.replace(/\b(bro|guys|lol|omg)\b/gi, "").trim();
    }
    if (platform === "tiktok" || platform === "instagram") {
      if (script.length > 300) return script.substring(0, 300) + "...";
    }
    if (platform === "x") {
      if (script.length > 240) return script.substring(0, 237) + "...";
    }
    return script;
  }
}
