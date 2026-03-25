import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { ABVariantStore } from "./ABVariantStore";

describe("ABVariantStore", () => {
  it("creates and assigns variants", async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), "ab-store-"));
    const store = new ABVariantStore(base);
    await store.create({ videoId: "v1", variantKey: "A", title: "Title A" });
    await store.create({ videoId: "v1", variantKey: "B", title: "Title B" });

    const assigned = await store.assign("v1");
    expect(assigned).toBeTruthy();
    expect(["A", "B"]).toContain(assigned?.variantKey);
  });
});
