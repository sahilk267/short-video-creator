import { useCallback, useEffect, useState } from "react";

export interface UseAutoRefreshOptions {
  enabledByDefault?: boolean;
  intervalMs?: number;
}

export interface UseAutoRefreshResult {
  autoRefreshEnabled: boolean;
  lastUpdatedAt: string | null;
  setAutoRefreshEnabled: (enabled: boolean) => void;
  refreshNow: () => Promise<void>;
}

export function useAutoRefresh(
  refresh: () => Promise<void>,
  options: UseAutoRefreshOptions = {},
): UseAutoRefreshResult {
  const {
    enabledByDefault = false,
    intervalMs = 30000,
  } = options;

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(enabledByDefault);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const refreshNow = useCallback(async () => {
    await refresh();
    setLastUpdatedAt(new Date().toISOString());
  }, [refresh]);

  useEffect(() => {
    void refreshNow();
  }, [refreshNow]);

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshNow();
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRefreshEnabled, intervalMs, refreshNow]);

  return {
    autoRefreshEnabled,
    lastUpdatedAt,
    setAutoRefreshEnabled,
    refreshNow,
  };
}

export default useAutoRefresh;
