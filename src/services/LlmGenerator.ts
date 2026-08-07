import { logger } from "../logger";

export interface LlmConfig {
  endpoint?: string;
  model?: string;
  apiKey?: string;
  timeout?: number;
}

let _config: LlmConfig = {};

const DEFAULT_OPENROUTER_URL = "https://openrouter.ai/api/v1";
const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-chat-v3-0324:free";

export class LlmGenerator {
  static configure(cfg: LlmConfig) {
    _config = cfg;
  }

  static isAvailable(): boolean {
    return !!(
      (_config.endpoint && _config.endpoint.trim().length > 0) ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.OLLAMA_ENDPOINT
    );
  }

  private static async generateOpenRouter(prompt: string): Promise<string> {
    const url = (process.env.OPENROUTER_URL || DEFAULT_OPENROUTER_URL).replace(/\/+$/, "") + "/chat/completions";
    const model = process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a precise assistant. Respond only with the requested output and no extra commentary." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
      }),
      signal: AbortSignal.timeout(_config.timeout || 60000),
    });
    if (!resp.ok) throw new Error(`OpenRouter HTTP ${resp.status}`);
    const json = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter returned no completion content");
    return content.trim();
  }

  static async generate(prompt: string): Promise<string> {
    if (!LlmGenerator.isAvailable()) {
      throw new Error("LLM not configured");
    }
    if (process.env.OPENROUTER_API_KEY) {
      try {
        return await LlmGenerator.generateOpenRouter(prompt);
      } catch (err) {
        logger.warn({ err }, "LlmGenerator.openrouter failed, falling back to Ollama");
      }
    }
    const endpoint = _config.endpoint || process.env.OLLAMA_ENDPOINT || "http://localhost:11434";
    const model = _config.model || process.env.LLM_MODEL || "llama3";
    try {
      const resp = await fetch(`${endpoint}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false }),
        signal: AbortSignal.timeout(_config.timeout || 30000),
      });
      if (!resp.ok) throw new Error(`LLM HTTP ${resp.status}`);
      const json = await resp.json() as { response?: string };
      return (json.response || "").trim();
    } catch (err) {
      logger.warn({ err }, "LlmGenerator.generate failed");
      throw err;
    }
  }
}
