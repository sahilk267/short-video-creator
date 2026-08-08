import fs from "fs-extra";
import path from "path";
import cuid from "cuid";
import type { ProfileAccountRecord } from "../types/profiles";

export class ProfileAccountStore {
  private storePath: string;

  constructor(basePath: string) {
    this.storePath = path.join(basePath, "profileAccounts.json");
    fs.ensureFileSync(this.storePath);
    if (!fs.readFileSync(this.storePath, "utf-8").trim()) {
      fs.writeFileSync(this.storePath, "[]", "utf-8");
    }
  }

  private async readAll(): Promise<ProfileAccountRecord[]> {
    const content = await fs.readFile(this.storePath, "utf-8");
    if (!content.trim()) return [];
    try {
      return JSON.parse(content) as ProfileAccountRecord[];
    } catch {
      await fs.writeFile(this.storePath, "[]", "utf-8");
      return [];
    }
  }

  private async writeAll(records: ProfileAccountRecord[]): Promise<void> {
    await fs.writeFile(this.storePath, JSON.stringify(records, null, 2), "utf-8");
  }

  async list(): Promise<ProfileAccountRecord[]> {
    return this.readAll();
  }

  async listByProfile(profileId: string): Promise<ProfileAccountRecord[]> {
    const records = await this.readAll();
    return records.filter((r) => r.profileId === profileId);
  }

  async get(id: string): Promise<ProfileAccountRecord | undefined> {
    const records = await this.readAll();
    return records.find((r) => r.id === id);
  }

  async create(data: {
    profileId: string;
    provider: ProfileAccountRecord["provider"];
    label: string;
    credentials: Record<string, string>;
    externalId?: string;
    displayName?: string;
    avatarUrl?: string;
    status?: ProfileAccountRecord["status"];
    lastError?: string;
  }): Promise<ProfileAccountRecord> {
    const records = await this.readAll();
    const now = new Date().toISOString();
    const record: ProfileAccountRecord = {
      id: `acc_${cuid()}`,
      profileId: data.profileId,
      provider: data.provider,
      label: data.label,
      credentials: data.credentials,
      externalId: data.externalId,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      status: data.status || "active",
      lastError: data.lastError,
      createdAt: now,
      updatedAt: now,
    };
    records.push(record);
    await this.writeAll(records);
    return record;
  }

  async update(
    id: string,
    patch: Partial<Omit<ProfileAccountRecord, "id" | "createdAt">>,
  ): Promise<ProfileAccountRecord | undefined> {
    const records = await this.readAll();
    const idx = records.findIndex((r) => r.id === id);
    if (idx < 0) return undefined;
    records[idx] = {
      ...records[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await this.writeAll(records);
    return records[idx];
  }

  async remove(id: string): Promise<boolean> {
    const records = await this.readAll();
    const idx = records.findIndex((r) => r.id === id);
    if (idx < 0) return false;
    records.splice(idx, 1);
    await this.writeAll(records);
    return true;
  }
}
