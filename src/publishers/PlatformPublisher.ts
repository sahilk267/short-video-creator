/**
 * PlatformPublisher – Enhanced interface with all advanced fields
 */
import type { PlatformType } from "../types/shorts";

export interface PublishParams {
  videoFilePath: string;
  videoUrl?: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  language: string;
  thumbnailPath?: string;
  thumbnailUrl?: string;
  scheduleAt?: Date;
  callToAction?: string;
  aspectRatio?: string;
  visibility?: "public" | "private" | "unlisted";
  location?: string;
  firstComment?: string;
}

export interface PublishResult {
  success: boolean;
  externalId?: string;
  platformVideoId?: string;
  publishedUrl?: string;
  scheduledFor?: string;
  error?: string;
  rateLimitResetAt?: Date;
  credentialsValid?: boolean;
}

export interface PlatformLimits {
  maxFileSizeMB: number;
  maxDurationSeconds: number;
  maxTitleLength: number;
  maxDescriptionLength: number;
  maxTagCount: number;
  maxTagLength: number;
  supportedFormats: string[];
  aspectRatios?: string[];
  maxFrameRate?: number;
}

export interface PlatformCapabilities {
  supportsScheduling: boolean;
  supportsReels: boolean;
  supportsCarousel: boolean;
  supportsStories: boolean;
  supportsLive: boolean;
  supportsThumbnailUpload: boolean;
  supportsFirstComment: boolean;
  maxHashtags: number;
}

export interface PlatformPublisher {
  platform: PlatformType;
  uploadVideo(params: PublishParams): Promise<PublishResult>;
  scheduleVideo(params: PublishParams, publishAt: Date): Promise<PublishResult>;
  refreshToken(): Promise<void>;
  validateCredentials(): Promise<boolean>;
  getVideoLimits(): PlatformLimits;
  getCapabilities?(): PlatformCapabilities;
}
