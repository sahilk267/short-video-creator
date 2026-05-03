/**
 * Environment Variables Validation
 *
 * Call validateEnvironment() early in startup to:
 *   1. Catch missing required vars before the server boots
 *   2. Warn about missing optional-but-recommended vars
 *   3. Validate format of critical vars (URLs, numbers, etc.)
 */

import { logger } from "../logger";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvVar {
  key: string;
  required?: boolean;
  description?: string;
  format?: "url" | "number" | "boolean" | "cron" | "hex32";
  defaultValue?: string;
}

const ENV_SPEC: EnvVar[] = [
  // ── Core ──────────────────────────────────────────────────
  { key: "PEXELS_API_KEY", required: true, description: "Pexels API key for background video sourcing" },
  { key: "PORT", format: "number", defaultValue: "3123" },
  { key: "LOG_LEVEL", defaultValue: "info" },
  { key: "DATA_DIR_PATH", description: "Data storage directory" },

  // ── Whisper ────────────────────────────────────────────────
  { key: "WHISPER_MODEL", defaultValue: "base.en" },
  { key: "KOKORO_MODEL_PRECISION", defaultValue: "fp32" },

  // ── Performance ───────────────────────────────────────────
  { key: "CONCURRENCY", format: "number" },
  { key: "VIDEO_CACHE_SIZE_IN_BYTES", format: "number" },

  // ── Redis ──────────────────────────────────────────────────
  { key: "REDIS_ENABLED", format: "boolean", defaultValue: "false" },
  { key: "REDIS_HOST", defaultValue: "localhost" },
  { key: "REDIS_PORT", format: "number", defaultValue: "6379" },
  { key: "RENDER_WORKER_CONCURRENCY", format: "number" },
  { key: "PUBLISH_WORKER_CONCURRENCY", format: "number" },

  // ── AI / LLM ──────────────────────────────────────────────
  { key: "AI_LLM_URL", format: "url" },
  { key: "USE_AI_IMAGES", format: "boolean", defaultValue: "false" },

  // ── Publishing (optional, warn if missing and Redis is enabled) ──
  { key: "YOUTUBE_CLIENT_ID", description: "YouTube OAuth2 Client ID" },
  { key: "YOUTUBE_CLIENT_SECRET", description: "YouTube OAuth2 Client Secret" },
  { key: "TELEGRAM_BOT_TOKEN", description: "Telegram Bot token (@BotFather)" },
  { key: "INSTAGRAM_ACCESS_TOKEN", description: "Instagram Graph API access token" },
  { key: "FACEBOOK_ACCESS_TOKEN", description: "Facebook Graph API access token" },

  // ── Security ──────────────────────────────────────────────
  { key: "TENANT_KEYS_SECRET", description: "Secret for tenant API key signing" },
  { key: "JWT_SECRET", description: "JWT signing secret (>=32 chars)" },

  // ── Alerting ──────────────────────────────────────────────
  { key: "SLACK_WEBHOOK_URL", format: "url" },
  { key: "LIBRETRANSLATE_URL", format: "url" },
];

/**
 * Validates a URL string format
 */
function isValidUrl(val: string): boolean {
  try {
    new URL(val);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates cron expression format
 */
function isValidCron(val: string): boolean {
  const parts = val.trim().split(/\s+/);
  return parts.length === 5;
}

/**
 * Validates hex string of minimum length 32
 */
function isValidHex32(val: string): boolean {
  return /^[0-9a-fA-F]{32,}$/.test(val);
}

/**
 * Main validation function — call once at startup
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const spec of ENV_SPEC) {
    const val = process.env[spec.key];

    // Required check
    if (spec.required && (!val || val.trim() === "")) {
      errors.push(`[REQUIRED] ${spec.key} is not set. ${spec.description || ""}`);
      continue;
    }

    // Skip further validation if not set
    if (!val || val.trim() === "") continue;

    // Format validation
    switch (spec.format) {
      case "number":
        if (isNaN(parseInt(val, 10))) {
          errors.push(`[FORMAT] ${spec.key}="${val}" must be a number`);
        }
        break;
      case "boolean":
        if (!["true", "false"].includes(val.toLowerCase())) {
          warnings.push(`[FORMAT] ${spec.key}="${val}" should be "true" or "false"`);
        }
        break;
      case "url":
        if (!isValidUrl(val)) {
          warnings.push(`[FORMAT] ${spec.key}="${val}" does not look like a valid URL`);
        }
        break;
      case "cron":
        if (!isValidCron(val)) {
          errors.push(`[FORMAT] ${spec.key}="${val}" is not a valid cron expression (expected 5 parts)`);
        }
        break;
      case "hex32":
        if (!isValidHex32(val)) {
          warnings.push(`[SECURITY] ${spec.key} should be a 32+ char hex string. Generate with: openssl rand -hex 32`);
        }
        break;
    }
  }

  // ── Security-specific warnings ──────────────────────────────
  const tenantSecret = process.env.TENANT_KEYS_SECRET;
  if (tenantSecret && ["change-me-in-production", "change_me", "secret", "password"].includes(tenantSecret.toLowerCase())) {
    warnings.push("[SECURITY] TENANT_KEYS_SECRET is using an insecure default value. Generate a new secret.");
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    warnings.push("[SECURITY] JWT_SECRET should be at least 32 characters long.");
  }

  // ── Feature availability warnings ──────────────────────────
  const redisEnabled = process.env.REDIS_ENABLED === "true";
  if (redisEnabled) {
    if (!process.env.REDIS_HOST) {
      warnings.push("[REDIS] REDIS_ENABLED=true but REDIS_HOST is not set (defaulting to localhost)");
    }
  }

  if (process.env.USE_AI_IMAGES === "true" && !process.env.AI_LLM_URL) {
    warnings.push("[AI] USE_AI_IMAGES=true but AI_LLM_URL is not set");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Runs validation and logs results. Exits process on critical errors.
 */
export function runEnvironmentValidation(exitOnError = true): void {
  const result = validateEnvironment();

  if (result.errors.length > 0) {
    logger.error({ errors: result.errors }, "❌ Environment validation FAILED");
    result.errors.forEach((e) => logger.error(e));
    if (exitOnError) {
      logger.error("Fix the above errors in your .env file and restart.");
      process.exit(1);
    }
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach((w) => logger.warn(w));
  }

  if (result.valid) {
    logger.info("✅ Environment validation passed");
  }
}
