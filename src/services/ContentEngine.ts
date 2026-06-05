/* eslint-disable @remotion/deterministic-randomness */

import { logger } from "../logger";
import { LlmGenerator } from "./LlmGenerator";
import { RuleBasedGenerator } from "./RuleBasedGenerator";
import { CategoryEngine } from "./CategoryEngine";

export interface ScriptOutput {
  hook: string;
  body: string;
  cta: string;
  fullScript: string;
  wordCount: number;
  estimatedDurationSec: number;
  platform: string;
  category: string;
  generatedBy: "llm" | "rule-based";
}

export interface ContentRequest {
  topic: string;
  platform?: string;
  category?: string;
  durationSec?: number;
  tone?: string;
  language?: string;
}

const WORDS_PER_SECOND = 2.5;

const PLATFORM_CTTAS: Record<string, string[]> = {
  tiktok: ["Follow for more!", "Like if you agree!", "Comment your thoughts below!", "Share with a friend who needs this!"],
  instagram: ["Save this for later!", "Tag someone who needs to see this!", "Follow for daily tips!", "Drop a ❤️ if this helped!"],
  youtube: ["Like and subscribe for more!", "Comment your questions below!", "Watch my next video!", "Hit the bell for notifications!"],
  linkedin: ["Connect with me for more insights!", "Share if you found this valuable!", "Comment your experience below!", "Follow for weekly tips!"],
  x: ["Retweet if you agree!", "Follow for more hot takes!", "Reply with your thoughts!", "Share this thread!"],
  general: ["Follow for more!", "Share with someone who needs this!", "Comment below!", "Like if this was helpful!"],
};

function buildPrompt(req: ContentRequest): string {
  return `Write a ${req.platform || "social media"} short video script about "${req.topic}" for the ${req.category || "General"} niche. Duration: ${req.durationSec || 30}s. Tone: ${req.tone || "engaging"}. Include a hook, body, and call to action.`;
}

function buildRuleBasedScript(req: ContentRequest): ScriptOutput {
  const hook = RuleBasedGenerator.generate("hook", req.topic);
  const body = RuleBasedGenerator.generate("script", req.topic);
  const platform = (req.platform || "general").toLowerCase();
  const ctaList = PLATFORM_CTTAS[platform] || PLATFORM_CTTAS.general;
  const cta = ctaList[Math.floor(Math.random() * ctaList.length)];
  const fullScript = `${hook}\n\n${body}\n\n${cta}`;
  const wordCount = fullScript.split(/\s+/).length;
  const estimatedDurationSec = Math.round(wordCount / WORDS_PER_SECOND);
  return {
    hook, body, cta, fullScript, wordCount, estimatedDurationSec,
    platform: req.platform || "general",
    category: req.category || "General",
    generatedBy: "rule-based",
  };
}

export class ContentEngine {
  private categoryEngine = new CategoryEngine();

  async generateScript(req: ContentRequest): Promise<ScriptOutput> {
    try {
      if (!req.category) {
        const classified = this.categoryEngine.classify(req.topic);
        req.category = classified.primary;
      }

      if (LlmGenerator.isAvailable()) {
        try {
          const prompt = buildPrompt(req);
          const raw = await LlmGenerator.generate(prompt);
          const lines = raw.split("\n").filter((l) => l.trim());
          const hook = lines[0] || raw.substring(0, 100);
          const body = lines.slice(1, -1).join("\n") || raw;
          const cta = lines[lines.length - 1] || "Follow for more!";
          const fullScript = raw;
          const wordCount = fullScript.split(/\s+/).length;
          const estimatedDurationSec = Math.round(wordCount / WORDS_PER_SECOND);
          logger.debug({ topic: req.topic, platform: req.platform }, "ContentEngine: LLM script generated");
          return {
            hook, body, cta, fullScript, wordCount, estimatedDurationSec,
            platform: req.platform || "general",
            category: req.category || "General",
            generatedBy: "llm",
          };
        } catch (llmErr) {
          logger.warn({ llmErr }, "ContentEngine: LLM failed, falling back to rule-based");
        }
      }

      const result = buildRuleBasedScript(req);
      logger.debug({ topic: req.topic }, "ContentEngine: rule-based script generated");
      return result;
    } catch (err) {
      logger.error({ err, topic: req.topic }, "ContentEngine.generateScript error");
      return buildRuleBasedScript(req);
    }
  }

  async generateHook(topic: string, platform?: string): Promise<string> {
    try {
      if (LlmGenerator.isAvailable()) {
        try {
          const prompt = `Write a single viral hook (1-2 sentences) for a ${platform || "social media"} video about: "${topic}". Make it attention-grabbing.`;
          return await LlmGenerator.generate(prompt);
        } catch { /* fall through */ }
      }
      return RuleBasedGenerator.generate("hook", topic);
    } catch (err) {
      logger.error({ err }, "ContentEngine.generateHook error");
      return RuleBasedGenerator.generate("hook", topic);
    }
  }

  async generateCaption(topic: string, platform?: string): Promise<string> {
    try {
      if (LlmGenerator.isAvailable()) {
        try {
          const prompt = `Write a ${platform || "social media"} post caption for a video about: "${topic}". Include relevant hashtags.`;
          return await LlmGenerator.generate(prompt);
        } catch { /* fall through */ }
      }
      return RuleBasedGenerator.generate("caption", topic);
    } catch (err) {
      logger.error({ err }, "ContentEngine.generateCaption error");
      return RuleBasedGenerator.generate("caption", topic);
    }
  }
}
