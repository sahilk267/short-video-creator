import { logger } from "../logger";

export interface LlmConfig {
  endpoint?: string;
  model?: string;
  apiKey?: string;
  timeout?: number;
}

let _config: LlmConfig = {};

export class LlmGenerator {
  static configure(cfg: LlmConfig) {
    _config = cfg;
  }

  static isAvailable(): boolean {
    return !!(
      (_config.endpoint && _config.endpoint.trim().length > 0) ||
      process.env.OPENAI_API_KEY ||
      process.env.OLLAMA_ENDPOINT
    );
  }

  static async generate(prompt: string): Promise<string> {
    if (!LlmGenerator.isAvailable()) {
      throw new Error("LLM not configured");
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
