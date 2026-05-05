import { logger } from "../logger";

export interface VideoValidationInput {
  durationSec?: number;
  aspectRatio?: string;
  resolution?: string;
  fileSizeMb?: number;
  platform: string;
  hasAudio?: boolean;
  hasCaptions?: boolean;
  hasTitle?: boolean;
  title?: string;
  hasDescription?: boolean;
}

export interface ImageValidationInput {
  width?: number;
  height?: number;
  fileSizeMb?: number;
  format?: string;
  platform: string;
}

export interface MetadataValidationInput {
  title?: string;
  description?: string;
  tags?: string[];
  platform: string;
}

export interface ValidationIssue {
  field: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  score: number;
  summary: string;
}

const PLATFORM_RULES: Record<string, {
  durationMin?: number; durationMax?: number;
  aspectRatios: string[]; maxFileSizeMb?: number;
  titleMaxChars?: number; descMaxChars?: number;
  maxTags?: number;
}> = {
  tiktok: { durationMin: 1, durationMax: 600, aspectRatios: ["9:16", "1:1"], maxFileSizeMb: 287, titleMaxChars: 2200 },
  instagram: { durationMin: 3, durationMax: 90, aspectRatios: ["9:16", "1:1", "4:5"], maxFileSizeMb: 250, titleMaxChars: 2200 },
  youtube: { durationMin: 1, durationMax: 43200, aspectRatios: ["16:9", "9:16"], maxFileSizeMb: 256000, titleMaxChars: 100, descMaxChars: 5000, maxTags: 500 },
  youtube_shorts: { durationMin: 1, durationMax: 60, aspectRatios: ["9:16"], maxFileSizeMb: 256000, titleMaxChars: 100 },
  linkedin: { durationMin: 3, durationMax: 600, aspectRatios: ["16:9", "1:1", "9:16"], maxFileSizeMb: 200 },
  facebook: { durationMin: 1, durationMax: 14400, aspectRatios: ["16:9", "9:16", "1:1"], maxFileSizeMb: 10240 },
  x: { durationMin: 0.5, durationMax: 140, aspectRatios: ["16:9", "9:16", "1:1"], maxFileSizeMb: 512 },
  telegram: { durationMax: 3600, aspectRatios: ["16:9", "9:16", "1:1"], maxFileSizeMb: 2000 },
};

export class ValidationEngine {
  validateVideo(input: VideoValidationInput): ValidationResult {
    try {
      const issues: ValidationIssue[] = [];
      const rules = PLATFORM_RULES[input.platform] || PLATFORM_RULES.youtube;

      if (input.durationSec !== undefined) {
        if (rules.durationMin && input.durationSec < rules.durationMin) {
          issues.push({ field: "duration", severity: "error", message: `Video too short: ${input.durationSec}s (min ${rules.durationMin}s for ${input.platform})`, suggestion: "Extend video duration" });
        }
        if (rules.durationMax && input.durationSec > rules.durationMax) {
          issues.push({ field: "duration", severity: "error", message: `Video too long: ${input.durationSec}s (max ${rules.durationMax}s for ${input.platform})`, suggestion: "Trim video duration" });
        }
      }

      if (input.aspectRatio && !rules.aspectRatios.includes(input.aspectRatio)) {
        issues.push({ field: "aspectRatio", severity: "error", message: `Aspect ratio ${input.aspectRatio} not supported on ${input.platform}`, suggestion: `Use one of: ${rules.aspectRatios.join(", ")}` });
      }

      if (input.fileSizeMb !== undefined && rules.maxFileSizeMb && input.fileSizeMb > rules.maxFileSizeMb) {
        issues.push({ field: "fileSize", severity: "error", message: `File too large: ${input.fileSizeMb}MB (max ${rules.maxFileSizeMb}MB)`, suggestion: "Compress the video" });
      }

      if (!input.hasAudio) issues.push({ field: "audio", severity: "warning", message: "No audio detected", suggestion: "Add background music or voiceover" });
      if (!input.hasCaptions) issues.push({ field: "captions", severity: "info", message: "No captions/subtitles", suggestion: "Add captions for accessibility and engagement" });
      if (!input.hasTitle || !input.title) issues.push({ field: "title", severity: "error", message: "Title is required", suggestion: "Add a descriptive title" });
      if (input.title && rules.titleMaxChars && input.title.length > rules.titleMaxChars) {
        issues.push({ field: "title", severity: "error", message: `Title too long: ${input.title.length} chars (max ${rules.titleMaxChars})`, suggestion: "Shorten the title" });
      }

      return this.buildResult(issues);
    } catch (err) {
      logger.error({ err }, "ValidationEngine.validateVideo error");
      return { valid: false, issues: [{ field: "system", severity: "error", message: "Validation error" }], score: 0, summary: "Validation error" };
    }
  }

  validateMetadata(input: MetadataValidationInput): ValidationResult {
    const issues: ValidationIssue[] = [];
    const rules = PLATFORM_RULES[input.platform] || PLATFORM_RULES.youtube;

    if (!input.title || input.title.trim().length === 0) {
      issues.push({ field: "title", severity: "error", message: "Title is required", suggestion: "Add a compelling title" });
    } else if (rules.titleMaxChars && input.title.length > rules.titleMaxChars) {
      issues.push({ field: "title", severity: "error", message: `Title too long (${input.title.length}/${rules.titleMaxChars} chars)` });
    } else if (input.title.length < 10) {
      issues.push({ field: "title", severity: "warning", message: "Title is very short", suggestion: "Use 30-70 characters for best SEO" });
    }

    if (!input.description || input.description.trim().length === 0) {
      issues.push({ field: "description", severity: "warning", message: "Description is missing", suggestion: "Add a detailed description for SEO" });
    }

    if (input.tags) {
      if (input.tags.length === 0) issues.push({ field: "tags", severity: "info", message: "No tags added", suggestion: "Add 5-15 relevant tags" });
      if (rules.maxTags && input.tags.length > rules.maxTags) issues.push({ field: "tags", severity: "error", message: `Too many tags: ${input.tags.length} (max ${rules.maxTags})` });
    }

    return this.buildResult(issues);
  }

  validateImage(input: ImageValidationInput): ValidationResult {
    const issues: ValidationIssue[] = [];
    const FORMATS = ["jpg", "jpeg", "png", "webp", "gif"];
    if (input.format && !FORMATS.includes(input.format.toLowerCase())) {
      issues.push({ field: "format", severity: "error", message: `Unsupported format: ${input.format}`, suggestion: `Use ${FORMATS.join(", ")}` });
    }
    if (input.fileSizeMb !== undefined && input.fileSizeMb > 30) {
      issues.push({ field: "fileSize", severity: "warning", message: `Large image: ${input.fileSizeMb}MB`, suggestion: "Compress to under 5MB for faster loading" });
    }
    if (input.width && input.height) {
      if (input.width < 400) issues.push({ field: "resolution", severity: "warning", message: "Image width is low", suggestion: "Use at least 400px width" });
    }
    return this.buildResult(issues);
  }

  private buildResult(issues: ValidationIssue[]): ValidationResult {
    const errors = issues.filter((i) => i.severity === "error").length;
    const warnings = issues.filter((i) => i.severity === "warning").length;
    const valid = errors === 0;
    const score = Math.max(0, 100 - errors * 25 - warnings * 10);
    const summary = valid
      ? warnings > 0 ? `Passed with ${warnings} warning(s)` : "All checks passed"
      : `Failed: ${errors} error(s), ${warnings} warning(s)`;
    return { valid, issues, score, summary };
  }

  getSupportedPlatforms(): string[] { return Object.keys(PLATFORM_RULES); }
}
