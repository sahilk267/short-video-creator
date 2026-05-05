import fs from "fs-extra";
import path from "path";
import cuid from "cuid";

export type PipelineStatus = "pending" | "running" | "completed" | "failed";

export interface AIScores {
  emotionalScore: number;
  qualityScore: number;
  attentionScore: number;
  engagementScore: number;
  overallScore: number;
}

export interface GeneratedVariation {
  id: string;
  jobId: string;
  hook: string;
  caption: string;
  hashtags: string[];
  humanizedOutput: Record<string, unknown>;
  emotionalDirectives: Record<string, unknown>;
  thumbnailDirectives: Record<string, unknown>;
  watermarkFilter: string;
  aiScores: AIScores;
  rank: number;
  createdAt: string;
}

export interface PipelineJob {
  id: string;
  topic: string;
  platform: string;
  tone: string;
  bulkCount: number;
  autoSchedule: boolean;
  status: PipelineStatus;
  currentStep: string;
  totalVariations: number;
  topVariations: string[];
  scheduleIds: string[];
  error?: string;
  durationMs?: number;
  createdAt: string;
  updatedAt: string;
}

export class PipelineStore {
  private jobsPath: string;
  private variationsPath: string;

  constructor(basePath: string) {
    this.jobsPath = path.join(basePath, "pipeline-jobs.json");
    this.variationsPath = path.join(basePath, "pipeline-variations.json");
    this.initFile(this.jobsPath);
    this.initFile(this.variationsPath);
  }

  private initFile(filePath: string) {
    fs.ensureFileSync(filePath);
    if (!fs.readFileSync(filePath, "utf-8").trim()) {
      fs.writeFileSync(filePath, "[]", "utf-8");
    }
  }

  private async read<T>(filePath: string): Promise<T[]> {
    const raw = await fs.readFile(filePath, "utf-8");
    if (!raw.trim()) return [];
    try { return JSON.parse(raw) as T[]; } catch { return []; }
  }

  private async write<T>(filePath: string, data: T[]): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  async createJob(params: Pick<PipelineJob, "topic" | "platform" | "tone" | "bulkCount" | "autoSchedule">): Promise<PipelineJob> {
    const jobs = await this.read<PipelineJob>(this.jobsPath);
    const now = new Date().toISOString();
    const job: PipelineJob = {
      id: `pipe_${cuid()}`,
      ...params,
      status: "pending",
      currentStep: "queued",
      totalVariations: 0,
      topVariations: [],
      scheduleIds: [],
      createdAt: now,
      updatedAt: now,
    };
    jobs.push(job);
    await this.write(this.jobsPath, jobs);
    return job;
  }

  async updateJob(id: string, updates: Partial<PipelineJob>): Promise<PipelineJob | null> {
    const jobs = await this.read<PipelineJob>(this.jobsPath);
    const idx = jobs.findIndex((j) => j.id === id);
    if (idx === -1) return null;
    jobs[idx] = { ...jobs[idx], ...updates, updatedAt: new Date().toISOString() };
    await this.write(this.jobsPath, jobs);
    return jobs[idx];
  }

  async getJob(id: string): Promise<PipelineJob | null> {
    const jobs = await this.read<PipelineJob>(this.jobsPath);
    return jobs.find((j) => j.id === id) ?? null;
  }

  async listJobs(limit = 50): Promise<PipelineJob[]> {
    const jobs = await this.read<PipelineJob>(this.jobsPath);
    return jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }

  async saveVariation(params: Omit<GeneratedVariation, "id" | "createdAt">): Promise<GeneratedVariation> {
    const variations = await this.read<GeneratedVariation>(this.variationsPath);
    const variation: GeneratedVariation = {
      id: `var_${cuid()}`,
      ...params,
      createdAt: new Date().toISOString(),
    };
    variations.push(variation);
    await this.write(this.variationsPath, variations);
    return variation;
  }

  async getVariationsForJob(jobId: string): Promise<GeneratedVariation[]> {
    const variations = await this.read<GeneratedVariation>(this.variationsPath);
    return variations.filter((v) => v.jobId === jobId).sort((a, b) => a.rank - b.rank);
  }

  async getStats(): Promise<{ totalJobs: number; completedJobs: number; failedJobs: number; totalVariations: number; avgScore: number }> {
    const [jobs, variations] = await Promise.all([
      this.read<PipelineJob>(this.jobsPath),
      this.read<GeneratedVariation>(this.variationsPath),
    ]);
    const avgScore = variations.length
      ? variations.reduce((s, v) => s + v.aiScores.overallScore, 0) / variations.length
      : 0;
    return {
      totalJobs: jobs.length,
      completedJobs: jobs.filter((j) => j.status === "completed").length,
      failedJobs: jobs.filter((j) => j.status === "failed").length,
      totalVariations: variations.length,
      avgScore: Math.round(avgScore * 100) / 100,
    };
  }
}
