import { describe, expect, it } from "vitest";
import { TenantQuotaService } from "./TenantQuotaService";

describe("TenantQuotaService", () => {
  it("flags exceeded free-tier limits", () => {
    const svc = new TenantQuotaService();
    const result = svc.checkQuota(
      {
        id: "t1",
        workspaceName: "ws",
        tier: "free",
        apiKeys: {},
        engineConfig: {},
        createdAt: "",
        updatedAt: "",
      } as any,
      { renders: 101, publishes: 1, storageBytes: 0 },
    );
    expect(result.allowed).toBe(false);
  });
});
