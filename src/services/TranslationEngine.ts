import axios from "axios";
import { logger } from "../logger";

export type SupportedLanguage = "en" | "hi" | "es" | "fr" | "ar" | "pt" | "de" | "zh" | "ja" | "ko" | "ur" | "bn";

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: "English", hi: "Hindi", es: "Spanish", fr: "French",
  ar: "Arabic", pt: "Portuguese", de: "German", zh: "Chinese",
  ja: "Japanese", ko: "Korean", ur: "Urdu", bn: "Bengali",
};

const HINDI_TRANSLATIONS: Record<string, string> = {
  "Breaking": "ताज़ा खबर", "Update": "अपडेट", "New": "नया",
  "Technology": "तकनीक", "Business": "व्यापार", "Sports": "खेल",
  "Health": "स्वास्थ्य", "Education": "शिक्षा", "Entertainment": "मनोरंजन",
};

interface TranslationCache {
  [key: string]: { result: string; expiresAt: number };
}

export interface TranslationResult {
  original: string;
  translated: string;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  engine: "libretranslate" | "fallback" | "cache";
}

export class TranslationEngine {
  private libreTranslateUrl: string;
  private cache: TranslationCache = {};
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor(libreTranslateUrl: string = "https://libretranslate.com") {
    this.libreTranslateUrl = libreTranslateUrl;
  }

  private cacheKey(text: string, from: string, to: string): string {
    return `${from}:${to}:${text.substring(0, 50)}`;
  }

  private getCache(key: string): string | null {
    const entry = this.cache[key];
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { delete this.cache[key]; return null; }
    return entry.result;
  }

  private setCache(key: string, value: string) {
    this.cache[key] = { result: value, expiresAt: Date.now() + this.CACHE_TTL };
  }

  private fallbackTranslate(text: string, targetLang: SupportedLanguage): string {
    if (targetLang === "hi") {
      let result = text;
      for (const [en, hi] of Object.entries(HINDI_TRANSLATIONS)) {
        result = result.replace(new RegExp(`\\b${en}\\b`, "gi"), hi);
      }
      return result !== text ? result : `[${LANGUAGE_NAMES[targetLang]}] ${text}`;
    }
    return `[${LANGUAGE_NAMES[targetLang]}] ${text}`;
  }

  async translate(text: string, targetLang: SupportedLanguage, sourceLang: SupportedLanguage = "en"): Promise<TranslationResult> {
    if (sourceLang === targetLang) return { original: text, translated: text, sourceLang, targetLang, engine: "cache" };

    const key = this.cacheKey(text, sourceLang, targetLang);
    const cached = this.getCache(key);
    if (cached) return { original: text, translated: cached, sourceLang, targetLang, engine: "cache" };

    try {
      const response = await axios.post(`${this.libreTranslateUrl}/translate`, {
        q: text, source: sourceLang, target: targetLang, format: "text",
      }, { timeout: 5000 });

      const translated = response.data?.translatedText || text;
      this.setCache(key, translated);
      logger.debug({ from: sourceLang, to: targetLang, chars: text.length }, "Translated via LibreTranslate");
      return { original: text, translated, sourceLang, targetLang, engine: "libretranslate" };
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "LibreTranslate failed, using fallback");
      const fallback = this.fallbackTranslate(text, targetLang);
      this.setCache(key, fallback);
      return { original: text, translated: fallback, sourceLang, targetLang, engine: "fallback" };
    }
  }

  async translateBatch(texts: string[], targetLang: SupportedLanguage, sourceLang: SupportedLanguage = "en"): Promise<TranslationResult[]> {
    return Promise.all(texts.map((t) => this.translate(t, targetLang, sourceLang)));
  }

  getSupportedLanguages(): typeof LANGUAGE_NAMES { return LANGUAGE_NAMES; }
}
