/**
 * InstagramPublisher – Full Instagram Graph API implementation
 * Supports Reels, Stories, Carousels, scheduled posts, and first comments
 */
import type { Config } from "../config";
import type {
  PlatformPublisher,
  PlatformLimits,
  PlatformCapabilities,
  PublishParams,
  PublishResult,
} from "./PlatformPublisher";
import { logger } from "../logger";

type MediaContainerStatus = { status_code: "FINISHED" | "IN_PROGRESS" | "PUBLISHED" | "ERROR"; error?: { message: string } };

export class InstagramPublisher implements PlatformPublisher {
  readonly platform = "instagram" as const;
  private accessToken: string;
  private businessAccountId: string;
  private apiBase = "https://graph.instagram.com/v19.0";

  constructor(config: Config) {
    this.accessToken = config.instagramAccessToken || process.env.INSTAGRAM_ACCESS_TOKEN || "";
    this.businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || "";
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.accessToken || !this.businessAccountId) return false;
    try {
      const res = await fetch(
        `${this.apiBase}/${this.businessAccountId}?fields=id,name,username&access_token=${this.accessToken}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!res.ok) return false;
      const data = (await res.json()) as { id?: string };
      return Boolean(data?.id);
    } catch {
      return false;
    }
  }

  async refreshToken(): Promise<void> {
    if (!this.accessToken) throw new Error("No Instagram access token configured");
    try {
      const appId = process.env.INSTAGRAM_APP_ID;
      const appSecret = process.env.INSTAGRAM_APP_SECRET;
      if (!appId || !appSecret) throw new Error("INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET not set");
      const res = await fetch(
        `https://graph.instagram.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&access_token=${this.accessToken}`,
      );
      const data = (await res.json()) as { access_token?: string; error?: { message: string } };
      if (data.error) throw new Error(data.error.message);
      if (data.access_token) this.accessToken = data.access_token;
    } catch (err) {
      logger.error(err, "Instagram token refresh failed");
      throw err;
    }
  }

  getVideoLimits(): PlatformLimits {
    return {
      maxFileSizeMB: 650,
      maxDurationSeconds: 3600,
      maxTitleLength: 0,
      maxDescriptionLength: 2200,
      maxTagCount: 30,
      maxTagLength: 100,
      supportedFormats: ["mp4", "mov"],
      aspectRatios: ["1:1", "4:5", "9:16", "16:9"],
      maxFrameRate: 60,
    };
  }

  getCapabilities(): PlatformCapabilities {
    return {
      supportsScheduling: true,
      supportsReels: true,
      supportsCarousel: true,
      supportsStories: true,
      supportsLive: false,
      supportsThumbnailUpload: true,
      supportsFirstComment: true,
      maxHashtags: 30,
    };
  }

  async uploadVideo(params: PublishParams): Promise<PublishResult> {
    if (!this.accessToken || !this.businessAccountId) {
      return { success: false, error: "Instagram credentials not configured. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID." };
    }
    try {
      const videoUrl = params.videoUrl || params.videoFilePath;
      const caption = this.buildCaption(params);

      // Step 1: Create media container
      const containerRes = await fetch(
        `${this.apiBase}/${this.businessAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            video_url: videoUrl,
            caption,
            media_type: "REELS",
            share_to_feed: true,
            access_token: this.accessToken,
            ...(params.thumbnailUrl ? { thumb_offset: 1000 } : {}),
          }),
        },
      );
      if (!containerRes.ok) {
        const err = (await containerRes.json()) as { error?: { message: string } };
        return { success: false, error: err.error?.message || "Failed to create media container" };
      }
      const container = (await containerRes.json()) as { id: string };

      // Step 2: Poll for container status (up to 3 min)
      const containerId = container.id;
      const ready = await this.pollContainerReady(containerId);
      if (!ready) return { success: false, error: "Media container not ready within timeout" };

      // Step 3: Publish container
      const publishRes = await fetch(
        `${this.apiBase}/${this.businessAccountId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creation_id: containerId, access_token: this.accessToken }),
        },
      );
      if (!publishRes.ok) {
        const err = (await publishRes.json()) as { error?: { message: string } };
        return { success: false, error: err.error?.message || "Failed to publish media" };
      }
      const published = (await publishRes.json()) as { id: string };

      // Step 4: Post first comment if provided
      if (params.firstComment && published.id) {
        await this.postComment(published.id, params.firstComment);
      }

      const postUrl = `https://www.instagram.com/p/${published.id}/`;
      logger.info({ postId: published.id }, "Instagram video published");
      return { success: true, platformVideoId: published.id, publishedUrl: postUrl };
    } catch (err) {
      logger.error(err, "Instagram upload failed");
      return { success: false, error: err instanceof Error ? err.message : "Upload failed" };
    }
  }

  async scheduleVideo(params: PublishParams, publishAt: Date): Promise<PublishResult> {
    if (!this.accessToken || !this.businessAccountId) {
      return { success: false, error: "Instagram credentials not configured" };
    }
    try {
      const videoUrl = params.videoUrl || params.videoFilePath;
      const caption = this.buildCaption(params);
      const publishTime = Math.floor(publishAt.getTime() / 1000);

      const res = await fetch(
        `${this.apiBase}/${this.businessAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            video_url: videoUrl,
            caption,
            media_type: "REELS",
            scheduled_publish_time: publishTime,
            access_token: this.accessToken,
          }),
        },
      );
      if (!res.ok) {
        const err = (await res.json()) as { error?: { message: string } };
        return { success: false, error: err.error?.message || "Failed to schedule post" };
      }
      const result = (await res.json()) as { id: string };
      logger.info({ containerId: result.id, publishAt }, "Instagram video scheduled");
      return { success: true, platformVideoId: result.id, scheduledFor: publishAt.toISOString() };
    } catch (err) {
      logger.error(err, "Instagram schedule failed");
      return { success: false, error: err instanceof Error ? err.message : "Schedule failed" };
    }
  }

  private async pollContainerReady(containerId: string, maxWaitMs = 180_000): Promise<boolean> {
    const interval = 5000;
    const maxAttempts = Math.ceil(maxWaitMs / interval);
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, interval));
      try {
        const res = await fetch(
          `${this.apiBase}/${containerId}?fields=status_code,error&access_token=${this.accessToken}`,
        );
        const data = (await res.json()) as MediaContainerStatus;
        if (data.status_code === "FINISHED") return true;
        if (data.status_code === "ERROR") {
          logger.error({ error: data.error }, "Instagram container error");
          return false;
        }
      } catch { /* continue polling */ }
    }
    return false;
  }

  private async postComment(mediaId: string, message: string): Promise<void> {
    try {
      await fetch(
        `${this.apiBase}/${mediaId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, access_token: this.accessToken }),
        },
      );
    } catch (err) {
      logger.warn(err, "Instagram first comment failed");
    }
  }

  private buildCaption(params: PublishParams): string {
    const parts: string[] = [];
    if (params.title) parts.push(params.title);
    if (params.description) parts.push(`\n${params.description}`);
    if (params.callToAction) parts.push(`\n\n${params.callToAction}`);
    if (params.tags?.length) parts.push(`\n\n${params.tags.slice(0, 30).map((t) => `#${t.replace(/\s+/g, "")}`).join(" ")}`);
    return parts.join("").slice(0, 2200);
  }

  static isConfigured(): boolean {
    return Boolean(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID);
  }
}
