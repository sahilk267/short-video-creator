import { describe, expect, it, vi } from "vitest";
import { executeHealthDashboardFetch, type HealthDashboardData } from "./useHealthDashboard";

const dashboardFixture: HealthDashboardData = {
  status: "ok",
  generatedAt: "2026-03-26T12:00:00.000Z",
  uptime: 7200,
  version: "1.3.4",
  queue: {
    redisEnabled: true,
    totals: { active: 3, waiting: 5, failed: 1, delayed: 2 },
    queues: [
      {
        id: "render",
        label: "Render",
        counts: { active: 2, waiting: 4, completed: 10, failed: 1, delayed: 0, paused: 0 },
      },
    ],
  },
  queueStates: {
    renderStates: { queued: 4, completed: 10 },
    publishStates: { processing: 1 },
  },
  workers: {
    online: 4,
    total: 5,
    capacity: 13,
    currentJobs: 3,
    items: [
      {
        id: "render",
        label: "Render Worker",
        queue: "render_queue",
        capacity: 1,
        currentJobs: 1,
        online: true,
        status: "busy",
      },
    ],
  },
  database: {
    status: "ok",
    engine: "file-store",
    connections: { active: 1, max: 1 },
    latencyMs: 12,
    sizeBytes: 4096,
    files: ["renderJobs.json"],
  },
  redis: {
    status: "ok",
    enabled: true,
    latencyMs: 3,
    memoryUsedBytes: 2048,
    memoryPeakBytes: 4096,
    hitRate: 0.92,
    keyCount: 8,
  },
  system: {
    cpuPercent: 42,
    memoryPercent: 58,
    diskPercent: 61,
    loadAverage: [0.42, 0.55, 0.61],
  },
  errors: {
    last24h: 2,
    trend: [{ label: "12:00", count: 2 }],
    recent: [{ id: "err-1", phase: "publish", errorCode: "timeout", createdAt: "2026-03-26T11:00:00.000Z", latencyMs: 4200 }],
  },
  slowRequests: [
    { id: "slow-1", label: "publish job job-1", phase: "publish", status: "failed", latencyMs: 4200, createdAt: "2026-03-26T11:00:00.000Z", jobId: "job-1" },
  ],
  alerts: [
    { id: "queue-failures", severity: "warning", title: "Failed jobs detected", description: "1 jobs are currently marked failed across render and publish queues." },
  ],
};

describe("executeHealthDashboardFetch", () => {
  it("returns dashboard data when the request succeeds", async () => {
    const fetchDashboard = vi.fn().mockResolvedValue(dashboardFixture);

    const result = await executeHealthDashboardFetch(fetchDashboard);

    expect(fetchDashboard).toHaveBeenCalledTimes(1);
    expect(result.data?.queue.totals.active).toBe(3);
    expect(result.error).toBeNull();
  });

  it("returns a stable error message when the request fails", async () => {
    const fetchDashboard = vi.fn().mockRejectedValue(new Error("health endpoint unavailable"));

    const result = await executeHealthDashboardFetch(fetchDashboard);

    expect(result.data).toBeNull();
    expect(result.error).toBe("health endpoint unavailable");
  });
});
