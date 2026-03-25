import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  enforcePlatformMetadataLimits,
  validatePublishPayload,
} from "./PlatformLimits";

describe("PlatformLimits", () => {
  const createTempVideo = () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "svm-"));
    const filePath = path.join(tempDir, "video.mp4");
    fs.writeFileSync(filePath, "fake-video-data", "utf-8");
    return filePath;
  };

  it("trims youtube metadata according to limits", () => {
    const output = enforcePlatformMetadataLimits("youtube", {
      videoFilePath: createTempVideo(),
      title: "x".repeat(200),
      description: "y".repeat(6000),
      tags: ["a".repeat(100), "ok"],
      category: "General",
      language: "en",
    });

    expect(output.title.length).toBe(100);
    expect(output.description.length).toBe(5000);
    expect(output.tags[0].length).toBe(30);
  });

  it("rejects telegram tags and unsupported formats", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "svm-"));
    const badFile = path.join(tempDir, "video.mkv");
    fs.writeFileSync(badFile, "fake-video-data", "utf-8");

    const result = validatePublishPayload("telegram", {
      videoFilePath: badFile,
      title: "title",
      description: "desc",
      tags: ["tag1"],
      category: "General",
      language: "en",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Unsupported video format"))).toBe(true);
    expect(result.errors.some((e) => e.includes("tags are not supported"))).toBe(true);
  });
});
