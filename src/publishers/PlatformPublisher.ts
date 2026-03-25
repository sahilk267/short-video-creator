/**
 * PlatformPublisher – Phase 5.2
 *
 * Abstract interface + shared types for all platform publishers.
 */
import type { PlatformType } from "../types/shorts";

export interface PublishParams {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  language: string;
  thumbnailPath?: string;
  scheduleAt?: Date;
}

export interface PublishResult {
  success: boolean;
  externalId?: string;
  publishedUrl?: string;
  error?: string;
}

export interface PlatformLimits {
  maxFileSizeMB: number;
  maxDurationSeconds: number;
  maxTitleLength: number;
  maxDescriptionLength: number;
  maxTagCount: number;
  maxTagLength: number;
  supportedFormats: string[];
}

export interface PlatformPublisher {
  platform: PlatformType;
  uploadVideo(params: PublishParams): Promise<PublishResult>;
  scheduleVideo(params: PublishParams, publishAt: Date): Promise<PublishResult>;
  refreshToken(): Promise<void>;
  validateCredentials(): Promise<boolean>;
  getVideoLimits(): PlatformLimits;
}
