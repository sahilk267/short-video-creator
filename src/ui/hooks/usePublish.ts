/**
 * usePublish Hook - Custom hook for publishing videos to multiple platforms
 */

import { useState, useCallback } from "react";
import { api } from "../services/apiClient";
import { useNotification } from "../store/uiStore";
import { PlatformMetadata, ScheduleConfig } from "../pages/PublishDashboard";

export interface PublishRequest {
  videoIds: string[];
  platforms: string[];
  metadata: PlatformMetadata;
  schedule: ScheduleConfig;
}

export interface PublishResponse {
  jobIds: string[];
  status: "queued" | "processing" | "completed";
  totalVideos: number;
  totalPlatforms: number;
}

interface ChannelConfigRecord {
  id: string;
  category: string;
  platform: string;
  channelId: string;
  createdAt: string;
}

interface SingleJobPayload {
  renderOutputPath: string;
  platform: string;
  channelId: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  language: string;
  scheduleAt?: string;
}

function buildJobPayload(
  platform: string,
  meta: PlatformMetadata,
  channelId: string,
  schedule: ScheduleConfig,
): SingleJobPayload {
  const m = (meta as Record<string, Record<string, unknown>>)[platform] ?? {};

  let title = "";
  let description = "";
  let tags: string[] = [];
  let category = "General";

  switch (platform) {
    case "youtube":
      title = String(m.title ?? "");
      description = String(m.description ?? "");
      tags = Array.isArray(m.tags) ? (m.tags as string[]) : [];
      category = String(m.categoryId ?? "General");
      break;
    case "facebook":
      title = String(m.title ?? "");
      description = String(m.description ?? "");
      tags = Array.isArray(m.hashtags) ? (m.hashtags as string[]) : [];
      break;
    case "instagram":
    case "telegram": {
      const caption = String(m.caption ?? "");
      title = caption.split("\n")[0] || platform;
      description = caption;
      tags = Array.isArray(m.hashtags) ? (m.hashtags as string[]) : [];
      break;
    }
  }

  return {
    renderOutputPath: "",
    platform,
    channelId,
    title,
    description,
    tags,
    category,
    language: "en",
    scheduleAt: schedule.publishImmediately
      ? undefined
      : `${schedule.scheduledDate}T${schedule.scheduledTime}`,
  };
}

interface UsePublishState {
  loading: boolean;
  error: string | null;
  data: PublishResponse | null;
  reset: () => void;
}

export const usePublish = (): [
  (request: PublishRequest) => Promise<PublishResponse | null>,
  UsePublishState
] => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublishResponse | null>(null);
  const { success: successNotification, error: errorNotification } = useNotification();

  const execute = useCallback(
    async (request: PublishRequest): Promise<PublishResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        // Validate request
        if (request.videoIds.length === 0) {
          throw new Error("No videos selected for publishing");
        }
        if (request.platforms.length === 0) {
          throw new Error("No platforms selected for publishing");
        }

        // Validate metadata
        const missingMetadata = request.platforms.some((platform) => {
          const platformKey = platform as keyof PlatformMetadata;
          const metadata = request.metadata[platformKey] as
            | Record<string, unknown>
            | undefined;

          if (!metadata) {
            return true;
          }

          // Check required fields per platform
          if (platform === "youtube") {
            return !metadata.title || !metadata.description;
          }
          if (platform === "instagram") {
            return !metadata.caption;
          }
          if (platform === "facebook") {
            return !metadata.title || !metadata.description;
          }
          if (platform === "telegram") {
            return !metadata.caption;
          }

          return false;
        });

        if (missingMetadata) {
          throw new Error("Some platforms are missing required metadata");
        }

        // Validate schedule if scheduled
        if (!request.schedule.publishImmediately) {
          if (!request.schedule.scheduledDate || !request.schedule.scheduledTime) {
            throw new Error("Schedule date and time are required for scheduled publishing");
          }

          const scheduledDateTime = new Date(`${request.schedule.scheduledDate}T${request.schedule.scheduledTime}`);
          if (scheduledDateTime < new Date()) {
            throw new Error("Scheduled time must be in the future");
          }
        }

        // Resolve channel mappings (category → platform → channelId) once.
        let channelConfigs: ChannelConfigRecord[] = [];
        try {
          channelConfigs = (await api.channels.list()) as ChannelConfigRecord[];
        } catch {
          channelConfigs = [];
        }

        const channelFor = (platform: string): string => {
          const match = channelConfigs.find((c) => c.platform === platform);
          return match?.channelId || "default";
        };

        // The backend accepts one publish job per (video, platform) pair.
        const jobIds: string[] = [];
        const skipped: string[] = [];

        for (const videoId of request.videoIds) {
          for (const platform of request.platforms) {
            const payload = buildJobPayload(platform, request.metadata, channelFor(platform), request.schedule);

            const pathResult = await api.videos
              .getRenderPath(videoId)
              .catch(() => null);
            if (!pathResult?.path) {
              skipped.push(videoId);
              continue;
            }
            payload.renderOutputPath = pathResult.path;

            const response = (await api.publish.enqueue(payload)) as {
              publishJobId: string;
              status: string;
            } | null;
            if (response?.publishJobId) {
              jobIds.push(response.publishJobId);
            }
          }
        }

        if (jobIds.length === 0) {
          if (skipped.length > 0) {
            throw new Error("Selected videos have no rendered file — publish requires a rendered video");
          }
          throw new Error("No publish jobs were created");
        }

        // Handle response
        const resultData: PublishResponse = {
          jobIds,
          status: "queued",
          totalVideos: jobIds.length,
          totalPlatforms: request.platforms.length,
        };

        setData(resultData);

        // Show success notification
        successNotification(`Successfully queued ${jobIds.length} publish job(s)`, 6000);

        return resultData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to publish videos";
        setError(errorMessage);

        // Show error notification
        errorNotification(errorMessage, 6000);

        return null;
      } finally {
        setLoading(false);
      }
    },
    [successNotification, errorNotification]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return [
    execute,
    {
      loading,
      error,
      data,
      reset,
    },
  ];
};

export default usePublish;
