import { describe, expect, it } from "vitest";
import { PlanningWorker } from "./PlanningWorker";

describe("PlanningWorker", () => {
  it("exports a worker class", () => {
    expect(PlanningWorker).toBeDefined();
  });
});
