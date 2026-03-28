import axios from "axios";
import type { SceneInput } from "../types/shorts";

export type AutoScriptStyle = "News" | "Viral" | "Explainer";
export interface HookOption {
  text: string;
  score: number;
  scoreLabel: "Strong" | "Good" | "Experimental";
  rationale: string;
}

export interface ScriptGenerationOptions {
  category?: string;
  topic?: string;
  style?: AutoScriptStyle;
  hook?: string;
  keywords?: string[];
}

type PromptStory = {
  title: string;
  content?: string;
  pubDate?: string;
  sourceWeight?: number;
  sourceName?: string;
};

export class AiLlmGenerator {
  private apiUrl: string;
  private model: string;

  constructor(
    apiUrl: string = "http://localhost:12434",
    model: string = "docker.io/ai/llama3.2:latest",
  ) {
    this.apiUrl = apiUrl;
    this.model = model;
  }

  private normalizeKeywordList(keywords?: string[]): string[] {
    return Array.from(new Set(
      (keywords || [])
        .map((keyword) => String(keyword).trim())
        .filter(Boolean),
    )).slice(0, 8);
  }

  private getRelevantPriorityKeywords(
    optionsKeywords: string[],
    sceneContext: Array<string | undefined>,
  ): string[] {
    const haystack = sceneContext
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matched = optionsKeywords.filter((keyword) => {
      const tokens = keyword.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
      return tokens.some((token) => haystack.includes(token));
    });

    if (matched.length > 0) {
      return this.mergePriorityTerms(matched, optionsKeywords, 4);
    }

    return optionsKeywords.slice(0, 3);
  }

  private mergePriorityTerms(primary: string[], secondary: string[], max: number): string[] {
    return Array.from(new Set(
      [...primary, ...secondary]
        .map((item) => String(item).trim())
        .filter(Boolean),
    )).slice(0, max);
  }

  private normalizePromptText(value?: string): string {
    return String(value || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private storyFingerprint(story: PromptStory): string {
    return this.normalizePromptText(story.title)
      .split(/\s+/)
      .filter((token) => token.length > 2)
      .slice(0, 8)
      .join(" ");
  }

  private keywordRelevanceScore(story: PromptStory, keywords: string[]): number {
    if (!keywords.length) {
      return 0;
    }
    const haystack = this.normalizePromptText(`${story.title} ${story.content || ""}`);
    return keywords.reduce((score, keyword) => {
      const keywordTokens = this.normalizePromptText(keyword).split(/\s+/).filter((token) => token.length > 2);
      const matchedTokens = keywordTokens.filter((token) => haystack.includes(token)).length;
      return score + (matchedTokens * 20);
    }, 0);
  }

  private freshnessScore(pubDate?: string): number {
    const timestamp = Date.parse(pubDate || "");
    if (!timestamp) {
      return 5;
    }
    const hoursOld = Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60));
    if (hoursOld <= 6) return 50;
    if (hoursOld <= 24) return 35;
    if (hoursOld <= 48) return 20;
    return 8;
  }

  private rankStoriesForPrompt(
    newsStories: PromptStory[],
    options: Pick<ScriptGenerationOptions, "category" | "topic" | "keywords"> = {},
  ): PromptStory[] {
    const normalizedKeywords = this.normalizeKeywordList(options.keywords);
    const fingerprintCoverage = new Map<string, number>();
    for (const story of newsStories) {
      const fingerprint = this.storyFingerprint(story);
      if (!fingerprint) {
        continue;
      }
      fingerprintCoverage.set(fingerprint, (fingerprintCoverage.get(fingerprint) || 0) + 1);
    }

    const categoryNeedle = this.normalizePromptText(options.category);
    const topicNeedle = this.normalizePromptText(options.topic);

    return [...newsStories]
      .sort((a, b) => {
        const aFingerprint = this.storyFingerprint(a);
        const bFingerprint = this.storyFingerprint(b);
        const aCoverage = fingerprintCoverage.get(aFingerprint) || 1;
        const bCoverage = fingerprintCoverage.get(bFingerprint) || 1;
        const aText = this.normalizePromptText(`${a.title} ${a.content || ""}`);
        const bText = this.normalizePromptText(`${b.title} ${b.content || ""}`);
        const aCategoryBoost = categoryNeedle && aText.includes(categoryNeedle) ? 15 : 0;
        const bCategoryBoost = categoryNeedle && bText.includes(categoryNeedle) ? 15 : 0;
        const aTopicBoost = topicNeedle && aText.includes(topicNeedle) ? 25 : 0;
        const bTopicBoost = topicNeedle && bText.includes(topicNeedle) ? 25 : 0;
        const aScore =
          this.keywordRelevanceScore(a, normalizedKeywords) +
          this.freshnessScore(a.pubDate) +
          ((a.sourceWeight || 5) * 8) +
          (aCoverage * 18) +
          aCategoryBoost +
          aTopicBoost;
        const bScore =
          this.keywordRelevanceScore(b, normalizedKeywords) +
          this.freshnessScore(b.pubDate) +
          ((b.sourceWeight || 5) * 8) +
          (bCoverage * 18) +
          bCategoryBoost +
          bTopicBoost;
        return bScore - aScore;
      })
      .slice(0, 8);
  }

  private scoreHookOption(
    hookText: string,
    options: Pick<ScriptGenerationOptions, "topic" | "style" | "keywords"> = {},
  ): HookOption {
    const normalizedHook = this.normalizePromptText(hookText);
    const topicText = this.normalizePromptText(options.topic);
    const priorityKeywords = this.normalizeKeywordList(options.keywords);
    const hookWords = normalizedHook.split(/\s+/).filter(Boolean);
    const wordCount = hookWords.length;

    let score = 40;
    const rationale: string[] = [];

    if (wordCount >= 8 && wordCount <= 16) {
      score += 18;
      rationale.push("Good spoken length");
    } else if (wordCount >= 6 && wordCount <= 18) {
      score += 10;
      rationale.push("Usable spoken length");
    } else {
      rationale.push("Length may feel less punchy");
    }

    const topicTokens = topicText.split(/\s+/).filter((token) => token.length > 2);
    const matchedTopicTokens = topicTokens.filter((token) => normalizedHook.includes(token));
    if (matchedTopicTokens.length > 0) {
      score += Math.min(20, matchedTopicTokens.length * 8);
      rationale.push("Aligned with selected topic");
    }

    const matchedKeywords = priorityKeywords.filter((keyword) => {
      const keywordTokens = this.normalizePromptText(keyword).split(/\s+/).filter((token) => token.length > 2);
      return keywordTokens.some((token) => normalizedHook.includes(token));
    });
    if (matchedKeywords.length > 0) {
      score += Math.min(16, matchedKeywords.length * 6);
      rationale.push("Reflects priority keywords");
    }

    const curiosityPhrases = ["why", "what", "how", "real reason", "truth", "twist", "secret", "actually"];
    if (curiosityPhrases.some((phrase) => normalizedHook.includes(phrase))) {
      score += 8;
      rationale.push("Curiosity-driven opening");
    }

    const urgencyPhrases = ["breaking", "right now", "today", "just", "latest"];
    if (urgencyPhrases.some((phrase) => normalizedHook.includes(phrase))) {
      score += 6;
      rationale.push("Urgent news framing");
    }

    if (options.style === "Explainer" && /break down|understand|what matters|explained/.test(normalizedHook)) {
      score += 8;
      rationale.push("Fits explainer style");
    }
    if (options.style === "Viral" && /why|twist|blowing up|everyone|change everything/.test(normalizedHook)) {
      score += 8;
      rationale.push("Fits viral style");
    }
    if (options.style === "News" && /breaking|latest|key update|right now/.test(normalizedHook)) {
      score += 8;
      rationale.push("Fits news style");
    }

    const cappedScore = Math.max(0, Math.min(100, score));
    const scoreLabel = cappedScore >= 78
      ? "Strong"
      : (cappedScore >= 60 ? "Good" : "Experimental");

    return {
      text: hookText,
      score: cappedScore,
      scoreLabel,
      rationale: rationale.slice(0, 3).join(" | ") || "General fallback hook",
    };
  }

  private rankHookOptions(
    hooks: string[],
    options: Pick<ScriptGenerationOptions, "topic" | "style" | "keywords"> = {},
  ): HookOption[] {
    return hooks
      .map((hook) => this.scoreHookOption(hook, options))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    if (!text || sourceLanguage === targetLanguage) {
      return text;
    }

    const prompt = `You are a professional translator. Convert the following text from ${sourceLanguage} to ${targetLanguage}. Output only translated text with no extra commentary.\n\nText:\n${text}`;
    const response = await axios.post(`${this.apiUrl}/api/generate`, {
      model: this.model,
      prompt,
      stream: false,
      format: "text",
    });

    if (!response?.data?.response) {
      throw new Error("Translation API returned no response");
    }

    let result = response.data.response;
    if (typeof result !== "string") {
      result = String(result);
    }

    return result.trim();
  }

  async suggestTopics(
    newsStories: PromptStory[],
    options: Pick<ScriptGenerationOptions, "category" | "keywords"> = {},
  ): Promise<string[]> {
    const rankedStories = this.rankStoriesForPrompt(newsStories, options);
    const fallback = this.fallbackTopics(rankedStories, options.category);
    const newsContent = this.formatStories(rankedStories);
    const categoryLine = options.category ? `Category: ${options.category}` : "";
    const keywordLine = options.keywords?.length ? `Priority keywords: ${options.keywords.join(", ")}` : "";
    const prompt = `
You are a short-form news strategist.
Read these stories and return the 5 best trending topic labels a user can pick before script generation.

${categoryLine}
${keywordLine}
Stories:
${newsContent}

STRICT INSTRUCTIONS:
1. Output ONLY a valid JSON array of strings.
2. Each topic must be 2-5 words.
3. Topics must be concise, clickable, and specific.
4. Do not repeat nearly identical topics.
5. Example: ["Drone Deal Pressure", "Iran-US Tensions", "Market Shock Risk"]
`;

    try {
      const response = await axios.post(`${this.apiUrl}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
        format: "json",
      });

      const parsed = this.extractJson(response.data?.response);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 5);
      }
    } catch (error) {
      console.warn("[AiLlmGenerator] suggestTopics fallback:", error);
    }

    return fallback;
  }

  async suggestHooks(
    newsStories: PromptStory[],
    options: Pick<ScriptGenerationOptions, "category" | "topic" | "style" | "keywords"> = {},
  ): Promise<HookOption[]> {
    const rankedStories = this.rankStoriesForPrompt(newsStories, options);
    const fallback = this.fallbackHooks(rankedStories, options.topic, options.style);
    const newsContent = this.formatStories(rankedStories);
    const prompt = `
You are writing opening hooks for short-form videos.
Generate 3 distinct hook lines for a ${options.style || "News"} style short video.

Category: ${options.category || "General"}
Selected topic: ${options.topic || "Auto"}
Priority keywords: ${options.keywords?.join(", ") || "None"}

Stories:
${newsContent}

STRICT INSTRUCTIONS:
1. Output ONLY a valid JSON array of 3 strings.
2. Each hook must be 8-16 words.
3. Hooks should feel punchy, spoken, and scroll-stopping.
4. Do not add numbering or explanations.
`;

    try {
      const response = await axios.post(`${this.apiUrl}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
        format: "json",
      });

      const parsed = this.extractJson(response.data?.response);
      if (Array.isArray(parsed)) {
        return this.rankHookOptions(parsed
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 3), options);
      }
    } catch (error) {
      console.warn("[AiLlmGenerator] suggestHooks fallback:", error);
    }

    return this.rankHookOptions(fallback, options);
  }

  async generateScript(
    newsStories: PromptStory[],
    options: ScriptGenerationOptions = {},
  ): Promise<SceneInput[]> {
    const rankedStories = this.rankStoriesForPrompt(newsStories, options);
    const newsContent = this.formatStories(rankedStories);
    const categoryLine = options.category ? `Category focus: ${options.category}` : "";
    const topicLine = options.topic ? `Topic focus: ${options.topic}` : "";
    const styleLine = options.style ? `Narrative style: ${options.style}` : "";
    const hookLine = options.hook ? `Opening hook to incorporate in scene 1: ${options.hook}` : "";
    const keywordLine = options.keywords?.length ? `Priority keywords: ${options.keywords.join(", ")}` : "";

    const prompt = `
You are a professional world news script writer.
Given the following news stories, create a 5-scene video script for a short video (TikTok/Shorts style).
Each scene must relate to these stories and be engaging.

Stories:
${newsContent}

Creative direction:
${categoryLine}
${topicLine}
${styleLine}
${hookLine}
${keywordLine}

STRICT INSTRUCTIONS:
1. Output ONLY a valid JSON array.
2. NO text before or after the JSON.
3. Start the output with "[" and end it with "]".
4. Each object must have these EXACT fields:
   - "text": Punchy narration for the scene (around 20-30 words).
   - "subcategory": A precise subcategory label under the broader category/story theme.
   - "keywords": An array of 4-8 metadata keywords for SEO and relevance.
   - "searchTerms": An array of 3-5 HIGHLY SPECIFIC keywords for stock video search.
   - "headline": A short, high-impact headline for the top banner.
   - "visualPrompt": A detailed, descriptive visual prompt for AI image generation.
5. If an opening hook is provided, scene 1 must naturally begin with that angle.
6. If a topic is provided, all scenes must stay tightly aligned to it.
7. If style is "Viral", make the language sharper and more curiosity-driven.
8. If style is "Explainer", make the language clearer and more structured.
9. If style is "News", keep it authoritative and urgent.

JSON Format Example:
[
  {
    "text": "World leaders meet in Geneva to discuss the latest climate accords...",
    "subcategory": "Climate Diplomacy",
    "keywords": ["climate", "summit", "diplomacy", "policy"],
    "searchTerms": ["climate summit", "geneva", "world leaders meeting"],
    "headline": "CLIMATE CRISIS TALKS",
    "visualPrompt": "A large conference hall in Geneva with world flags and leaders sitting at a round table, cinematic lighting, professional atmosphere."
  }
]
`;

    console.log(`Sending prompt to AI LLM at ${this.apiUrl}/api/generate using model ${this.model}`);
    try {
      const response = await axios.post(`${this.apiUrl}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
        format: "json",
      });

      console.log(`AI LLM response status: ${response.status}`);
      const result = response.data;
      if (!result || typeof result !== "object") {
        const error: any = new Error("Invalid response from AI LLM (no data)");
        error.rawResponse = JSON.stringify(result);
        throw error;
      }

      const jsonStr = result.response;
      if (!jsonStr) {
        const error: any = new Error("AI LLM returned empty response field");
        error.rawResponse = JSON.stringify(result);
        throw error;
      }

      console.log(`AI LLM generated response length: ${jsonStr.length} chars`);
      let scenes = this.extractJson(jsonStr);

      if (!Array.isArray(scenes) && typeof scenes === "object" && scenes !== null) {
        const possibleArray = (scenes as Record<string, unknown>).scenes
          || (scenes as Record<string, unknown>).script
          || Object.values(scenes).find(Array.isArray);
        if (possibleArray) {
          scenes = possibleArray;
        } else if (Object.keys(scenes).every((key) => !Number.isNaN(Number(key)))) {
          scenes = Object.keys(scenes)
            .sort((a, b) => Number(a) - Number(b))
            .map((key) => (scenes as Record<string, unknown>)[key]);
        }
      }

      if (!Array.isArray(scenes)) {
        const error: any = new Error("AI LLM output is not an array");
        error.rawResponse = jsonStr;
        throw error;
      }

      const priorityKeywords = this.normalizeKeywordList(options.keywords);
      const normalizedScenes = scenes.map((scene) => {
        if (typeof scene !== "object" || scene === null) {
          return scene;
        }

        const sceneRecord = scene as Record<string, unknown>;
        const baseText = String(
          sceneRecord.text
            || sceneRecord.narration
            || sceneRecord.content
            || sceneRecord.speech
            || sceneRecord.description
            || "",
        ).trim();
        const baseSubcategory = String(
          sceneRecord.subcategory
            || sceneRecord.subCategory
            || sceneRecord.topic
            || options.topic
            || "",
        ).trim();
        const baseHeadline = String(
          sceneRecord.headline
            || sceneRecord.title
            || sceneRecord.header
            || sceneRecord.banner
            || "",
        ).trim();
        const scenePriorityKeywords = this.getRelevantPriorityKeywords(priorityKeywords, [
          baseText,
          baseSubcategory,
          baseHeadline,
          options.topic,
        ]);
        const rawKeywords = Array.isArray(sceneRecord.keywords)
          ? sceneRecord.keywords
          : (Array.isArray(sceneRecord.tags) ? sceneRecord.tags : []);
        const rawSearchTerms = Array.isArray(sceneRecord.searchTerms)
          ? sceneRecord.searchTerms
          : (sceneRecord.keywords || sceneRecord.tags || sceneRecord.search_terms || []);
        const mergedKeywords = this.mergePriorityTerms(
          scenePriorityKeywords,
          rawKeywords as string[],
          8,
        );
        const mergedSearchTerms = this.mergePriorityTerms(
          scenePriorityKeywords,
          rawSearchTerms as string[],
          6,
        );
        const baseVisualPrompt = String(
          sceneRecord.visualPrompt
            || sceneRecord.imagePrompt
            || sceneRecord.prompt
            || sceneRecord.visual
            || sceneRecord.image_prompt
            || "",
        ).trim();
        const visualFocusClause = scenePriorityKeywords.length
          ? ` Focus on ${scenePriorityKeywords.join(", ")}.`
          : "";

        return {
          text: baseText,
          subcategory: baseSubcategory,
          keywords: mergedKeywords,
          headline: baseHeadline,
          visualPrompt: `${baseVisualPrompt}${visualFocusClause}`.trim() || scenePriorityKeywords.join(", "),
          searchTerms: mergedSearchTerms,
        };
      });

      return normalizedScenes.slice(0, 7) as SceneInput[];
    } catch (error: any) {
      console.error("AI LLM generation failed:", error);
      let errorMsg = error.message;
      let rawResponse = error.rawResponse || "No raw response";

      if (error.response?.data) {
        const aiLlmError = error.response.data.error || JSON.stringify(error.response.data);
        errorMsg = `AI LLM Error: ${aiLlmError}`;
        rawResponse = JSON.stringify(error.response.data);

        if (aiLlmError.includes("terminated") || aiLlmError.includes("exit status 2")) {
          errorMsg = "AI LLM model crashed (likely Out of Memory). Please use a smaller model like llama3.2:1b or increase your system RAM.";
        }
      }

      const enhancedError: any = new Error(errorMsg);
      enhancedError.rawResponse = rawResponse;
      throw enhancedError;
    }
  }

  private formatStories(newsStories: PromptStory[]): string {
    return newsStories
      .map((story, index) => {
        const sourceLine = story.sourceName ? `\nSOURCE: ${story.sourceName}` : "";
        const dateLine = story.pubDate ? `\nDATE: ${story.pubDate}` : "";
        return `${index + 1}. TITLE: ${story.title}${sourceLine}${dateLine}\nCONTENT: ${story.content || ""}`;
      })
      .join("\n\n");
  }

  private extractJson(jsonStr: string): unknown {
    try {
      return JSON.parse(jsonStr);
    } catch {
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }

      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
    }

    throw new Error("Could not parse JSON from AI LLM response");
  }

  private fallbackTopics(
    newsStories: Array<{ title: string; content?: string }>,
    category?: string,
  ): string[] {
    const stopWords = new Set([
      "the", "and", "for", "with", "from", "into", "over", "after", "about",
      "their", "this", "that", "have", "will", "amid", "news", "says", "say",
    ]);

    const phrases = newsStories.flatMap((story) => {
      const titleWords = story.title
        .split(/[^a-zA-Z0-9]+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 3 && !stopWords.has(word.toLowerCase()));
      return [
        story.title.split(/[,:-]/)[0]?.trim(),
        titleWords.slice(0, 3).join(" "),
      ];
    });

    const unique = Array.from(new Set(
      phrases
        .map((phrase) => phrase?.replace(/\s+/g, " ").trim())
        .filter((phrase): phrase is string => Boolean(phrase)),
    ));

    const fallbackSeed = category ? [`${category} Update`, `${category} Breakdown`] : ["Breaking Update"];
    return [...unique, ...fallbackSeed].slice(0, 5);
  }

  private fallbackHooks(
    newsStories: Array<{ title: string; content?: string }>,
    topic?: string,
    style?: AutoScriptStyle,
  ): string[] {
    const seedTitle = topic || newsStories[0]?.title || "this developing story";
    const normalizedStyle = style || "News";

    if (normalizedStyle === "Viral") {
      return [
        `Why everyone is suddenly watching ${seedTitle} right now`,
        `This twist in ${seedTitle} could change everything fast`,
        `The real reason ${seedTitle} is blowing up today`,
      ];
    }

    if (normalizedStyle === "Explainer") {
      return [
        `Here is what actually matters in ${seedTitle} today`,
        `Let us break down why ${seedTitle} is such a big deal`,
        `This is the simplest way to understand ${seedTitle}`,
      ];
    }

    return [
      `Breaking down what just happened in ${seedTitle}`,
      `Here is the latest on ${seedTitle} and why it matters`,
      `This is the key update driving ${seedTitle} right now`,
    ];
  }
}
