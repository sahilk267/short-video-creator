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
          const metadata = request.metadata[platformKey];

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

        // Call API
        const response = await api.publish.enqueue({
          videoIds: request.videoIds,
          platforms: request.platforms,
          metadata: request.metadata,
          publishImmediately: request.schedule.publishImmediately,
          scheduledDateTime: request.schedule.publishImmediately
            ? undefined
            : `${request.schedule.scheduledDate}T${request.schedule.scheduledTime}`,
          timezone: request.schedule.timezone,
        });

        // Handle response
        const resultData: PublishResponse = {
          jobIds: response.jobIds || [],
          status: response.status || "queued",
          totalVideos: request.videoIds.length,
          totalPlatforms: request.platforms.length,
        };

        setData(resultData);

        // Show success notification
        successNotification(`Successfully queued ${request.videoIds.length} video(s) for ${request.platforms.length} platform(s)`, 6000);

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
