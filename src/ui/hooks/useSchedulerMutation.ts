/**
 * useSchedulerMutation Hook – enqueue render jobs and manage queue actions
 */

import { useState, useCallback } from "react";
import { api } from "../services/apiClient";
import { useNotification } from "../store/uiStore";

export interface EnqueueJobRequest {
  category: string;
  orientation: "portrait" | "landscape";
  videoType: "short" | "long";
  subtitleLanguage: string;
  sceneText: string;
  subcategory: string;
  keywords: string;
  searchTerms: string;
}

export interface EnqueueJobResponse {
  renderJobId: string;
}

interface MutationState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

export function useEnqueueJob() {
  const [state, setState] = useState<MutationState<EnqueueJobResponse>>({
    loading: false,
    error: null,
    data: null,
  });
  const { success: notify, error: notifyError } = useNotification();

  const enqueue = useCallback(
    async (request: EnqueueJobRequest): Promise<EnqueueJobResponse | null> => {
      setState({ loading: true, error: null, data: null });
      try {
        const sceneInput = [
          {
            text: request.sceneText || `Auto content for ${request.category}`,
            subcategory: request.subcategory || undefined,
            keywords: request.keywords.split(",").map((s) => s.trim()).filter(Boolean),
            searchTerms: request.searchTerms.split(",").map((s) => s.trim()).filter(Boolean),
            language: request.subtitleLanguage || "en",
          },
        ];

        const response = (await api.queue.bulkEnqueue({
          sceneInput,
          orientation: request.orientation,
          category: request.category,
          videoType: request.videoType,
          subtitleLanguage: request.subtitleLanguage,
        })) as EnqueueJobResponse;

        setState({ loading: false, error: null, data: response });
        notify(`Job enqueued: ${response.renderJobId}`);
        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to enqueue job";
        setState({ loading: false, error: message, data: null });
        notifyError(message);
        return null;
      }
    },
    [notify, notifyError]
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  return { enqueue, reset, ...state };
}
