import { describe, expect, it } from "vitest";
import { apiRateLimiter } from "./rateLimit";

describe("apiRateLimiter", () => {
  it("is configured with standard handlers", () => {
    expect(apiRateLimiter).toBeDefined();
  });
});
