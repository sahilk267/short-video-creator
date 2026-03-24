import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export type ReportStatus = "pending" | "merged" | "published";

export interface ReportRecord {
  id: string;
  sourceId: string;
  sourceName: string;
  category: string;
  title: string;
  content: string;
  link: string;
  pubDate: string;
  insertedAt: string;
  status: ReportStatus;
}

export class ReportStore {
  private storePath: string;

  constructor(basePath: string) {
    this.storePath = path.join(basePath, "reports.json");
    fs.ensureFileSync(this.storePath);
  }

  private async readAll(): Promise<ReportRecord[]> {
    const fileContent = await fs.readFile(this.storePath, { encoding: "utf-8" });
    if (!fileContent) {
      return [];
    }
    try {
      return JSON.parse(fileContent) as ReportRecord[];
    } catch (error) {
      await fs.writeFile(this.storePath, "[]", "utf-8");
      return [];
    }
  }

  private async writeAll(records: ReportRecord[]): Promise<void> {
    await fs.writeFile(this.storePath, JSON.stringify(records, null, 2), "utf-8");
  }

  public async add(report: Omit<ReportRecord, "id" | "insertedAt" | "status">): Promise<ReportRecord> {
    const current = await this.readAll();
    const record: ReportRecord = {
      ...report,
      id: uuidv4().replace(/-/g, ""),
      insertedAt: new Date().toISOString(),
      status: "pending",
    };
    current.push(record);
    await this.writeAll(current);
    return record;
  }

  public async list(): Promise<ReportRecord[]> {
    return (await this.readAll()).sort((a, b) => new Date(b.insertedAt).getTime() - new Date(a.insertedAt).getTime());
  }

  public async get(reportId: string): Promise<ReportRecord | undefined> {
    return (await this.readAll()).find((item) => item.id === reportId);
  }

  public async updateStatus(reportId: string, status: ReportStatus): Promise<ReportRecord | undefined> {
    const records = await this.readAll();
    const idx = records.findIndex((item) => item.id === reportId);
    if (idx < 0) return undefined;
    records[idx].status = status;
    await this.writeAll(records);
    return records[idx];
  }
}
