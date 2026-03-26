import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const useScheduledJobsMock = vi.fn();
const useAutoRefreshMock = vi.fn();

vi.mock("../hooks/useScheduledJobs", () => ({
  useScheduledJobs: () => useScheduledJobsMock(),
}));

vi.mock("../hooks/useAutoRefresh", () => ({
  useAutoRefresh: () => useAutoRefreshMock(),
}));

import SchedulerDashboard from "./SchedulerDashboard";

describe("SchedulerDashboard", () => {
  it("renders the initial empty scheduler state with refresh controls", () => {
    useScheduledJobsMock.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    useAutoRefreshMock.mockReturnValue({
      autoRefreshEnabled: true,
      lastUpdatedAt: "2026-03-26T12:00:00.000Z",
      setAutoRefreshEnabled: vi.fn(),
      refreshNow: vi.fn(),
    });

    const markup = renderToStaticMarkup(<SchedulerDashboard />);

    expect(markup).toContain("Scheduler Dashboard");
    expect(markup).toContain("Auto-refresh");
    expect(markup).toContain("No scheduler data yet");
    expect(markup).toContain("Refresh scheduler");
  });

  it("renders the no-jobs state when queue data exists but no scheduled jobs are present", () => {
    useScheduledJobsMock.mockReturnValue({
      data: {
        queueStats: {
          render: { active: 0, waiting: 0, completed: 0, failed: 0, delayed: 0, paused: 0 },
          publish: { active: 0, waiting: 0, completed: 0, failed: 0, delayed: 0, paused: 0 },
          redisEnabled: false,
        },
        renderJobs: [],
        publishJobs: [],
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    useAutoRefreshMock.mockReturnValue({
      autoRefreshEnabled: false,
      lastUpdatedAt: null,
      setAutoRefreshEnabled: vi.fn(),
      refreshNow: vi.fn(),
    });

    const markup = renderToStaticMarkup(<SchedulerDashboard />);

    expect(markup).toContain("No scheduled jobs yet");
    expect(markup).toContain("Redis is disabled");
    expect(markup).toContain("Queue Health");
  });
});
