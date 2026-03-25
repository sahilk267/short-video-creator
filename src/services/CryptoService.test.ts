import { describe, expect, it } from "vitest";
import { CryptoService } from "./CryptoService";

describe("CryptoService", () => {
  it("encrypts and decrypts values", () => {
    const svc = new CryptoService("secret");
    const enc = svc.encrypt("my-token");
    expect(enc).not.toBe("my-token");
    expect(svc.decrypt(enc)).toBe("my-token");
  });
});
