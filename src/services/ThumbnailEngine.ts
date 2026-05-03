import { logger } from "../logger";

export interface ThumbnailOptions {
  title: string;
  boldText: boolean;
  contrast: "low" | "medium" | "high";
  emotionalTrigger: "surprise" | "curiosity" | "urgency" | "humor" | "fear";
  curiosityGap: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

export interface ThumbnailDirectives {
  boldTextSize: number;
  contrastRatio: number;
  colorScheme: string[];
  emotionalElement: string;
  curiosityGapPosition: "top" | "bottom" | "center";
  safeZones: { top: number; bottom: number; left: number; right: number };
}

export class ThumbnailEngine {
  private emotionalTriggers: Record<string, { emoji: string; color: string; intensity: number }> = {
    surprise: { emoji: "😲", color: "#ff6b6b", intensity: 1.2 },
    curiosity: { emoji: "🤔", color: "#ffd93d", intensity: 1.1 },
    urgency: { emoji: "⚠️", color: "#ff4444", intensity: 1.3 },
    humor: { emoji: "😂", color: "#ff8fab", intensity: 1.0 },
    fear: { emoji: "😱", color: "#a100f2", intensity: 1.25 },
  };

  generateThumbnailDirectives(options: ThumbnailOptions): ThumbnailDirectives {
    const trigger = this.emotionalTriggers[options.emotionalTrigger];
    const contrastMap = { low: 3, medium: 5, high: 8 };

    return {
      boldTextSize: options.boldText ? 72 : 48,
      contrastRatio: contrastMap[options.contrast],
      colorScheme: [options.backgroundColor, options.textColor, options.accentColor, trigger.color],
      emotionalElement: `${trigger.emoji} ${options.title.substring(0, 20)}`,
      curiosityGapPosition: options.curiosityGap.length > 15 ? "bottom" : "center",
      safeZones: {
        top: 30,
        bottom: 30,
        left: 20,
        right: 20,
      },
    };
  }

  validateContrast(bgColor: string, textColor: string): boolean {
    const getLuminance = (hex: string): number => {
      const rgb = parseInt(hex.replace("#", ""), 16);
      const r = (rgb >> 16) & 255;
      const g = (rgb >> 8) & 255;
      const b = rgb & 255;
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };

    const bgLum = getLuminance(bgColor);
    const textLum = getLuminance(textColor);
    const ratio = (Math.max(bgLum, textLum) + 0.05) / (Math.min(bgLum, textLum) + 0.05);
    return ratio >= 4.5;
  }

  generateCuriosityGap(topic: string): string {
    const gaps: Record<string, string[]> = {
      productivity: [
        "This ONE trick...",
        "You won't believe...",
        "Doctors hate this...",
        "See what happened...",
      ],
      health: [
        "Health experts reveal...",
        "The truth about...",
        "What they don't tell you...",
        "This changed everything...",
      ],
      business: [
        "Millionaires know...",
        "The secret to...",
        "How they made $...",
        "Warren Buffett's...",
      ],
      entertainment: [
        "This shocked everyone...",
        "You won't see this coming...",
        "The moment changed...",
        "What happened next...",
      ],
    };

    const selected = gaps[topic] || gaps.entertainment;
    return selected[Math.floor(Math.random() * selected.length)];
  }

  scoreThumbailEffectiveness(directives: ThumbnailDirectives): number {
    let score = 50;

    if (directives.contrastRatio >= 5) score += 20;
    if (directives.boldTextSize >= 60) score += 15;
    if (directives.emotionalElement.length > 5) score += 15;

    return Math.min(100, score);
  }
}
