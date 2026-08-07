export const CONTENT_CATEGORIES = [
  "World",
  "News",
  "General",
  "Sports",
  "Cricket",
  "NBA",
  "Technology",
  "Business",
  "Science",
  "Entertainment",
  "Education",
  "Health",
  "Finance",
  "Lifestyle",
  "Motivation",
  "Travel",
  "Food",
  "Religion",
  "Politics",
  "Culture",
  "Fashion",
  "Fitness",
  "Gaming",
  "Beauty",
  "Parenting",
] as const;

export type ContentCategory = (typeof CONTENT_CATEGORIES)[number];

export const SOURCE_CATEGORIES = [
  "World",
  "General",
  "Cricket",
  "NBA",
  "Technology",
  "Business",
  "Sports",
  "Science",
] as const;

const CATEGORY_ALIASES: Record<string, string> = {
  tech: "Technology",
};

export function normalizeCategory(category: string): string {
  const trimmed = category.trim();
  if (!trimmed) return "General";
  const alias = CATEGORY_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;
  const match = CONTENT_CATEGORIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  return match || trimmed;
}

export function isContentCategory(category: string): boolean {
  return CONTENT_CATEGORIES.some((c) => c.toLowerCase() === category.toLowerCase());
}
