import { useCallback, useState } from "react";
import { apiClient } from "../services/apiClient";
import { useNotification } from "../store/uiStore";
import type { SuggestionContext, SuggestionResult } from "./useAIMetrics";

interface TrainingResponse {
  ok: boolean;
}

interface NotificationApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

export async function executeAITraining(
  trainRequest: () => Promise<TrainingResponse>,
  notifications: NotificationApi,
  onComplete?: () => Promise<void> | void,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const response = await trainRequest();
    if (response.ok) {
      notifications.success("AI model retraining completed");
    } else {
      notifications.success("AI model retraining request completed");
    }

    if (onComplete) {
      await onComplete();
    }

    return { ok: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to retrain model";
    notifications.error(message);
    return { ok: false, error: message };
  }
}

export async function executeAISuggestion(
  suggestionRequest: (context: SuggestionContext) => Promise<SuggestionResult>,
  context: SuggestionContext,
  notifications: NotificationApi,
): Promise<{ data: SuggestionResult | null; error: string | null }> {
  try {
    const response = await suggestionRequest(context);
    notifications.success("Suggestion generated from current model state");
    return { data: response, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate suggestion";
    notifications.error(message);
    return { data: null, error: message };
  }
}

export function useAITraining(onComplete?: () => Promise<void> | void) {
  const [training, setTraining] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null);
  const { success, error } = useNotification();

  const triggerTraining = useCallback(async () => {
    setTraining(true);
    setTrainingError(null);
    const result = await executeAITraining(
      () => apiClient.ai.train() as Promise<TrainingResponse>,
      { success, error },
      onComplete,
    );

    if (!result.ok) {
      setTrainingError(result.error);
    }

    try {
      return result;
    } finally {
      setTraining(false);
    }
  }, [error, onComplete, success]);

  const requestSuggestion = useCallback(async (context: SuggestionContext) => {
    setSuggesting(true);
    setSuggestionError(null);
    const result = await executeAISuggestion(
      (payload) => apiClient.ai.getSuggestion(payload) as Promise<SuggestionResult>,
      context,
      { success, error },
    );

    if (result.data) {
      setSuggestion(result.data);
    }

    if (result.error) {
      setSuggestionError(result.error);
    }

    try {
      return result.data;
    } finally {
      setSuggesting(false);
    }
  }, [error, success]);

  return {
    training,
    suggesting,
    trainingError,
    suggestionError,
    suggestion,
    triggerTraining,
    requestSuggestion,
  };
}

export default useAITraining;