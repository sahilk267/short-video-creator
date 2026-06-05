/* eslint-disable @remotion/deterministic-randomness */

import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export type CredentialType = "oauth_token" | "api_key" | "webhook_secret" | "jwt_secret" | "refresh_token";
export type RotationStatus = "active" | "expiring_soon" | "expired" | "rotated" | "pending";

export interface Credential {
  id: string;
  name: string;
  platform: string;
  type: CredentialType;
  tenantId?: string;
  maskedValue: string;
  hash: string;
  createdAt: string;
  expiresAt?: string;
  lastRotatedAt?: string;
  status: RotationStatus;
  autoRotate: boolean;
  rotationIntervalDays: number;
  nextRotationAt?: string;
  notifyBeforeDays: number;
}

export interface RotationSchedule {
  credentialId: string;
  platform: string;
  name: string;
  scheduledFor: string;
  reason: string;
}

export interface RotationResult {
  credentialId: string;
  success: boolean;
  newHash?: string;
  rotatedAt: string;
  error?: string;
}

import crypto from "crypto";

function maskValue(v: string): string {
  if (v.length <= 8) return "****";
  return v.substring(0, 6) + "..." + v.substring(v.length - 4);
}

function hashValue(v: string): string {
  return crypto.createHash("sha256").update(v).digest("hex").substring(0, 16);
}

export class CredentialRotationEngine {
  private dataPath: string;
  private credentials: Credential[] = [];

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "credential-store.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dataPath)) this.credentials = fs.readJsonSync(this.dataPath);
    } catch { this.credentials = []; }
  }

  private save() {
    try { fs.writeJsonSync(this.dataPath, this.credentials, { spaces: 2 }); } catch { /* ignore */ }
  }

  register(
    name: string,
    platform: string,
    type: CredentialType,
    value: string,
    opts: {
      tenantId?: string; expiresAt?: string;
      autoRotate?: boolean; rotationIntervalDays?: number; notifyBeforeDays?: number;
    } = {}
  ): Credential {
    const id = `cred_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const rotationIntervalDays = opts.rotationIntervalDays || 90;
    const nextRotationAt = new Date(Date.now() + rotationIntervalDays * 86400000).toISOString();

    const cred: Credential = {
      id, name, platform, type,
      tenantId: opts.tenantId,
      maskedValue: maskValue(value),
      hash: hashValue(value),
      createdAt: new Date().toISOString(),
      expiresAt: opts.expiresAt,
      status: "active",
      autoRotate: opts.autoRotate ?? true,
      rotationIntervalDays,
      nextRotationAt,
      notifyBeforeDays: opts.notifyBeforeDays || 7,
    };

    this.credentials.push(cred);
    this.save();
    logger.info({ id, name, platform }, "CredentialRotationEngine: credential registered");
    return cred;
  }

  scheduleRotation(credentialIds?: string[]): RotationSchedule[] {
    const targets = credentialIds
      ? this.credentials.filter((c) => credentialIds.includes(c.id))
      : this.credentials.filter((c) => c.autoRotate);

    const now = Date.now();
    const schedules: RotationSchedule[] = [];

    for (const cred of targets) {
      const nextRotation = cred.nextRotationAt ? new Date(cred.nextRotationAt).getTime() : now;
      const daysUntilRotation = (nextRotation - now) / 86400000;

      if (daysUntilRotation <= cred.notifyBeforeDays) {
        cred.status = "expiring_soon";
        schedules.push({
          credentialId: cred.id,
          platform: cred.platform,
          name: cred.name,
          scheduledFor: cred.nextRotationAt || new Date().toISOString(),
          reason: daysUntilRotation <= 0 ? "Rotation overdue" : `Rotation due in ${Math.round(daysUntilRotation)} days`,
        });
      }

      if (cred.expiresAt && new Date(cred.expiresAt).getTime() < now) {
        cred.status = "expired";
        schedules.push({
          credentialId: cred.id,
          platform: cred.platform,
          name: cred.name,
          scheduledFor: new Date().toISOString(),
          reason: "Token expired",
        });
      }
    }

    this.save();
    return schedules;
  }

  rotateNow(credentialId: string, newValue: string): RotationResult {
    const cred = this.credentials.find((c) => c.id === credentialId);
    if (!cred) {
      return { credentialId, success: false, rotatedAt: new Date().toISOString(), error: "Credential not found" };
    }

    try {
      cred.maskedValue = maskValue(newValue);
      cred.hash = hashValue(newValue);
      cred.lastRotatedAt = new Date().toISOString();
      cred.status = "rotated";
      cred.nextRotationAt = new Date(Date.now() + cred.rotationIntervalDays * 86400000).toISOString();
      this.save();
      logger.info({ credentialId, platform: cred.platform }, "CredentialRotationEngine: rotated");
      return { credentialId, success: true, newHash: cred.hash, rotatedAt: cred.lastRotatedAt };
    } catch (err) {
      logger.error({ err, credentialId }, "CredentialRotationEngine.rotateNow error");
      return { credentialId, success: false, rotatedAt: new Date().toISOString(), error: String(err) };
    }
  }

  detectExpiring(withinDays = 7): Credential[] {
    const cutoff = Date.now() + withinDays * 86400000;
    return this.credentials.filter((c) => {
      const expiry = c.expiresAt ? new Date(c.expiresAt).getTime() : null;
      const rotation = c.nextRotationAt ? new Date(c.nextRotationAt).getTime() : null;
      return (expiry && expiry < cutoff) || (rotation && rotation < cutoff);
    });
  }

  getAll(): Credential[] { return this.credentials; }
  getById(id: string): Credential | undefined { return this.credentials.find((c) => c.id === id); }
  getByPlatform(platform: string): Credential[] { return this.credentials.filter((c) => c.platform === platform); }
  getExpired(): Credential[] { return this.credentials.filter((c) => c.status === "expired"); }
}
