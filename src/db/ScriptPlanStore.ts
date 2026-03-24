import fs from "fs-extra";
import path from "path";

export interface ScriptPlanItem {
  id: string;
  category: string;
  createdAt: string;
  scenes: Array<{ text: string; source: string; link: string; category: string; pubDate: string }>;
  estimatedDurationSeconds: number;
}

export class ScriptPlanStore {
  private storePath: string;

  constructor(basePath: string) {
    this.storePath = path.join(basePath, "scriptPlans.json");
    fs.ensureFileSync(this.storePath);
  }

  private async readAll(): Promise<ScriptPlanItem[]> {
    const fileContent = await fs.readFile(this.storePath, { encoding: "utf-8" });
    if (!fileContent) {
      return [];
    }
    try {
      return JSON.parse(fileContent) as ScriptPlanItem[];
    } catch (error) {
      await fs.writeFile(this.storePath, "[]", "utf-8");
      return [];
    }
  }

  private async writeAll(records: ScriptPlanItem[]): Promise<void> {
    await fs.writeFile(this.storePath, JSON.stringify(records, null, 2), "utf-8");
  }

  public async add(plan: ScriptPlanItem): Promise<ScriptPlanItem> {
    const current = await this.readAll();
    current.push(plan);
    await this.writeAll(current);
    return plan;
  }

  public async list(): Promise<ScriptPlanItem[]> {
    return (await this.readAll()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async get(planId: string): Promise<ScriptPlanItem | undefined> {
    return (await this.readAll()).find((item) => item.id === planId);
  }
}
