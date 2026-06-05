export type EmotionalTone = "joy" | "fear" | "anger" | "sadness" | "surprise" | "trust" | "disgust" | "anticipation";

export interface EmotionalScore {
  tone: EmotionalTone;
  intensity: number;
  scriptAlignment: number;
  audioAlignment: number;
  visualAlignment: number;
  overallScore: number;
}

export interface EmotionalDirectives {
  primaryEmotion: EmotionalTone;
  musicGenre: string;
  colorPalette: string[];
  pacing: "fast" | "moderate" | "slow";
  voiceTone: string;
  scriptModifications: string[];
}

export class EmotionalResonanceEngine {
  private emotionalMappings: Record<EmotionalTone, { musicGenre: string; colors: string[]; pacing: string }> = {
    joy: { musicGenre: "upbeat pop", colors: ["#FFD700", "#FF6B6B", "#FF8C00"], pacing: "fast" },
    fear: { musicGenre: "suspenseful", colors: ["#2C3E50", "#E74C3C", "#000000"], pacing: "varied" },
    anger: { musicGenre: "intense rock", colors: ["#C0392B", "#D32F2F", "#B71C1C"], pacing: "fast" },
    sadness: { musicGenre: "melancholic", colors: ["#34495E", "#95A5A6", "#BDC3C7"], pacing: "slow" },
    surprise: { musicGenre: "dramatic", colors: ["#F39C12", "#E67E22", "#D35400"], pacing: "fast" },
    trust: { musicGenre: "classical", colors: ["#3498DB", "#2980B9", "#1E8449"], pacing: "moderate" },
    disgust: { musicGenre: "dark electronic", colors: ["#6C5CE7", "#A29BFE", "#74B9FF"], pacing: "moderate" },
    anticipation: { musicGenre: "building tension", colors: ["#FF7675", "#FDCB6E", "#00B894"], pacing: "building" },
  };

  private deterministicRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  scoreEmotionalContent(scriptText: string, audioLength: number, visualElements: number): EmotionalScore {
    const tones: EmotionalTone[] = ["joy", "fear", "anger", "sadness", "surprise", "trust", "disgust", "anticipation"];
    const seed = scriptText.length + audioLength + visualElements;
    const primaryEmotion = tones[Math.floor(this.deterministicRandom(seed) * tones.length)];

    const scriptScore = Math.min(1, scriptText.trim().length / 120);
    const audioScore = Math.min(1, Math.max(0, audioLength / 120));
    const visualScore = Math.min(1, Math.max(0, visualElements / 10));

    const scriptAlignment = 0.5 + scriptScore * 0.35 + this.deterministicRandom(seed + 11) * 0.15;
    const audioAlignment = 0.5 + audioScore * 0.4 + this.deterministicRandom(seed + 17) * 0.1;
    const visualAlignment = 0.45 + visualScore * 0.35 + this.deterministicRandom(seed + 23) * 0.2;
    const intensity = 0.5 + this.deterministicRandom(seed + 29) * 0.5;
    const overallScore = Math.min(1, (scriptAlignment + audioAlignment + visualAlignment + intensity) / 4);

    return {
      tone: primaryEmotion,
      intensity,
      scriptAlignment,
      audioAlignment,
      visualAlignment,
      overallScore,
    };
  }

  generateEmotionalDirectives(emotion: EmotionalTone): EmotionalDirectives {
    const mapping = this.emotionalMappings[emotion];

    const scriptModifications: Record<EmotionalTone, string[]> = {
      joy: ["Add celebratory language", "Use exclamation marks", "Include humor"],
      fear: ["Build tension gradually", "Use pause techniques", "Add dramatic pauses"],
      anger: ["Use powerful verbs", "Increase energy", "Direct calls-to-action"],
      sadness: ["Slow down pacing", "Use reflective language", "Include personal stories"],
      surprise: ["Use unexpected twists", "Add plot reversals", "Build anticipation"],
      trust: ["Use facts and data", "Include testimonials", "Build credibility"],
      disgust: ["Highlight problems", "Use contrast", "Call for change"],
      anticipation: ["Build excitement gradually", "Use cliff-hangers", "Promise revelations"],
    };

    return {
      primaryEmotion: emotion,
      musicGenre: mapping.musicGenre,
      colorPalette: mapping.colors,
      pacing: mapping.pacing as "fast" | "moderate" | "slow",
      voiceTone: emotion,
      scriptModifications: scriptModifications[emotion],
    };
  }

  validateEmotionalAlignment(score: EmotionalScore): boolean {
    return score.overallScore >= 0.65 && score.intensity > 0.4;
  }
}
