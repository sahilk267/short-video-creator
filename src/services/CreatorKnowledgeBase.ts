import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export type RuleCategory =
  | "hook_writing" | "script_structure" | "editing" | "thumbnails"
  | "captions" | "hashtags" | "posting_strategy" | "engagement"
  | "platform_specific" | "monetization" | "growth" | "general";

export interface KnowledgeRule {
  id: string;
  category: RuleCategory;
  title: string;
  description: string;
  examples?: string[];
  doList?: string[];
  dontList?: string[];
  platforms?: string[];
  tags: string[];
  source?: string;
  rating: number;
  addedAt: string;
}

export interface SearchResult {
  rule: KnowledgeRule;
  relevance: number;
}

const BUILT_IN_RULES: KnowledgeRule[] = [
  {
    id: "rule_hook_001", category: "hook_writing", title: "3-Second Hook Formula",
    description: "Your video must capture attention within the first 3 seconds or viewers will scroll away.",
    doList: ["Start with a bold statement or shocking fact", "Use a question that creates curiosity", "Show the end result first (before/after)", "Use pattern interrupt — something unexpected"],
    dontList: ["Start with 'Hey guys, welcome back'", "Use slow music intros", "Show your face with no context first"],
    examples: ["Did you know 90% of creators fail at THIS?", "I quit my 9-5 and here's exactly what happened", "This ONE trick doubled my views overnight"],
    tags: ["hook", "attention", "3-second", "viral"], rating: 9.8, addedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "rule_script_001", category: "script_structure", title: "PAS Script Framework",
    description: "Problem-Agitate-Solution: The most proven short-form video script structure.",
    doList: ["Open with the PROBLEM your viewer faces", "AGITATE it — make them feel the pain", "Present your SOLUTION clearly and simply", "End with a CTA"],
    examples: ["Problem: Stuck at 0 views. Agitate: You're posting every day but nobody watches. Solution: Here's the 1 algorithm trick nobody tells you."],
    tags: ["script", "structure", "PAS", "framework"], rating: 9.5, addedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "rule_editing_001", category: "editing", title: "Jump Cut Every 3-5 Seconds",
    description: "Keep visual momentum by cutting every 3-5 seconds to maintain viewer attention.",
    doList: ["Use jump cuts to remove pauses and filler words", "Add B-roll or text overlays between cuts", "Match cuts to beats if using music"],
    dontList: ["Hold on the same shot for more than 5 seconds", "Use long cross-fades (they slow pace)", "Leave dead air in the audio"],
    tags: ["editing", "pacing", "jump-cut", "retention"], rating: 9.2, addedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "rule_thumbnail_001", category: "thumbnails", title: "Thumbnail Contrast & Text Rule",
    description: "High-contrast thumbnails with bold text and a clear emotional face win more clicks.",
    doList: ["Use 3 colors max — high contrast palette", "Include a face showing strong emotion", "Add bold text (max 5 words)", "Use arrows or circles to direct attention"],
    dontList: ["Use more than 3 colors", "Show no text or face", "Use small or thin fonts"],
    tags: ["thumbnail", "CTR", "design", "click-through"], rating: 9.6, addedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "rule_hashtag_001", category: "hashtags", title: "Hashtag Tier Strategy",
    description: "Use a mix of small, medium, and large hashtags for maximum discoverability.",
    doList: ["Use 2-3 niche-specific tags (100K-1M posts)", "Use 2-3 medium tags (1M-10M posts)", "Use 1-2 trending broad tags", "Always include platform-specific tags (#fyp, #reels)"],
    dontList: ["Use only huge hashtags (#viral, #trending)", "Use irrelevant hashtags for reach", "Use banned hashtags"],
    tags: ["hashtags", "SEO", "discoverability", "reach"], rating: 8.7, addedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "rule_posting_001", category: "posting_strategy", title: "Consistency Over Perfection",
    description: "Posting 5 average videos consistently beats posting 1 perfect video.",
    doList: ["Set a posting schedule and stick to it", "Batch create content for 2 weeks ahead", "Post at peak times for your audience", "Repurpose content across platforms"],
    dontList: ["Wait for the 'perfect' video", "Post without a plan", "Skip days because of low engagement"],
    tags: ["consistency", "schedule", "strategy", "growth"], rating: 9.0, addedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "rule_engagement_001", category: "engagement", title: "Comment Bait in First 10 Seconds",
    description: "Ask viewers a question in the first 10 seconds to dramatically boost comments.",
    doList: ["Ask a YES/NO question in the caption", "Create a this-or-that debate in the video", "Respond to comments within the first hour", "Pin a comment with a discussion starter"],
    tags: ["engagement", "comments", "community", "algorithm"], rating: 8.9, addedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "rule_platform_tiktok_001", category: "platform_specific", title: "TikTok Algorithm Keys",
    description: "TikTok rewards completion rate, shares, and stitches over follower count.",
    doList: ["Keep videos under 30s for best completion", "Add trending audio from the sound library", "Use CapCut effects during trends", "Respond to comments with video replies"],
    dontList: ["Post watermarked content from other platforms", "Ignore trending sounds", "Delete videos (it hurts your account)"],
    platforms: ["tiktok"], tags: ["tiktok", "algorithm", "platform"], rating: 9.3, addedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "rule_platform_instagram_001", category: "platform_specific", title: "Instagram Reels Best Practices",
    description: "Instagram rewards Reels that are saved and shared to Stories.",
    doList: ["Use vertical 9:16 format", "Add value in the caption (saves = algorithm boost)", "Use the Remix feature to engage with trending content", "Post to Stories after Reels for extra reach"],
    platforms: ["instagram"], tags: ["instagram", "reels", "algorithm"], rating: 9.1, addedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "rule_monetization_001", category: "monetization", title: "Content-to-Offer Funnel",
    description: "Every piece of content should have a clear path from viewer to customer.",
    doList: ["Include a soft CTA in every video (follow, visit link)", "Create a lead magnet (free guide, checklist)", "Use bio link to a landing page", "Build an email list from day 1"],
    tags: ["monetization", "funnel", "CTA", "business"], rating: 8.5, addedAt: "2025-01-01T00:00:00Z",
  },
];

export class CreatorKnowledgeBase {
  private dataPath: string;
  private rules: KnowledgeRule[] = [];

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "knowledge-base.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dataPath)) {
        this.rules = fs.readJsonSync(this.dataPath);
      } else {
        this.rules = [...BUILT_IN_RULES];
        this.save();
      }
    } catch { this.rules = [...BUILT_IN_RULES]; }
  }

  private save() {
    try { fs.writeJsonSync(this.dataPath, this.rules, { spaces: 2 }); } catch { /* ignore */ }
  }

  search(query: string, category?: RuleCategory): SearchResult[] {
    const lower = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const rule of this.rules) {
      if (category && rule.category !== category) continue;
      let score = 0;
      if (rule.title.toLowerCase().includes(lower)) score += 10;
      if (rule.description.toLowerCase().includes(lower)) score += 6;
      if (rule.tags.some((t) => t.includes(lower))) score += 8;
      if (rule.category.toLowerCase().includes(lower)) score += 5;
      if (rule.doList?.some((d) => d.toLowerCase().includes(lower))) score += 3;
      if (score > 0) results.push({ rule, relevance: score });
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  getByCategory(category: RuleCategory): KnowledgeRule[] {
    return this.rules.filter((r) => r.category === category);
  }

  getByPlatform(platform: string): KnowledgeRule[] {
    return this.rules.filter((r) => !r.platforms || r.platforms.includes(platform));
  }

  addRule(rule: Omit<KnowledgeRule, "id" | "addedAt">): KnowledgeRule {
    const newRule: KnowledgeRule = {
      ...rule,
      id: `rule_custom_${Date.now()}`,
      addedAt: new Date().toISOString(),
    };
    this.rules.push(newRule);
    this.save();
    logger.debug({ id: newRule.id, category: newRule.category }, "CreatorKnowledgeBase: rule added");
    return newRule;
  }

  updateRule(id: string, updates: Partial<KnowledgeRule>): KnowledgeRule | undefined {
    const rule = this.rules.find((r) => r.id === id);
    if (rule) { Object.assign(rule, updates); this.save(); }
    return rule;
  }

  deleteRule(id: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx >= 0) { this.rules.splice(idx, 1); this.save(); return true; }
    return false;
  }

  getAll(): KnowledgeRule[] { return this.rules; }
  getTopRated(limit = 10): KnowledgeRule[] { return [...this.rules].sort((a, b) => b.rating - a.rating).slice(0, limit); }
  getCategories(): RuleCategory[] { return [...new Set(this.rules.map((r) => r.category))]; }
}
