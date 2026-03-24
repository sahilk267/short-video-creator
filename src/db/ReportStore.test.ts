import { test, expect } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { ReportStore } from "./ReportStore";

test("ReportStore can add and list reports", async () => {
  const tmpDir = path.join(os.tmpdir(), `reportstore-${Date.now()}`);
  await fs.ensureDir(tmpDir);

  const store = new ReportStore(tmpDir);
  const report = await store.add({
    sourceId: "cnn",
    sourceName: "CNN",
    category: "World",
    title: "Test Report",
    content: "Test content",
    link: "https://example.com",
    pubDate: "2024-01-01",
  });

  expect(report.id).toBeTruthy();
  expect(report.status).toBe("pending");
  expect(report.title).toBe("Test Report");

  const allReports = await store.list();
  expect(allReports).toHaveLength(1);
  expect(allReports[0].id).toBe(report.id);

  const loaded = await store.get(report.id);
  expect(loaded).toBeDefined();
  expect(loaded?.sourceId).toBe("cnn");

  const updated = await store.updateStatus(report.id, "merged");
  expect(updated).toBeDefined();
  expect(updated?.status).toBe("merged");
});
