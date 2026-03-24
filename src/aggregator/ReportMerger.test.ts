import { test, expect } from "vitest";
import { ReportMerger } from "./ReportMerger";
import { ReportRecord } from "../db/ReportStore";

test("ReportMerger should merge reports into script plan", () => {
  const reports: ReportRecord[] = [
    {
      id: "1",
      sourceId: "bbc",
      sourceName: "BBC",
      category: "World",
      title: "World news 1",
      content: "First item content.",
      link: "https://example.com/1",
      pubDate: "2025-09-01T10:00:00Z",
      insertedAt: "2025-09-01T10:00:00Z",
      status: "pending",
    },
    {
      id: "2",
      sourceId: "cnn",
      sourceName: "CNN",
      category: "World",
      title: "World news 2",
      content: "Second item content is longer and should still be included.",
      link: "https://example.com/2",
      pubDate: "2025-09-01T09:00:00Z",
      insertedAt: "2025-09-01T09:00:00Z",
      status: "pending",
    },
  ];

  const plan = ReportMerger.mergeReports(reports, "World", 120);

  expect(plan.category).toBe("World");
  expect(plan.scenes.length).toBeGreaterThan(0);
  expect(plan.estimatedDurationSeconds).toBeGreaterThan(0);
});
