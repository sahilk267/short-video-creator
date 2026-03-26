/**
 * useMutation Hook - For mutations/side effects with loading and error handling
 */

import { useState, useCallback, useRef } from "react";
import { ApiError } from "../services/apiClient";

export interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  onSettled?: () => void;
}

export interface UseMutationResult<T, V> {
  mutate: (variables?: V) => Promise<T | undefined>;
  mutateAsync: (variables?: V) => Promise<T>;
  isLoading: boolean;
  error: ApiError | null;
  data: T | null;
  reset: () => void;
}

export function useMutation<T = unknown, V = unknown>(
  mutationFn: (variables?: V) => Promise<T>,
  options?: UseMutationOptions<T>,
): UseMutationResult<T, V> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const isMountedRef = useRef(true);

  const mutateAsync = useCallback(
    async (variables?: V): Promise<T> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await mutationFn(variables);

        if (isMountedRef.current) {
          setData(result);
          options?.onSuccess?.(result);
        }

        return result;
      } catch (err) {
        const apiError =
          err instanceof ApiError ? err : new ApiError(500, String(err));

        if (isMountedRef.current) {
          setError(apiError);
          options?.onError?.(apiError);
        }

        throw apiError;
      } finally {
        if (isMountedRef.current) {
          options?.onSettled?.();
          setIsLoading(false);
        }
      }
    },
    [mutationFn, options],
  );

  const mutate = useCallback(
    async (variables?: V): Promise<T | undefined> => {
      try {
        return await mutateAsync(variables);
      } catch {
        return undefined;
      }
    },
    [mutateAsync],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
    data,
    reset,
  };
}

import React from "react";

export default useMutation;
