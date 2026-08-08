import fs from "fs-extra";
import path from "path";
import cuid from "cuid";
import type { ProfileRecord } from "../types/profiles";

export class ProfileStore {
  private storePath: string;

  constructor(basePath: string) {
    this.storePath = path.join(basePath, "profiles.json");
    fs.ensureFileSync(this.storePath);
    if (!fs.readFileSync(this.storePath, "utf-8").trim()) {
      fs.writeFileSync(this.storePath, "[]", "utf-8");
    }
  }

  private async readAll(): Promise<ProfileRecord[]> {
    const content = await fs.readFile(this.storePath, "utf-8");
    if (!content.trim()) return [];
    try {
      return JSON.parse(content) as ProfileRecord[];
    } catch {
      await fs.writeFile(this.storePath, "[]", "utf-8");
      return [];
    }
  }

  private async writeAll(records: ProfileRecord[]): Promise<void> {
    await fs.writeFile(this.storePath, JSON.stringify(records, null, 2), "utf-8");
  }

  async list(): Promise<ProfileRecord[]> {
    return this.readAll();
  }

  async get(id: string): Promise<ProfileRecord | undefined> {
    const records = await this.readAll();
    return records.find((r) => r.id === id);
  }

  async create(data: {
    name: string;
    description?: string;
    genres?: string[];
  }): Promise<ProfileRecord> {
    const records = await this.readAll();
    const now = new Date().toISOString();
    const record: ProfileRecord = {
      id: `prf_${cuid()}`,
      name: data.name,
      description: data.description,
      genres: data.genres || [],
      accountIds: [],
      createdAt: now,
      updatedAt: now,
    };
    records.push(record);
    await this.writeAll(records);
    return record;
  }

  async update(
    id: string,
    patch: Partial<Pick<ProfileRecord, "name" | "description" | "genres">>,
  ): Promise<ProfileRecord | undefined> {
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

  async addAccountId(id: string, accountId: string): Promise<void> {
    const records = await this.readAll();
    const idx = records.findIndex((r) => r.id === id);
    if (idx < 0) return;
    if (!records[idx].accountIds.includes(accountId)) {
      records[idx].accountIds.push(accountId);
      records[idx].updatedAt = new Date().toISOString();
      await this.writeAll(records);
    }
  }

  async removeAccountId(id: string, accountId: string): Promise<void> {
    const records = await this.readAll();
    const idx = records.findIndex((r) => r.id === id);
    if (idx < 0) return;
    records[idx].accountIds = records[idx].accountIds.filter((a) => a !== accountId);
    records[idx].updatedAt = new Date().toISOString();
    await this.writeAll(records);
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
