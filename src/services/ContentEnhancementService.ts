export interface IdeationInput {
  category: string;
  trendKeywords: string[];
  userPreferences?: string[];
}

export interface EditingOptions {
  transitions: string[];
  effects: string[];
  textAnimations: string[];
  musicSync: "light" | "medium" | "aggressive";
}

export interface PersonalizationInput {
  ageGroup?: string;
  location?: string;
  interests?: string[];
}

export interface ModerationResult {
  safe: boolean;
  flags: string[];
  sanitizedText: string;
}

export interface AccessibilityResult {
  altText: string;
  audioDescription: string;
  extendedCaptions: string[];
}

export class ContentEnhancementService {
  public ideate(input: IdeationInput): string[] {
    const base = [
      `${input.category}: fast update with data-backed insight`,
      `${input.category}: myth vs reality in 30 seconds`,
      `${input.category}: what changed today and why it matters`,
    ];

    const trendDriven = input.trendKeywords.slice(0, 5).map((keyword) =>
      `${input.category}: ${keyword} explained with actionable context`,
    );

    const preferenceDriven = (input.userPreferences || []).slice(0, 3).map((pref) =>
      `${input.category}: tailored deep-dive for ${pref}`,
    );

    return Array.from(new Set([...trendDriven, ...preferenceDriven, ...base])).slice(0, 10);
  }

  public editingPrimitives(intensity: "low" | "medium" | "high"): EditingOptions {
    if (intensity === "high") {
      return {
        transitions: ["glitch-cut", "speed-ramp", "split-zoom"],
        effects: ["kinetic-contrast", "beat-pulse"],
        textAnimations: ["stagger-pop", "mask-reveal"],
        musicSync: "aggressive",
      };
    }

    if (intensity === "medium") {
      return {
        transitions: ["smooth-cut", "directional-wipe"],
        effects: ["subtle-parallax"],
        textAnimations: ["fade-up", "slide-emphasis"],
        musicSync: "medium",
      };
    }

    return {
      transitions: ["hard-cut"],
      effects: ["none"],
      textAnimations: ["fade"],
      musicSync: "light",
    };
  }

  public personalize(input: PersonalizationInput): {
    cta: string;
    hook: string;
    distributionHint: string;
  } {
    const location = input.location || "your region";
    const interests = (input.interests || []).slice(0, 2).join(" + ") || "current trends";
    const ageTone = input.ageGroup === "18-24" ? "high-energy" : "credible";

    return {
      cta: `Follow for ${location}-focused updates and save this for later`,
      hook: `${ageTone} opener for ${interests}`,
      distributionHint: `prioritize slots where ${location} audience is active`,
    };
  }

  public addInteractiveOverlay(script: string): {
    withOverlay: string;
    polls: string[];
  } {
    return {
      withOverlay: `${script}\n\n[CTA_OVERLAY] Comment YES/NO | Poll in description | Follow for part 2`,
      polls: [
        "Do you agree with this take?",
        "Should we do a deeper breakdown next?",
      ],
    };
  }

  public moderate(text: string): ModerationResult {
    const banned = ["hate", "slur", "violent_threat", "copyright_violation"];
    const found = banned.filter((term) => text.toLowerCase().includes(term));

    let sanitized = text;
    for (const term of found) {
      sanitized = sanitized.replace(new RegExp(term, "gi"), "[redacted]");
    }

    return {
      safe: found.length === 0,
      flags: found,
      sanitizedText: sanitized,
    };
  }

  public optimizeByTrends(baseTags: string[], liveTrends: string[]): string[] {
    const merged = [...liveTrends.slice(0, 5), ...baseTags];
    return Array.from(new Set(merged)).slice(0, 15);
  }

  public accessibility(script: string): AccessibilityResult {
    const sentences = script
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);

    return {
      altText: `Video summary: ${sentences.slice(0, 2).join(". ")}`,
      audioDescription: `Audio description: ${sentences.join(". ")}`,
      extendedCaptions: sentences.map((s, idx) => `[${idx + 1}] ${s}`),
    };
  }
}
