import axios from "axios";
import fs from "fs-extra";
import { logger } from "../logger";
import { getPlatformLimits } from "./PlatformLimits";
import type { PlatformPublisher, PublishParams, PublishResult, PlatformLimits } from "./PlatformPublisher";

export class LinkedInPublisher implements PlatformPublisher {
  platform = "linkedin" as const;
  private accessToken: string;
  private personUrn: string;

  constructor(accessToken: string, personUrn: string = "") {
    this.accessToken = accessToken;
    this.personUrn = personUrn;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    };
  }

  private async registerAndUpload(params: PublishParams): Promise<string> {
    const regRes = await axios.post(
      "https://api.linkedin.com/v2/assets?action=registerUpload",
      {
        registerUploadRequest: {
          owner: this.personUrn,
          recipes: ["urn:li:digitalmediaRecipe:feedshare-video"],
          serviceRelationships: [{ identifier: "urn:li:userGeneratedContent", relationshipType: "OWNER" }],
          supportedUploadMechanism: ["MULTIPART_UPLOAD"],
        },
      },
      { headers: this.headers },
    );

    const uploadUrl = regRes.data.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
    const asset = regRes.data.value?.asset;
    if (!uploadUrl || !asset) throw new Error("LinkedIn: Failed to register upload");

    const fileBuffer = await fs.readFile(params.videoFilePath);
    await axios.put(uploadUrl, fileBuffer, { headers: { "Content-Type": "video/mp4" }, maxBodyLength: Infinity });
    return asset;
  }

  async uploadVideo(params: PublishParams): Promise<PublishResult> {
    try {
      const asset = await this.registerAndUpload(params);
      const postRes = await axios.post(
        "https://api.linkedin.com/v2/ugcPosts",
        {
          author: this.personUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: `${params.title}\n\n${params.description}` },
              shareMediaCategory: "VIDEO",
              media: [{
                status: "READY",
                description: { text: params.description.substring(0, 200) },
                media: asset,
                title: { text: params.title },
              }],
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        },
        { headers: this.headers },
      );
      const postId = postRes.data.id;
      logger.info({ postId }, "LinkedIn video published");
      return { success: true, platformVideoId: postId, publishedUrl: `https://linkedin.com/feed/update/${postId}` };
    } catch (err: unknown) {
      logger.error({ err }, "LinkedIn publish failed");
      return { success: false, error: (err as Error).message };
    }
  }

  async scheduleVideo(params: PublishParams, publishAt: Date): Promise<PublishResult> {
    logger.info({ platform: "linkedin", publishAt }, "LinkedIn scheduling not supported natively — publishing now");
    return this.uploadVideo(params);
  }

  async refreshToken(): Promise<void> {
    logger.info("LinkedIn token refresh not implemented — use OAuth flow");
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      await axios.get("https://api.linkedin.com/v2/me", { headers: this.headers, timeout: 5000 });
      return true;
    } catch { return false; }
  }

  getVideoLimits(): PlatformLimits {
    return getPlatformLimits("linkedin");
  }

  static isConfigured(config: { linkedinAccessToken?: string }): boolean {
    return Boolean(config.linkedinAccessToken);
  }
}
