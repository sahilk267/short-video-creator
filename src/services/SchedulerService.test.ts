import { describe, expect, it, vi } from "vitest";
import { SchedulerService } from "./SchedulerService";

describe("SchedulerService in-flight guard", () => {
  it("rejects duplicate category-slot enqueue requests", async () => {
    const config: any = { redisEnabled: false, dataDirPath: process.cwd(), cronInterval: "*/30 * * * *" };
    const shortCreator: any = {};
    const service = new SchedulerService(config, shortCreator);

    const promiseA = service.enqueueRenderJob({
      sceneInput: [{ text: "hello", searchTerms: ["a"], language: "en" }],
      orientation: "portrait",
      category: "World",
      videoType: "short",
      subtitleLanguage: "en",
      namingKey: "same",
    });

    const promiseB = service.enqueueRenderJob({
      sceneInput: [{ text: "hello", searchTerms: ["a"], language: "en" }],
      orientation: "portrait",
      category: "World",
      videoType: "short",
      subtitleLanguage: "en",
      namingKey: "same-2",
    });

    await expect(promiseB).rejects.toThrow(/Duplicate in-flight category slot/);
    await promiseA.catch(() => undefined);
  });
});
