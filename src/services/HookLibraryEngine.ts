import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export type HookType = "curiosity" | "shock" | "value" | "pattern_interrupt" | "story" | "question" | "controversy" | "urgency";
export type HookEmotion = "inspiration" | "fear" | "curiosity" | "humor" | "anger" | "surprise" | "joy";

export interface Hook {
  id: string;
  text: string;
  type: HookType;
  emotion: HookEmotion;
  category: string[];
  platform: string[];
  performanceScore: number;
  usageCount: number;
  createdAt: string;
}

const BUILT_IN_HOOKS: Omit<Hook, "id" | "usageCount" | "createdAt">[] = [
  { text: "Stop scrolling — this will change how you think about {topic}", type: "pattern_interrupt", emotion: "curiosity", category: ["General"], platform: ["tiktok","instagram","youtube"], performanceScore: 88 },
  { text: "Nobody talks about this {topic} secret...", type: "curiosity", emotion: "curiosity", category: ["General"], platform: ["tiktok","instagram"], performanceScore: 85 },
  { text: "Breaking: {topic} just happened and here's what you need to know", type: "urgency", emotion: "fear", category: ["News","Politics"], platform: ["youtube","instagram","telegram"], performanceScore: 82 },
  { text: "I was wrong about {topic} — here's the truth", type: "controversy", emotion: "surprise", category: ["Education","Business"], platform: ["youtube","linkedin"], performanceScore: 79 },
  { text: "3 {topic} mistakes you're making right now", type: "value", emotion: "fear", category: ["Education","Business","Health"], platform: ["youtube","instagram"], performanceScore: 91 },
  { text: "POV: You finally understand {topic}", type: "story", emotion: "joy", category: ["Entertainment","Education"], platform: ["tiktok","instagram"], performanceScore: 86 },
  { text: "What they don't want you to know about {topic}", type: "shock", emotion: "anger", category: ["News","Politics"], platform: ["youtube","telegram"], performanceScore: 83 },
  { text: "This {topic} hack will save you hours every week", type: "value", emotion: "joy", category: ["Tech","Business"], platform: ["youtube","linkedin","instagram"], performanceScore: 89 },
  { text: "Aap log ye {topic} ke baare mein galat sochte ho", type: "controversy", emotion: "surprise", category: ["General"], platform: ["youtube","instagram"], performanceScore: 84 },
  { text: "Part 2 chahiye? {topic} ka pura sach sunlo", type: "curiosity", emotion: "curiosity", category: ["General"], platform: ["instagram","tiktok"], performanceScore: 87 },
  { text: "The uncomfortable truth about {topic} no one says out loud", type: "shock", emotion: "anger", category: ["Business","Politics"], platform: ["linkedin","youtube"], performanceScore: 80 },
  { text: "I tested {topic} for 30 days — the results shocked me", type: "story", emotion: "surprise", category: ["Health","Tech","Business"], platform: ["youtube","instagram"], performanceScore: 92 },
  { text: "Attention: {topic} is about to change forever", type: "urgency", emotion: "fear", category: ["Tech","Business","News"], platform: ["all"], performanceScore: 78 },
  { text: "Wait for it... {topic} explained in 60 seconds", type: "pattern_interrupt", emotion: "curiosity", category: ["Education"], platform: ["tiktok","instagram","youtube"], performanceScore: 85 },
  { text: "Rich people use {topic} every day. Here's how:", type: "value", emotion: "inspiration", category: ["Business","Finance"], platform: ["youtube","instagram","linkedin"], performanceScore: 90 },
  { text: "This is why {topic} is destroying your [outcome]", type: "shock", emotion: "fear", category: ["Health","Business"], platform: ["youtube","instagram"], performanceScore: 83 },
  { text: "Motivational truth about {topic} that will hit different today", type: "story", emotion: "inspiration", category: ["Motivation"], platform: ["instagram","youtube"], performanceScore: 82 },
  { text: "Scientists just discovered something shocking about {topic}", type: "shock", emotion: "surprise", category: ["Science","Health"], platform: ["youtube","telegram"], performanceScore: 84 },
  { text: "Why 99% of people fail at {topic} (and how to be the 1%)", type: "value", emotion: "inspiration", category: ["Business","Motivation"], platform: ["youtube","linkedin"], performanceScore: 91 },
  { text: "Ye video mat dekho agar {topic} ke baare mein sach nahi sunna", type: "controversy", emotion: "curiosity", category: ["General"], platform: ["youtube","instagram"], performanceScore: 86 },
];

export class HookLibraryEngine {
  private hooksPath: string;
  private hooks: Hook[] = [];

  constructor(dataDirPath: string) {
    this.hooksPath = path.join(dataDirPath, "hook-library.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.hooksPath)) {
        this.hooks = fs.readJsonSync(this.hooksPath);
      } else {
        this.hooks = BUILT_IN_HOOKS.map((h, i) => ({
          ...h,
          id: `hook_builtin_${i}`,
          usageCount: 0,
          createdAt: new Date().toISOString(),
        }));
        this.save();
      }
    } catch {
      this.hooks = [];
    }
  }

  private save() {
    try { fs.writeJsonSync(this.hooksPath, this.hooks, { spaces: 2 }); } catch { /* ignore */ }
  }

  getAll(): Hook[] { return this.hooks; }

  getByType(type: HookType): Hook[] { return this.hooks.filter((h) => h.type === type); }

  getByCategory(category: string): Hook[] {
    return this.hooks.filter((h) => h.category.includes(category) || h.category.includes("General"));
  }

  getByPlatform(platform: string): Hook[] {
    return this.hooks.filter((h) => h.platform.includes(platform) || h.platform.includes("all"));
  }

  getBest(options: { category?: string; platform?: string; emotion?: HookEmotion; limit?: number } = {}): Hook[] {
    let filtered = [...this.hooks];
    if (options.category) filtered = filtered.filter((h) => h.category.includes(options.category!) || h.category.includes("General"));
    if (options.platform) filtered = filtered.filter((h) => h.platform.includes(options.platform!) || h.platform.includes("all"));
    if (options.emotion) filtered = filtered.filter((h) => h.emotion === options.emotion);
    return filtered.sort((a, b) => b.performanceScore - a.performanceScore).slice(0, options.limit || 5);
  }

  fill(hookText: string, topic: string): string {
    return hookText.replace(/\{topic\}/g, topic);
  }

  addHook(hook: Omit<Hook, "id" | "usageCount" | "createdAt">): Hook {
    const newHook: Hook = { ...hook, id: `hook_${Date.now()}`, usageCount: 0, createdAt: new Date().toISOString() };
    this.hooks.push(newHook);
    this.save();
    return newHook;
  }

  trackUsage(hookId: string, performanceScore?: number) {
    const hook = this.hooks.find((h) => h.id === hookId);
    if (!hook) return;
    hook.usageCount++;
    if (performanceScore !== undefined) {
      hook.performanceScore = Math.round((hook.performanceScore * 0.8) + (performanceScore * 0.2));
    }
    this.save();
  }

  deleteHook(hookId: string): boolean {
    const before = this.hooks.length;
    this.hooks = this.hooks.filter((h) => h.id !== hookId);
    if (this.hooks.length !== before) { this.save(); return true; }
    return false;
  }

  generateWithTopic(topic: string, options: { category?: string; platform?: string; limit?: number } = {}): string[] {
    const best = this.getBest({ ...options, limit: options.limit || 5 });
    return best.map((h) => this.fill(h.text, topic));
  }
}
