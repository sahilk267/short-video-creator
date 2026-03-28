process.env.LOG_LEVEL = "debug";

import nock from "nock";
import { PexelsAPI } from "./Pexels";
import { test, assert, expect, afterEach, vi } from "vitest";
import fs from "fs-extra";
import path from "path";
import { OrientationEnum } from "../../types/shorts";

afterEach(() => {
  nock.cleanAll();
});

test("test pexels", async () => {
  const mockResponse = fs.readFileSync(
    path.resolve("__mocks__/pexels-response.json"),
    "utf-8",
  );
  nock("https://api.pexels.com")
    .get(/videos\/search/)
    .reply(200, mockResponse);
  const pexels = new PexelsAPI("asdf");
  const video = await pexels.findVideo(["dog"], 2.4, []);
  assert.isObject(video, "Video should be an object");
  expect(video.id).toBeTruthy();
  expect(video.url).toContain("http");
  expect(video.width).toBeGreaterThan(0);
  expect(video.height).toBeGreaterThan(0);
});

test("should time out", async () => {
  nock("https://api.pexels.com")
    .get(/videos\/search/)
    .delay(1000)
    .times(4)
    .reply(200, {});
  const pexels = new PexelsAPI("asdf");
  await expect(
    pexels.findVideo(["dog"], 2.4, [], OrientationEnum.portrait, 100),
  ).rejects.toThrow(
    expect.objectContaining({
      name: "TimeoutError",
    }),
  );
});

test("should retry 3 times", async () => {
  const pexels = new PexelsAPI("asdf");
  const mockResponse = JSON.parse(
    fs.readFileSync(path.resolve("__mocks__/pexels-response.json"), "utf-8"),
  );
  let callCount = 0;
  const findVideoSpy = vi
    .spyOn(pexels as never, "_findVideo" as never)
    .mockImplementation(async () => {
      callCount += 1;
      if (callCount <= 3) {
        throw new DOMException("timed out", "TimeoutError");
      }
      const selectedVideo = mockResponse.videos[0];
      const selectedFile = selectedVideo.video_files[0];
      return {
        id: selectedVideo.id,
        url: selectedFile.link,
        width: selectedFile.width,
        height: selectedFile.height,
      };
    });

  const video = await pexels.findVideo(["dog"], 2.4, []);
  assert.isObject(video, "Video should be an object");
  expect(video.id).toBeTruthy();
  expect(findVideoSpy).toHaveBeenCalledTimes(4);
});

test("should prioritize specific multi-word search terms before generic ones", async () => {
  const pexels = new PexelsAPI("asdf");
  const findVideoSpy = vi
    .spyOn(pexels as never, "_findVideo" as never)
    .mockResolvedValue({
      id: "video-1",
      url: "https://example.com/video.mp4",
      width: 1080,
      height: 1920,
    });

  await pexels.findVideo(
    ["news", "cricket controversy", "Moeen Ali", "sports"],
    2.4,
    [],
  );

  expect(findVideoSpy).toHaveBeenCalled();
  expect(findVideoSpy.mock.calls[0]?.[0]).toBe("cricket controversy");
});

test("should inject domain-aware anchor queries for cricket scenes", () => {
  const pexels = new PexelsAPI("asdf");

  const candidates = (pexels as any).buildQueryCandidates([
    "news",
    "PCB",
    "Moeen Ali",
    "cricket controversy",
  ]);

  expect(candidates).toContain("cricket stadium");
  expect(candidates).toContain("cricket player");
  expect(candidates[0]).toBe("cricket controversy");
});
