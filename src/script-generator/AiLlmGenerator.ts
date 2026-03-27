import axios from "axios";
import type { SceneInput } from "../types/shorts";

export type AutoScriptStyle = "News" | "Viral" | "Explainer";

export interface ScriptGenerationOptions {
  category?: string;
  topic?: string;
  style?: AutoScriptStyle;
  hook?: string;
  keywords?: string[];
}

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
    newsStories: Array<{ title: string; content?: string }>,
    options: Pick<ScriptGenerationOptions, "category" | "keywords"> = {},
  ): Promise<string[]> {
    const fallback = this.fallbackTopics(newsStories, options.category);
    const newsContent = this.formatStories(newsStories);
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
    newsStories: Array<{ title: string; content?: string }>,
    options: Pick<ScriptGenerationOptions, "category" | "topic" | "style" | "keywords"> = {},
  ): Promise<string[]> {
    const fallback = this.fallbackHooks(newsStories, options.topic, options.style);
    const newsContent = this.formatStories(newsStories);
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
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 3);
      }
    } catch (error) {
      console.warn("[AiLlmGenerator] suggestHooks fallback:", error);
    }

    return fallback;
  }

  async generateScript(
    newsStories: Array<{ title: string; content?: string }>,
    options: ScriptGenerationOptions = {},
  ): Promise<SceneInput[]> {
    const newsContent = this.formatStories(newsStories);
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

      const normalizedScenes = scenes.map((scene) => {
        if (typeof scene !== "object" || scene === null) {
          return scene;
        }

        return {
          text: (scene as Record<string, unknown>).text
            || (scene as Record<string, unknown>).narration
            || (scene as Record<string, unknown>).content
            || (scene as Record<string, unknown>).speech
            || (scene as Record<string, unknown>).description
            || "",
          subcategory: (scene as Record<string, unknown>).subcategory
            || (scene as Record<string, unknown>).subCategory
            || (scene as Record<string, unknown>).topic
            || options.topic
            || "",
          keywords: Array.isArray((scene as Record<string, unknown>).keywords)
            ? (scene as Record<string, unknown>).keywords
            : (Array.isArray((scene as Record<string, unknown>).tags) ? (scene as Record<string, unknown>).tags : []),
          headline: (scene as Record<string, unknown>).headline
            || (scene as Record<string, unknown>).title
            || (scene as Record<string, unknown>).header
            || (scene as Record<string, unknown>).banner
            || "",
          visualPrompt: (scene as Record<string, unknown>).visualPrompt
            || (scene as Record<string, unknown>).imagePrompt
            || (scene as Record<string, unknown>).prompt
            || (scene as Record<string, unknown>).visual
            || (scene as Record<string, unknown>).image_prompt
            || "",
          searchTerms: Array.isArray((scene as Record<string, unknown>).searchTerms)
            ? (scene as Record<string, unknown>).searchTerms
            : ((scene as Record<string, unknown>).keywords || (scene as Record<string, unknown>).tags || (scene as Record<string, unknown>).search_terms || []),
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

  private formatStories(newsStories: Array<{ title: string; content?: string }>): string {
    return newsStories
      .map((story, index) => `${index + 1}. TITLE: ${story.title}\nCONTENT: ${story.content || ""}`)
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
