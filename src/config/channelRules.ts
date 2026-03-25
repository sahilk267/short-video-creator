import type { CategoryRule, LanguageProfile, VideoType } from "../types/shorts";

const defaultLanguageProfiles: LanguageProfile[] = [
  {
    audio: "en",
    subtitle: "en",
    voice: "bm_lewis",
    whisperModel: "base.en",
  },
];

export const defaultCategoryRules: CategoryRule[] = [
  {
    id: "world-default",
    category: "World",
    channels: ["youtube-main", "telegram-main"],
    languageProfiles: defaultLanguageProfiles,
    videoTypes: ["short", "long"] as VideoType[],
    maxDurationShortSec: 60,
    maxDurationLongSec: 600,
    active: true,
  },
  {
    id: "tech-default",
    category: "Tech",
    channels: ["youtube-tech"],
    languageProfiles: defaultLanguageProfiles,
    videoTypes: ["short"] as VideoType[],
    maxDurationShortSec: 90,
    maxDurationLongSec: 600,
    active: true,
  },
];

export function getCategoryRule(category: string): CategoryRule | undefined {
  return defaultCategoryRules.find((rule) => rule.category.toLowerCase() === category.toLowerCase());
}
