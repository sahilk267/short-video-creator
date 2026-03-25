import path from "path";
import fs from "fs-extra";
import os from "os";

async function run(): Promise<void> {
  const dataDir = process.env.DATA_DIR_PATH || path.join(os.homedir(), ".ai-agents-az-video-generator");
  const backupRoot = path.join(dataDir, "backups");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(backupRoot, `backup-${stamp}`);

  await fs.ensureDir(backupRoot);

  const copyTargets = ["analytics.json", "reports.json", "script-plans.json", "render-jobs.json", "publish-jobs.json", "tenant-usage.json", "tenants.json"];

  await fs.ensureDir(target);
  for (const file of copyTargets) {
    const from = path.join(dataDir, file);
    if (await fs.pathExists(from)) {
      await fs.copy(from, path.join(target, file));
    }
  }

  console.log(`Backup completed at ${target}`);
}

void run();
