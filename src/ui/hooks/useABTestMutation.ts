/**
 * useABTestMutation Hook – create variants and assign them
 */

import { useState, useCallback } from "react";
import { apiClient } from "../services/apiClient";
import { useNotification } from "../store/uiStore";
import type { ABVariant } from "./useABTestResults";

export interface CreateVariantRequest {
  videoId: string;
  variantKey: string;
  title: string;
  thumbnail?: string;
}

interface MutationState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

export function useCreateVariant() {
  const [state, setState] = useState<MutationState<ABVariant>>({ loading: false, error: null, data: null });
  const { success: notify, error: notifyError } = useNotification();

  const createVariant = useCallback(
    async (request: CreateVariantRequest): Promise<ABVariant | null> => {
      setState({ loading: true, error: null, data: null });
      try {
        const response = await apiClient.post<ABVariant>("/api/marketing/ab/variants", request);
        setState({ loading: false, error: null, data: response });
        notify(`Variant "${request.variantKey}" created for video ${request.videoId.slice(0, 8)}…`);
        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create variant";
        setState({ loading: false, error: message, data: null });
        notifyError(message);
        return null;
      }
    },
    [notify, notifyError]
  );

  const reset = useCallback(() => setState({ loading: false, error: null, data: null }), []);

  return { createVariant, reset, ...state };
}

export function useAssignVariant() {
  const [state, setState] = useState<MutationState<ABVariant>>({ loading: false, error: null, data: null });
  const { success: notify, error: notifyError } = useNotification();

  const assignVariant = useCallback(
    async (videoId: string): Promise<ABVariant | null> => {
      setState({ loading: true, error: null, data: null });
      try {
        const response = await apiClient.post<ABVariant>(`/api/marketing/ab/assign/${videoId}`, {});
        setState({ loading: false, error: null, data: response });
        notify(`Assigned variant: "${response.variantKey}" (assignments: ${response.assignedCount})`);
        return response;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to assign variant";
        setState({ loading: false, error: message, data: null });
        notifyError(message);
        return null;
      }
    },
    [notify, notifyError]
  );

  const reset = useCallback(() => setState({ loading: false, error: null, data: null }), []);

  return { assignVariant, reset, ...state };
}
