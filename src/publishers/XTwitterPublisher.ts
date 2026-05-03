import axios from "axios";
import fs from "fs-extra";
import { logger } from "../logger";
import { getPlatformLimits } from "./PlatformLimits";
import type { PlatformPublisher, PublishParams, PublishResult, PlatformLimits } from "./PlatformPublisher";

export class XTwitterPublisher implements PlatformPublisher {
  platform = "x" as const;
  private bearerToken: string;
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string;
  private accessSecret: string;

  constructor(credentials: {
    bearerToken: string;
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  }) {
    this.bearerToken = credentials.bearerToken;
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    this.accessToken = credentials.accessToken;
    this.accessSecret = credentials.accessSecret;
  }

  private truncateText(text: string, maxLen = 280): string {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen - 3) + "...";
  }

  async uploadVideo(params: PublishParams): Promise<PublishResult> {
    try {
      const tweetText = this.truncateText(
        `${params.title}\n\n${params.description}\n\n${params.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}`,
      );

      let mediaId: string | undefined;
      try {
        const fileBuffer = await fs.readFile(params.videoFilePath);
        const mediaRes = await axios.post(
          "https://upload.twitter.com/1.1/media/upload.json",
          { media_data: fileBuffer.toString("base64"), media_type: "video/mp4" },
          { headers: { Authorization: `Bearer ${this.bearerToken}`, "Content-Type": "application/json" } },
        );
        mediaId = mediaRes.data.media_id_string;
      } catch { /* video upload optional — tweet text only */ }

      const body: Record<string, unknown> = { text: tweetText };
      if (mediaId) body.media = { media_ids: [mediaId] };

      const res = await axios.post("https://api.twitter.com/2/tweets", body, {
        headers: { Authorization: `Bearer ${this.bearerToken}`, "Content-Type": "application/json" },
      });

      const tweetId = res.data.data?.id;
      logger.info({ tweetId }, "X/Twitter post published");
      return { success: true, platformVideoId: tweetId, publishedUrl: `https://x.com/i/web/status/${tweetId}` };
    } catch (err: unknown) {
      logger.error({ err }, "X/Twitter publish failed");
      return { success: false, error: err instanceof Error ? err.message : "X/Twitter publish failed" };
    }
  }

  async scheduleVideo(params: PublishParams, publishAt: Date): Promise<PublishResult> {
    logger.info({ publishAt }, "X scheduling — publishing immediately");
    return this.uploadVideo(params);
  }

  async refreshToken(): Promise<void> {
    logger.info("X/Twitter OAuth2 token refresh not implemented");
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.bearerToken) return false;
    try {
      await axios.get("https://api.twitter.com/2/users/me", {
        headers: { Authorization: `Bearer ${this.bearerToken}` },
        timeout: 5000,
      });
      return true;
    } catch { return false; }
  }

  getVideoLimits(): PlatformLimits {
    return getPlatformLimits("x");
  }

  static isConfigured(config: { xApiKey?: string; xBearerToken?: string }): boolean {
    return Boolean(config.xApiKey && config.xBearerToken);
  }
}
