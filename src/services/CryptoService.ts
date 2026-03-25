import crypto from "node:crypto";

export class CryptoService {
  private key: Buffer;

  constructor(secret: string) {
    this.key = crypto.createHash("sha256").update(secret).digest();
  }

  encrypt(plainText: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString("base64");
  }

  decrypt(payload: string): string {
    const data = Buffer.from(payload, "base64");
    const iv = data.subarray(0, 16);
    const tag = data.subarray(16, 32);
    const encrypted = data.subarray(32);
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return dec.toString("utf8");
  }
}
