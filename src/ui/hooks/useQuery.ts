/**
 * useQuery Hook - For fetching data with caching and error handling
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ApiError } from "../services/apiClient";

export interface UseQueryOptions {
  enabled?: boolean;
  cacheTTL?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: ApiError) => void;
  retry?: number;
  retryDelay?: number;
}

export interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function useQuery<T = unknown>(
  queryFn: () => Promise<T>,
  options?: UseQueryOptions,
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const retriesRef = useRef(0);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (options?.enabled === false) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await queryFn();

      if (isMountedRef.current) {
        setData(result);
        options?.onSuccess?.(result);
      }
      retriesRef.current = 0;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(500, String(err));

      if (isMountedRef.current) {
        if (
          (options?.retry ?? 3) > retriesRef.current &&
          apiError.status >= 500
        ) {
          retriesRef.current += 1;
          const delay = options?.retryDelay ?? 1000 * retriesRef.current;
          setTimeout(() => fetchData(), delay);
        } else {
          setError(apiError);
          options?.onError?.(apiError);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [queryFn, options]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (options?.enabled !== false) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData, options?.enabled]);

  return { data, isLoading, error, refetch };
}

export default useQuery;
