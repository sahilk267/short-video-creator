import path from "node:path";
import fs from "node:fs";
import type { PlatformType } from "../types/shorts";
import type { PlatformLimits, PublishParams } from "./PlatformPublisher";

const DEFAULT_LIMITS: Record<PlatformType, PlatformLimits> = {
  youtube: {
    maxFileSizeMB: 256 * 1024,
    maxDurationSeconds: 12 * 3600,
    maxTitleLength: 100,
    maxDescriptionLength: 5000,
    maxTagCount: 500,
    maxTagLength: 30,
    supportedFormats: ["mp4", "mov", "avi", "wmv", "flv", "webm"],
  },
  telegram: {
    maxFileSizeMB: 2000,
    maxDurationSeconds: 3600,
    maxTitleLength: 256,
    maxDescriptionLength: 1024,
    maxTagCount: 0,
    maxTagLength: 0,
    supportedFormats: ["mp4"],
  },
  instagram: {
    maxFileSizeMB: 650,
    maxDurationSeconds: 3600,
    maxTitleLength: 0,
    maxDescriptionLength: 2200,
    maxTagCount: 30,
    maxTagLength: 100,
    supportedFormats: ["mp4"],
  },
  facebook: {
    maxFileSizeMB: 10 * 1024,
    maxDurationSeconds: 4 * 3600,
    maxTitleLength: 255,
    maxDescriptionLength: 63206,
    maxTagCount: 0,
    maxTagLength: 0,
    supportedFormats: ["mp4", "mov"],
  },
};

export function getPlatformLimits(platform: PlatformType): PlatformLimits {
  return DEFAULT_LIMITS[platform];
}

export function enforcePlatformMetadataLimits(
  platform: PlatformType,
  params: PublishParams,
): PublishParams {
  const limits = getPlatformLimits(platform);

  const title = limits.maxTitleLength > 0
    ? params.title.slice(0, limits.maxTitleLength)
    : params.title;

  const description = params.description.slice(0, limits.maxDescriptionLength);

  const tags = limits.maxTagCount > 0
    ? params.tags.slice(0, limits.maxTagCount).map((tag) => tag.slice(0, limits.maxTagLength))
    : [];

  return {
    ...params,
    title,
    description,
    tags,
  };
}

export function validatePublishPayload(
  platform: PlatformType,
  params: PublishParams,
): { valid: boolean; errors: string[] } {
  const limits = getPlatformLimits(platform);
  const errors: string[] = [];

  const ext = path.extname(params.videoFilePath).replace(".", "").toLowerCase();
  if (!limits.supportedFormats.includes(ext)) {
    errors.push(`Unsupported video format .${ext} for platform ${platform}`);
  }

  if (limits.maxTitleLength > 0 && params.title.length > limits.maxTitleLength) {
    errors.push(`title exceeds ${limits.maxTitleLength} characters`);
  }

  if (params.description.length > limits.maxDescriptionLength) {
    errors.push(`description exceeds ${limits.maxDescriptionLength} characters`);
  }

  if (limits.maxTagCount === 0 && params.tags.length > 0) {
    errors.push(`tags are not supported for ${platform}`);
  } else if (limits.maxTagCount > 0) {
    if (params.tags.length > limits.maxTagCount) {
      errors.push(`tag count exceeds ${limits.maxTagCount}`);
    }
    const overSizedTag = params.tags.find((tag) => tag.length > limits.maxTagLength);
    if (overSizedTag) {
      errors.push(`tag exceeds ${limits.maxTagLength} characters`);
    }
  }

  try {
    const stat = fs.statSync(params.videoFilePath);
    const sizeMB = stat.size / (1024 * 1024);
    if (sizeMB > limits.maxFileSizeMB) {
      errors.push(`file size ${sizeMB.toFixed(2)}MB exceeds ${limits.maxFileSizeMB}MB`);
    }
  } catch {
    errors.push("video file not found or inaccessible");
  }

  return { valid: errors.length === 0, errors };
}
