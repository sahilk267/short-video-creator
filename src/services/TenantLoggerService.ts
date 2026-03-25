import fs from "fs-extra";
import path from "path";

export class TenantLoggerService {
  constructor(private basePath: string) {}

  async log(tenantId: string, engine: string, level: "info" | "warn" | "error", message: string, payload?: Record<string, unknown>) {
    const dir = path.join(this.basePath, "tenant-logs", tenantId, engine);
    fs.ensureDirSync(dir);
    const file = path.join(dir, `${new Date().toISOString().slice(0, 10)}.log`);
    const line = JSON.stringify({ ts: new Date().toISOString(), tenantId, engine, level, message, payload }) + "\n";
    await fs.appendFile(file, line, "utf-8");
  }
}
