import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { TenantStore } from "./TenantStore";

describe("TenantStore", () => {
  it("creates tenant and updates keys + engine config", async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), "tenant-store-"));
    const store = new TenantStore(base);

    const tenant = await store.create({ workspaceName: "ws", tier: "free" });
    expect(tenant.workspaceName).toBe("ws");

    const withKeys = await store.updateKeys(tenant.id, { youtube: "abc" });
    expect(withKeys?.apiKeys.youtube).toBe("abc");

    const withEngine = await store.updateEngineConfig(tenant.id, {
      youtube: { enabled: true, channelId: "ch1" },
    });
    expect(withEngine?.engineConfig.youtube?.enabled).toBe(true);
  });
});
