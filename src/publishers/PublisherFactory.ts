/**
 * PublisherFactory – Phase 5.2
 *
 * Instantiates the right PlatformPublisher implementation for a given platform.
 */
import type { Config } from "../config";
import type { PlatformType } from "../types/shorts";
import type { PlatformPublisher } from "./PlatformPublisher";
import { YouTubePublisher } from "./YouTubePublisher";
import { TelegramPublisher } from "./TelegramPublisher";
import { InstagramPublisher } from "./InstagramPublisher";
import { FacebookPublisher } from "./FacebookPublisher";

export function createPublisher(platform: PlatformType, config: Config): PlatformPublisher {
  switch (platform) {
    case "youtube":
      return new YouTubePublisher(config);
    case "telegram":
      return new TelegramPublisher(config);
    case "instagram":
      return new InstagramPublisher(config);
    case "facebook":
      return new FacebookPublisher(config);
    default: {
      const _exhaustive: never = platform;
      throw new Error(`Unknown platform: ${String(_exhaustive)}`);
    }
  }
}
