import { logger } from "../logger";

export type ModerationSeverity = "none" | "low" | "medium" | "high" | "critical";

export interface ModerationFlag {
  rule: string;
  severity: ModerationSeverity;
  matches: string[];
  description: string;
}

export interface ModerationResult {
  text: string;
  passed: boolean;
  overallSeverity: ModerationSeverity;
  flags: ModerationFlag[];
  score: number;
  recommendation: string;
  suggestedActions: string[];
}

interface ModerationRule {
  id: string;
  description: string;
  severity: ModerationSeverity;
  patterns: RegExp[];
}

const MODERATION_RULES: ModerationRule[] = [
  {
    id: "hate_speech",
    description: "Hate speech or discriminatory language",
    severity: "critical",
    patterns: [/\b(racist|sexist|homophobic|transphobic|xenophobic)\b/i, /\bhate\s+(speech|group|crime)\b/i],
  },
  {
    id: "explicit_content",
    description: "Explicit or adult content",
    severity: "critical",
    patterns: [/\b(explicit|pornographic|xxx|nsfw|adult content)\b/i],
  },
  {
    id: "violence",
    description: "Graphic violence or self-harm",
    severity: "critical",
    patterns: [/\b(self.harm|suicide|kill yourself|kys)\b/i, /\b(graphic violence|gore)\b/i],
  },
  {
    id: "false_claims",
    description: "Potentially misleading health/financial claims",
    severity: "high",
    patterns: [/\b(miracle cure|100% guaranteed|overnight results|get rich quick)\b/i, /\b(cure cancer|lose 30 pounds in)\b/i],
  },
  {
    id: "spam_indicators",
    description: "Spam-like repetition or excessive caps",
    severity: "low",
    patterns: [/(.)\1{6,}/i, /[A-Z]{10,}/],
  },
  {
    id: "excessive_hashtags",
    description: "Excessive hashtag spam",
    severity: "low",
    patterns: [/(#\w+\s*){20,}/i],
  },
  {
    id: "copyright",
    description: "Possible copyright/trademark violation",
    severity: "medium",
    patterns: [/\ball rights reserved\b/i, /©\s*\d{4}/i, /™|®/],
  },
  {
    id: "personal_info",
    description: "Possible exposure of personal information",
    severity: "high",
    patterns: [/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/],
  },
];

const SEVERITY_SCORES: Record<ModerationSeverity, number> = { none: 0, low: 10, medium: 30, high: 60, critical: 100 };
const SEVERITY_ORDER: ModerationSeverity[] = ["none", "low", "medium", "high", "critical"];

export class ModerationEngine {
  scan(text: string): ModerationResult {
    try {
      const flags: ModerationFlag[] = [];

      for (const rule of MODERATION_RULES) {
        const matches: string[] = [];
        for (const pattern of rule.patterns) {
          const found = text.match(pattern);
          if (found) matches.push(...found.slice(0, 3));
        }
        if (matches.length > 0) {
          flags.push({ rule: rule.id, severity: rule.severity, matches: [...new Set(matches)].slice(0, 5), description: rule.description });
        }
      }

      const maxSeverityIdx = flags.reduce((max, f) => Math.max(max, SEVERITY_ORDER.indexOf(f.severity)), 0);
      const overallSeverity = SEVERITY_ORDER[maxSeverityIdx] || "none";
      const score = flags.reduce((sum, f) => sum + SEVERITY_SCORES[f.severity], 0);
      const passed = !["critical", "high"].includes(overallSeverity);

      const recommendation = passed
        ? score === 0 ? "Content passed all moderation checks" : "Minor issues found — review before publishing"
        : `Content blocked: ${flags.filter((f) => ["critical", "high"].includes(f.severity)).map((f) => f.description).join(", ")}`;

      const suggestedActions: string[] = [];
      if (flags.some((f) => f.rule === "spam_indicators")) suggestedActions.push("Reduce repetitive characters and excessive caps");
      if (flags.some((f) => f.rule === "excessive_hashtags")) suggestedActions.push("Reduce to 10-15 relevant hashtags");
      if (flags.some((f) => f.rule === "false_claims")) suggestedActions.push("Remove unsubstantiated claims and add disclaimers");
      if (flags.some((f) => f.rule === "copyright")) suggestedActions.push("Remove copyright notices unless you own the content");
      if (flags.some((f) => f.rule === "personal_info")) suggestedActions.push("Remove phone numbers and email addresses");

      logger.debug({ flagCount: flags.length, overallSeverity }, "ModerationEngine: scan complete");
      return { text: text.substring(0, 200), passed, overallSeverity, flags, score: Math.min(100, score), recommendation, suggestedActions };
    } catch (err) {
      logger.error({ err }, "ModerationEngine.scan error");
      return { text: text.substring(0, 200), passed: false, overallSeverity: "high", flags: [], score: 0, recommendation: "Moderation error", suggestedActions: [] };
    }
  }

  batchScan(items: string[]): ModerationResult[] {
    return items.map((t) => this.scan(t));
  }

  getRules(): Omit<ModerationRule, "patterns">[] {
    return MODERATION_RULES.map(({ id, description, severity }) => ({ id, description, severity }));
  }
}
