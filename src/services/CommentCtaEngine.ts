import { logger } from "../logger";

export type CtaPlatform = "instagram" | "tiktok" | "youtube" | "telegram" | "linkedin" | "facebook" | "x";
export type CtaPlacement = "caption_end" | "video_end" | "pinned_comment" | "description";

export interface CtaOption {
  text: string;
  platform: CtaPlatform[];
  placement: CtaPlacement[];
  engagementType: "comment" | "share" | "like" | "follow" | "save";
  language: "en" | "hi" | "mixed";
  score: number;
}

const CTA_LIBRARY: CtaOption[] = [
  { text: "Agree? Drop a 👇 below!", platform: ["instagram","tiktok","youtube"], placement: ["caption_end","video_end"], engagementType: "comment", language: "en", score: 90 },
  { text: "Comment 'YES' if this helped you 🔥", platform: ["instagram","tiktok","youtube","facebook"], placement: ["caption_end","pinned_comment"], engagementType: "comment", language: "en", score: 92 },
  { text: "Share this with someone who needs to see it 👆", platform: ["instagram","facebook","telegram","x"], placement: ["caption_end"], engagementType: "share", language: "en", score: 88 },
  { text: "Save this for later — you'll thank yourself 📌", platform: ["instagram","tiktok"], placement: ["caption_end"], engagementType: "save", language: "en", score: 85 },
  { text: "What do you think? Tell me in the comments 💬", platform: ["youtube","linkedin","facebook"], placement: ["video_end","description"], engagementType: "comment", language: "en", score: 82 },
  { text: "Follow for daily {category} updates 🔔", platform: ["instagram","tiktok","youtube"], placement: ["video_end","caption_end"], engagementType: "follow", language: "en", score: 86 },
  { text: "Part 2 chahiye? Comment karo! 🙌", platform: ["instagram","youtube","tiktok"], placement: ["caption_end","video_end"], engagementType: "comment", language: "hi", score: 91 },
  { text: "Aap kya sochte ho? Neeche batao 👇", platform: ["instagram","youtube","facebook"], placement: ["caption_end","pinned_comment"], engagementType: "comment", language: "hi", score: 89 },
  { text: "Share karo apne dosto ke saath agar ye helpful laga ✅", platform: ["instagram","facebook","telegram","x"], placement: ["caption_end"], engagementType: "share", language: "hi", score: 87 },
  { text: "Like if you agree 👍 Comment if you disagree 👎", platform: ["youtube","instagram","facebook"], placement: ["video_end","description"], engagementType: "comment", language: "en", score: 88 },
  { text: "Tag a friend who needs this 👇", platform: ["instagram","facebook","tiktok"], placement: ["caption_end"], engagementType: "comment", language: "en", score: 84 },
  { text: "What's your take? Professional thoughts below 👇", platform: ["linkedin"], placement: ["caption_end","description"], engagementType: "comment", language: "en", score: 86 },
  { text: "Subscribe for more {category} content 🔔", platform: ["youtube"], placement: ["video_end","description"], engagementType: "follow", language: "en", score: 83 },
  { text: "React with ❤️ if this resonated with you", platform: ["telegram","facebook"], placement: ["caption_end"], engagementType: "like", language: "en", score: 80 },
  { text: "Apna opinion share karo — main har comment padhta hoon 👀", platform: ["youtube","instagram"], placement: ["pinned_comment","caption_end"], engagementType: "comment", language: "hi", score: 90 },
  { text: "Drop your answer in the comments — best reply gets pinned! 📌", platform: ["youtube","instagram","tiktok"], placement: ["pinned_comment"], engagementType: "comment", language: "en", score: 93 },
  { text: "Repost if you found this valuable 🔄", platform: ["linkedin","x"], placement: ["caption_end"], engagementType: "share", language: "en", score: 82 },
];

export class CommentCtaEngine {
  getBest(options: { platform?: CtaPlatform; placement?: CtaPlacement; language?: "en" | "hi" | "mixed"; category?: string; limit?: number }): CtaOption[] {
    let filtered = [...CTA_LIBRARY];
    if (options.platform) filtered = filtered.filter((c) => c.platform.includes(options.platform!));
    if (options.placement) filtered = filtered.filter((c) => c.placement.includes(options.placement!));
    if (options.language) filtered = filtered.filter((c) => c.language === options.language || c.language === "mixed");
    return filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit || 3)
      .map((c) => ({
        ...c,
        text: options.category ? c.text.replace(/\{category\}/g, options.category!) : c.text,
      }));
  }

  generate(platform: CtaPlatform, category: string, language: "en" | "hi" = "en"): string[] {
    const ctas = this.getBest({ platform, language, limit: 3, category });
    return ctas.map((c) => c.text);
  }

  getForCaption(platform: CtaPlatform, category: string): string {
    const ctas = this.getBest({ platform, placement: "caption_end", limit: 1, category });
    return ctas[0]?.text || "What do you think? Comment below! 👇";
  }

  getForVideo(platform: CtaPlatform, category: string): string {
    const ctas = this.getBest({ platform, placement: "video_end", limit: 1, category });
    return ctas[0]?.text || "Like and subscribe for more!";
  }

  getForPinnedComment(platform: CtaPlatform, category: string): string {
    const ctas = this.getBest({ platform, placement: "pinned_comment", limit: 1, category });
    return ctas[0]?.text || "Drop your thoughts below! 👇";
  }

  getAll(): CtaOption[] { return CTA_LIBRARY; }
}
