/**
 * InstagramPublisher – Phase 5.5 (stub)
 *
 * Placeholder for Instagram Graph API publish flow.
 * The official Instagram API requires a Facebook Business App approval.
 * Replace the stub once credentials are provisioned.
 */
import type { Config } from "../config";
import type { PlatformPublisher, PlatformLimits, PublishParams, PublishResult } from "./PlatformPublisher";

export class InstagramPublisher implements PlatformPublisher {
  readonly platform = "instagram" as const;

  constructor(_config: Config) {}

  async validateCredentials(): Promise<boolean> {
    return false;
  }

  async refreshToken(): Promise<void> {
    throw new Error("InstagramPublisher: not implemented");
  }

  getVideoLimits(): PlatformLimits {
    return {
      maxFileSizeMB: 650,
      maxDurationSeconds: 3600,
      maxTitleLength: 0,
      maxDescriptionLength: 2200,
      maxTagCount: 30,
      maxTagLength: 100,
      supportedFormats: ["mp4"],
    };
  }

  async uploadVideo(_params: PublishParams): Promise<PublishResult> {
    return {
      success: false,
      error: "InstagramPublisher: not implemented. Awaiting Graph API approval.",
    };
  }

  async scheduleVideo(_params: PublishParams, _publishAt: Date): Promise<PublishResult> {
    return this.uploadVideo(_params);
  }
}
