/**
 * FacebookPublisher – Phase 5.6 (stub)
 *
 * Placeholder for Facebook Graph API video upload.
 * Replace stub once PAGE_ACCESS_TOKEN is provisioned.
 */
import type { Config } from "../config";
import type { PlatformPublisher, PlatformLimits, PublishParams, PublishResult } from "./PlatformPublisher";

export class FacebookPublisher implements PlatformPublisher {
  readonly platform = "facebook" as const;

  constructor(_config: Config) {}

  async validateCredentials(): Promise<boolean> {
    return false;
  }

  async refreshToken(): Promise<void> {
    throw new Error("FacebookPublisher: not implemented");
  }

  getVideoLimits(): PlatformLimits {
    return {
      maxFileSizeMB: 10 * 1024, // 10 GB
      maxDurationSeconds: 4 * 3600, // 4 hours
      maxTitleLength: 255,
      maxDescriptionLength: 63206,
      maxTagCount: 0,
      maxTagLength: 0,
      supportedFormats: ["mp4", "mov"],
    };
  }

  async uploadVideo(_params: PublishParams): Promise<PublishResult> {
    return {
      success: false,
      error: "FacebookPublisher: not implemented. Provide PAGE_ACCESS_TOKEN to enable.",
    };
  }

  async scheduleVideo(_params: PublishParams, _publishAt: Date): Promise<PublishResult> {
    return this.uploadVideo(_params);
  }
}
