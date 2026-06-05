/**
 * PublisherFactory – Phase 5.2
 *
 * Instantiates the right PlatformPublisher implementation for a given platform.
 */
import type { Config } from "../config";
import type { PlatformType } from "../types/shorts";
import type { PlatformPublisher } from "./PlatformPublisher";

type PublisherConfig = Config & {
  linkedinAccessToken?: string;
  linkedinPersonUrn?: string;
  xBearerToken?: string;
  xApiKey?: string;
  xApiSecret?: string;
  xAccessToken?: string;
  xAccessSecret?: string;
};
import { YouTubePublisher } from "./YouTubePublisher";
import { TelegramPublisher } from "./TelegramPublisher";
import { InstagramPublisher } from "./InstagramPublisher";
import { FacebookPublisher } from "./FacebookPublisher";
import { LinkedInPublisher } from "./LinkedInPublisher";
import { XTwitterPublisher } from "./XTwitterPublisher";

export function createPublisher(platform: PlatformType, config: Config): PlatformPublisher {
  const publisherConfig = config as PublisherConfig;
  switch (platform) {
    case "youtube":
      return new YouTubePublisher(config);
    case "telegram":
      return new TelegramPublisher(config);
    case "instagram":
      return new InstagramPublisher(config);
    case "facebook":
      return new FacebookPublisher(config);
    case "linkedin":
      return new LinkedInPublisher(
        publisherConfig.linkedinAccessToken || "",
        publisherConfig.linkedinPersonUrn || "",
      );
    case "x":
      return new XTwitterPublisher({
        bearerToken: publisherConfig.xBearerToken || "",
        apiKey: publisherConfig.xApiKey || "",
        apiSecret: publisherConfig.xApiSecret || "",
        accessToken: publisherConfig.xAccessToken || "",
        accessSecret: publisherConfig.xAccessSecret || "",
      });
    default: {
      const _exhaustive: never = platform;
      throw new Error(`Unknown platform: ${String(_exhaustive)}`);
    }
  }
}
