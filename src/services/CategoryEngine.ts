import { logger } from "../logger";

export type ContentCategory =
  | "Tech" | "Finance" | "Health" | "Food" | "Fitness" | "Travel"
  | "Education" | "Entertainment" | "Sports" | "Motivation" | "Business"
  | "Science" | "Gaming" | "Beauty" | "Parenting" | "News" | "General";

export interface CategoryResult {
  primary: ContentCategory;
  secondary?: ContentCategory;
  confidence: number;
  keywords: string[];
  suggestedPlatforms: string[];
  contentTone: string;
}

const CATEGORY_KEYWORDS: Record<ContentCategory, string[]> = {
  Tech: ["ai", "app", "software", "code", "programming", "tech", "gadget", "robot", "algorithm", "digital", "cyber", "data", "cloud", "blockchain", "vr", "ar"],
  Finance: ["money", "invest", "stock", "crypto", "bitcoin", "budget", "save", "income", "wealth", "finance", "tax", "loan", "trading", "portfolio", "dividend"],
  Health: ["health", "medicine", "doctor", "diet", "nutrition", "vitamin", "sleep", "mental", "therapy", "disease", "immune", "supplement", "wellbeing"],
  Food: ["food", "recipe", "cook", "eat", "restaurant", "meal", "ingredient", "bake", "chef", "kitchen", "snack", "drink", "dinner", "lunch", "breakfast"],
  Fitness: ["workout", "gym", "exercise", "muscle", "cardio", "yoga", "run", "weight", "training", "athlete", "body", "strength", "crossfit", "sport"],
  Travel: ["travel", "trip", "vacation", "country", "city", "hotel", "flight", "tour", "adventure", "destination", "backpack", "explore", "world"],
  Education: ["learn", "study", "school", "university", "course", "teach", "lesson", "knowledge", "skill", "exam", "book", "read", "tutorial"],
  Entertainment: ["movie", "music", "show", "celebrity", "actor", "singer", "dance", "comedy", "funny", "meme", "trend", "viral", "streaming"],
  Sports: ["sports", "football", "basketball", "soccer", "tennis", "cricket", "baseball", "nba", "nfl", "match", "game", "team", "player", "score"],
  Motivation: ["motivat", "inspire", "success", "goal", "mindset", "positive", "achieve", "dream", "hustle", "grind", "self", "growth", "habit", "discipline"],
  Business: ["business", "startup", "entrepreneur", "company", "brand", "market", "customer", "product", "service", "revenue", "profit", "sales", "manager"],
  Science: ["science", "research", "experiment", "physics", "chemistry", "biology", "space", "nasa", "climate", "nature", "discovery", "study", "lab"],
  Gaming: ["game", "gaming", "player", "stream", "twitch", "console", "pc", "fps", "rpg", "minecraft", "fortnite", "esport", "strategy", "controller"],
  Beauty: ["beauty", "makeup", "skincare", "hair", "fashion", "style", "outfit", "cosmetic", "glow", "foundation", "lipstick", "nails", "trend"],
  Parenting: ["parent", "child", "baby", "mom", "dad", "kid", "family", "toddler", "pregnancy", "school", "raise", "teach", "homework"],
  News: ["breaking", "news", "update", "report", "latest", "today", "happening", "world", "politics", "economy", "event", "announce"],
  General: [],
};

const PLATFORM_AFFINITY: Record<ContentCategory, string[]> = {
  Tech: ["youtube", "linkedin", "tiktok"],
  Finance: ["instagram", "youtube", "x", "linkedin"],
  Health: ["instagram", "youtube", "tiktok"],
  Food: ["tiktok", "instagram", "youtube"],
  Fitness: ["instagram", "tiktok", "youtube"],
  Travel: ["instagram", "youtube", "tiktok"],
  Education: ["youtube", "linkedin", "tiktok"],
  Entertainment: ["tiktok", "instagram", "youtube"],
  Sports: ["x", "youtube", "instagram"],
  Motivation: ["tiktok", "instagram", "youtube"],
  Business: ["linkedin", "youtube", "x"],
  Science: ["youtube", "instagram", "linkedin"],
  Gaming: ["youtube", "tiktok", "x"],
  Beauty: ["instagram", "tiktok", "youtube"],
  Parenting: ["instagram", "tiktok", "facebook"],
  News: ["x", "telegram", "youtube"],
  General: ["youtube", "instagram", "tiktok"],
};

const TONE_MAP: Record<ContentCategory, string> = {
  Tech: "informative-authoritative", Finance: "educational-serious", Health: "trustworthy-caring",
  Food: "fun-inspiring", Fitness: "energetic-motivating", Travel: "dreamy-adventurous",
  Education: "clear-structured", Entertainment: "fun-engaging", Sports: "passionate-competitive",
  Motivation: "inspirational-emotional", Business: "professional-strategic", Science: "curious-educational",
  Gaming: "exciting-casual", Beauty: "trendy-aesthetic", Parenting: "warm-relatable",
  News: "urgent-factual", General: "neutral-engaging",
};

export class CategoryEngine {
  classify(text: string): CategoryResult {
    try {
      const lower = text.toLowerCase();
      const scores: Record<ContentCategory, number> = {} as Record<ContentCategory, number>;

      for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [ContentCategory, string[]][]) {
        let score = 0;
        const matched: string[] = [];
        for (const kw of keywords) {
          if (lower.includes(kw)) { score++; matched.push(kw); }
        }
        scores[cat] = score;
      }

      scores.General = 0;
      const sorted = Object.entries(scores)
        .filter(([cat]) => cat !== "General")
        .sort(([, a], [, b]) => b - a) as [ContentCategory, number][];

      const primary: ContentCategory = sorted[0]?.[0] ?? "General";
      const primaryScore = sorted[0]?.[1] ?? 0;
      const secondary: ContentCategory | undefined = sorted[1]?.[1] > 0 ? sorted[1]?.[0] : undefined;

      const totalPossible = CATEGORY_KEYWORDS[primary]?.length || 1;
      const confidence = Math.min(100, Math.round((primaryScore / Math.max(1, totalPossible)) * 100 * 5));

      const keywords = (CATEGORY_KEYWORDS[primary] || []).filter((kw) => lower.includes(kw)).slice(0, 8);

      logger.debug({ primary, confidence, secondary }, "CategoryEngine classified");
      return {
        primary,
        secondary,
        confidence: Math.max(10, confidence),
        keywords,
        suggestedPlatforms: PLATFORM_AFFINITY[primary] || ["youtube", "instagram"],
        contentTone: TONE_MAP[primary] || "neutral-engaging",
      };
    } catch (err) {
      logger.error({ err }, "CategoryEngine.classify error");
      return { primary: "General", confidence: 10, keywords: [], suggestedPlatforms: ["youtube", "instagram"], contentTone: "neutral-engaging" };
    }
  }

  getAllCategories(): ContentCategory[] {
    return Object.keys(CATEGORY_KEYWORDS) as ContentCategory[];
  }

  getPlatformAffinity(category: ContentCategory): string[] {
    return PLATFORM_AFFINITY[category] || ["youtube", "instagram", "tiktok"];
  }

  getTone(category: ContentCategory): string {
    return TONE_MAP[category] || "neutral-engaging";
  }
}
