import os from "os";
import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export interface ResourceSnapshot {
  timestamp: string;
  cpu: CpuSnapshot;
  memory: MemorySnapshot;
  disk: DiskSnapshot;
  uptime: number;
}

export interface CpuSnapshot {
  loadAvg1m: number;
  loadAvg5m: number;
  loadAvg15m: number;
  cores: number;
  usagePercent: number;
}

export interface MemorySnapshot {
  totalMb: number;
  freeMb: number;
  usedMb: number;
  usagePercent: number;
}

export interface DiskSnapshot {
  totalMb: number;
  freeMb: number;
  usedMb: number;
  usagePercent: number;
  path: string;
}

export interface ResourceOptimization {
  recommendations: string[];
  priority: "low" | "medium" | "high" | "critical";
}

export interface ResourcePrediction {
  predictedPeakCpuPercent: number;
  predictedPeakMemoryMb: number;
  safeToRunJobs: boolean;
  maxConcurrentJobs: number;
  recommendation: string;
}

export class ResourceEngine {
  private snapshotsPath: string;
  private snapshots: ResourceSnapshot[] = [];
  private readonly MAX_SNAPSHOTS = 500;

  constructor(dataDirPath: string) {
    this.snapshotsPath = path.join(dataDirPath, "resource-snapshots.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.snapshotsPath)) this.snapshots = fs.readJsonSync(this.snapshotsPath);
    } catch { this.snapshots = []; }
  }

  private save() {
    try { fs.writeJsonSync(this.snapshotsPath, this.snapshots.slice(-this.MAX_SNAPSHOTS), { spaces: 2 }); } catch { /* ignore */ }
  }

  getSnapshot(): ResourceSnapshot {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const loadAvg = os.loadavg();
      const cores = os.cpus().length;
      const cpuUsage = Math.min(100, Math.round((loadAvg[0] / cores) * 100));

      const diskPath = process.env.DATA_DIR_PATH || os.homedir();
      let diskSnapshot: DiskSnapshot = { totalMb: 0, freeMb: 0, usedMb: 0, usagePercent: 0, path: diskPath };
      try {
        const stats = fs.statfsSync ? fs.statfsSync(diskPath) : null;
        if (stats) {
          const total = stats.blocks * stats.bsize;
          const free = stats.bfree * stats.bsize;
          diskSnapshot = {
            totalMb: Math.round(total / 1024 / 1024),
            freeMb: Math.round(free / 1024 / 1024),
            usedMb: Math.round((total - free) / 1024 / 1024),
            usagePercent: total > 0 ? Math.round(((total - free) / total) * 100) : 0,
            path: diskPath,
          };
        }
      } catch { /* disk stat not available */ }

      const snapshot: ResourceSnapshot = {
        timestamp: new Date().toISOString(),
        cpu: {
          loadAvg1m: Math.round(loadAvg[0] * 100) / 100,
          loadAvg5m: Math.round(loadAvg[1] * 100) / 100,
          loadAvg15m: Math.round(loadAvg[2] * 100) / 100,
          cores,
          usagePercent: cpuUsage,
        },
        memory: {
          totalMb: Math.round(totalMem / 1024 / 1024),
          freeMb: Math.round(freeMem / 1024 / 1024),
          usedMb: Math.round(usedMem / 1024 / 1024),
          usagePercent: Math.round((usedMem / totalMem) * 100),
        },
        disk: diskSnapshot,
        uptime: Math.round(os.uptime()),
      };

      this.snapshots.push(snapshot);
      if (this.snapshots.length > this.MAX_SNAPSHOTS) this.snapshots = this.snapshots.slice(-this.MAX_SNAPSHOTS);
      this.save();
      return snapshot;
    } catch (err) {
      logger.error({ err }, "ResourceEngine.getSnapshot error");
      throw err;
    }
  }

  optimize(): ResourceOptimization {
    const snapshot = this.getSnapshot();
    const recommendations: string[] = [];
    let priority: ResourceOptimization["priority"] = "low";

    if (snapshot.cpu.usagePercent > 90) {
      recommendations.push("CPU usage critical — pause background jobs");
      priority = "critical";
    } else if (snapshot.cpu.usagePercent > 70) {
      recommendations.push("High CPU — reduce concurrent render jobs");
      priority = "high";
    }

    if (snapshot.memory.usagePercent > 90) {
      recommendations.push("Memory critical — restart idle workers");
      priority = priority === "critical" ? "critical" : "critical";
    } else if (snapshot.memory.usagePercent > 75) {
      recommendations.push("High memory — close unused caches");
      if (priority === "low") priority = "high";
    }

    if (snapshot.disk.usagePercent > 90) {
      recommendations.push("Disk nearly full — delete old render outputs");
      priority = "critical";
    } else if (snapshot.disk.usagePercent > 75) {
      recommendations.push("Disk usage high — archive old videos");
      if (priority === "low") priority = "medium";
    }

    if (recommendations.length === 0) recommendations.push("System resources are healthy");
    return { recommendations, priority };
  }

  predictNeeds(plannedJobs: number): ResourcePrediction {
    const snapshot = this.getSnapshot();
    const memPerJobMb = 200;
    const cpuPerJobPercent = 15;
    const predictedPeakMemoryMb = snapshot.memory.usedMb + plannedJobs * memPerJobMb;
    const predictedPeakCpuPercent = Math.min(100, snapshot.cpu.usagePercent + plannedJobs * cpuPerJobPercent);
    const availableMemMb = snapshot.memory.freeMb;
    const maxConcurrentJobs = Math.max(1, Math.floor(availableMemMb / memPerJobMb));
    const safeToRunJobs = predictedPeakMemoryMb < snapshot.memory.totalMb * 0.85 && predictedPeakCpuPercent < 85;

    return {
      predictedPeakCpuPercent, predictedPeakMemoryMb,
      safeToRunJobs, maxConcurrentJobs,
      recommendation: safeToRunJobs
        ? `Safe to run ${Math.min(plannedJobs, maxConcurrentJobs)} concurrent jobs`
        : `Reduce to ${maxConcurrentJobs} concurrent jobs max`,
    };
  }

  getHistory(limit = 50): ResourceSnapshot[] {
    return this.snapshots.slice(-limit);
  }
}
