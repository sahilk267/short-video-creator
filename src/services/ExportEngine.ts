import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export type ExportFormat = "zip" | "json" | "csv" | "tar";

export interface ExportManifest {
  id: string;
  type: "content" | "analytics" | "settings" | "full_backup";
  format: ExportFormat;
  createdAt: string;
  files: ExportFile[];
  totalSizeMb: number;
  status: "pending" | "completed" | "failed";
  outputPath: string;
  error?: string;
}

export interface ExportFile {
  name: string;
  source: string;
  sizeMb: number;
  included: boolean;
}

export interface RestoreResult {
  success: boolean;
  filesRestored: number;
  errors: string[];
}

interface ExportRecord {
  id: string;
  manifest: ExportManifest;
}

export class ExportEngine {
  private dataPath: string;
  private records: ExportRecord[] = [];
  private exportDir: string;

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "export-records.json");
    this.exportDir = path.join(dataDirPath, "exports");
    fs.ensureDirSync(this.exportDir);
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dataPath)) this.records = fs.readJsonSync(this.dataPath);
    } catch { this.records = []; }
  }

  private save() {
    try { fs.writeJsonSync(this.dataPath, this.records, { spaces: 2 }); } catch { /* ignore */ }
  }

  private buildFileList(dataDirPath: string, type: ExportManifest["type"]): ExportFile[] {
    const patterns: Record<ExportManifest["type"], string[]> = {
      content: ["content-buckets.json", "content-fingerprints.json", "freshness-records.json", "skip-analysis.json"],
      analytics: ["analytics.json", "ab-tests.json", "platform-metrics.json", "shadowban-status.json"],
      settings: ["config.json", "throttle-quotas.json", "auth-tenants.json", "credential-store.json"],
      full_backup: [
        "content-buckets.json", "content-fingerprints.json", "freshness-records.json",
        "analytics.json", "ab-tests.json", "platform-metrics.json", "approval-queue.json",
        "asset-library.json", "competitor-analysis.json", "trend-hijacking.json",
        "throttle-quotas.json", "auth-tenants.json", "resource-snapshots.json",
      ],
    };

    return (patterns[type] || []).map((file) => {
      const source = path.join(dataDirPath, file);
      let sizeMb = 0;
      let included = false;
      try {
        if (fs.existsSync(source)) {
          sizeMb = Math.round(fs.statSync(source).size / 1024 / 1024 * 1000) / 1000;
          included = true;
        }
      } catch { /* ignore */ }
      return { name: file, source, sizeMb, included };
    });
  }

  async exportContent(dataDirPath: string, type: ExportManifest["type"] = "full_backup", format: ExportFormat = "json"): Promise<ExportManifest> {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const outputPath = path.join(this.exportDir, `export_${id}.${format}`);
    const files = this.buildFileList(dataDirPath, type);
    const totalSizeMb = files.reduce((s, f) => s + f.sizeMb, 0);

    const manifest: ExportManifest = {
      id, type, format, createdAt: new Date().toISOString(),
      files, totalSizeMb: Math.round(totalSizeMb * 1000) / 1000,
      status: "pending", outputPath,
    };

    try {
      const includedFiles = files.filter((f) => f.included);
      const exportData: Record<string, unknown> = {
        exportId: id,
        exportedAt: manifest.createdAt,
        type,
        data: {},
      };

      for (const file of includedFiles) {
        try {
          (exportData.data as Record<string, unknown>)[file.name] = fs.readJsonSync(file.source);
        } catch { /* skip unreadable files */ }
      }

      if (format === "json") {
        fs.writeJsonSync(outputPath, exportData, { spaces: 2 });
      } else if (format === "csv") {
        const csv = `id,type,exportedAt,fileCount\n${id},${type},${manifest.createdAt},${includedFiles.length}`;
        fs.writeFileSync(outputPath, csv);
      } else {
        fs.writeJsonSync(outputPath, exportData, { spaces: 2 });
      }

      manifest.status = "completed";
      logger.info({ id, type, files: includedFiles.length }, "ExportEngine: export completed");
    } catch (err) {
      manifest.status = "failed";
      manifest.error = String(err);
      logger.error({ err, id }, "ExportEngine: export failed");
    }

    this.records.push({ id, manifest });
    this.save();
    return manifest;
  }

  async backupAll(dataDirPath: string): Promise<ExportManifest> {
    return this.exportContent(dataDirPath, "full_backup", "json");
  }

  async restore(exportPath: string, targetDirPath: string): Promise<RestoreResult> {
    const errors: string[] = [];
    let filesRestored = 0;

    try {
      if (!fs.existsSync(exportPath)) throw new Error(`Export file not found: ${exportPath}`);
      const data = fs.readJsonSync(exportPath) as { data?: Record<string, unknown> };
      if (!data.data) throw new Error("Invalid export format");

      fs.ensureDirSync(targetDirPath);
      for (const [filename, content] of Object.entries(data.data)) {
        try {
          fs.writeJsonSync(path.join(targetDirPath, filename), content, { spaces: 2 });
          filesRestored++;
        } catch (err) {
          errors.push(`Failed to restore ${filename}: ${err}`);
        }
      }

      logger.info({ filesRestored, errors: errors.length }, "ExportEngine: restore completed");
      return { success: errors.length === 0, filesRestored, errors };
    } catch (err) {
      logger.error({ err }, "ExportEngine.restore error");
      return { success: false, filesRestored, errors: [String(err)] };
    }
  }

  getExports(): ExportManifest[] { return this.records.map((r) => r.manifest); }
  getExportById(id: string): ExportManifest | undefined { return this.records.find((r) => r.id === id)?.manifest; }
}
