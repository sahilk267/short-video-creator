import { describe, expect, it } from "vitest";
import { IngestWorker } from "./IngestWorker";

describe("IngestWorker", () => {
  it("exports a worker class", () => {
    expect(IngestWorker).toBeDefined();
  });
});
