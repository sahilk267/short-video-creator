/**
 * State Tracker Service - Persistent pipeline state management
 * 
 * Tracks progress across: Script Generation → TTS → Captions → Render → Publish
 * Enables resume capability on failures
 */

import fs from "fs/promises";
import path from "path";
import { logger } from "../logger";

export interface StepState {
  name: string;
  status: "pending" | "in-progress" | "success" | "failed";
  startedAt?: string;
  completedAt?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  retryCount: number;
  durationMs?: number;           // NEW: How long this step took
  failureReason?: string;        // NEW: Why it failed
  lastDecision?: string;         // NEW: Decision engine output
}

export interface VideoProcessingState {
  videoId: string;
  createdAt: string;
  lastModifiedAt: string;
  phase: "planning" | "generation" | "rendering" | "publishing" | "completed";
  steps: Record<string, StepState>;
  metrics: {
    totalRetries: number;
    totalDurationMs: number;
    fallbacksUsed: string[];
  };
}

export class StateTrackerService {
  private stateDir: string;
  private inMemoryCache: Map<string, VideoProcessingState> = new Map();

  constructor(stateDir: string = "./data/pipeline-states") {
    this.stateDir = stateDir;
  }

  /**
   * Initialize new processing state
   */
  async initialize(
    videoId: string,
    context: Record<string, unknown>,
  ): Promise<VideoProcessingState> {
    const state: VideoProcessingState = {
      videoId,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      phase: "planning",
      steps: {
        prediction: {
          name: "Prediction",
          status: "pending",
          input: context,
          retryCount: 0,
        },
        generation: {
          name: "Generation",
          status: "pending",
          input: {},
          retryCount: 0,
        },
        tts: {
          name: "Text-to-Speech",
          status: "pending",
          input: {},
          retryCount: 0,
        },
        captions: {
          name: "Captions",
          status: "pending",
          input: {},
          retryCount: 0,
        },
        render: {
          name: "Render",
          status: "pending",
          input: {},
          retryCount: 0,
        },
        publish: {
          name: "Publish",
          status: "pending",
          input: {},
          retryCount: 0,
        },
      },
      metrics: {
        totalRetries: 0,
        totalDurationMs: 0,
        fallbacksUsed: [],
      },
    };

    this.inMemoryCache.set(videoId, state);
    await this.persist(state);

    logger.info({ videoId }, "Pipeline state initialized");
    return state;
  }

  /**
   * Load existing state from disk
   */
  async load(videoId: string): Promise<VideoProcessingState | null> {
    // Check memory cache first
    if (this.inMemoryCache.has(videoId)) {
      return this.inMemoryCache.get(videoId)!;
    }

    try {
      const stateFile = this.getStateFilePath(videoId);
      const content = await fs.readFile(stateFile, "utf-8");
      const state: VideoProcessingState = JSON.parse(content);

      this.inMemoryCache.set(videoId, state);
      logger.debug({ videoId }, "State loaded from disk");
      return state;
    } catch (error) {
      logger.debug({ videoId, error }, "State file not found or invalid");
      return null;
    }
  }

  /**
   * Update step status and output
   */
  async updateStep(
    videoId: string,
    stepName: string,
    updates: {
      status?: StepState["status"];
      output?: Record<string, unknown>;
      error?: string;
      retryIncrement?: boolean;
      failureReason?: string;      // NEW: Why it failed
      lastDecision?: string;       // NEW: Decision engine output
    },
  ): Promise<VideoProcessingState | null> {
    let state: VideoProcessingState | null | undefined = this.inMemoryCache.get(videoId);

    if (!state) {
      state = await this.load(videoId);
    }

    if (!state) {
      logger.warn({ videoId }, "State not found");
      return null;
    }

    const step = state.steps[stepName];
    if (!step) {
      logger.warn({ videoId, stepName }, "Step not found");
      return null;
    }

    // Update step
    if (updates.status) {
      step.status = updates.status;
      if (updates.status === "in-progress" && !step.startedAt) {
        step.startedAt = new Date().toISOString();
      }
      if (["success", "failed"].includes(updates.status) && !step.completedAt) {
        step.completedAt = new Date().toISOString();
        // Automatically calculate duration
        if (step.startedAt) {
          step.durationMs = new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime();
        }
      }
    }

    if (updates.output) {
      step.output = updates.output;
    }

    if (updates.error) {
      step.error = updates.error;
    }

    // NEW: Record failure reason
    if (updates.failureReason) {
      step.failureReason = updates.failureReason;
    }

    // NEW: Record decision engine output
    if (updates.lastDecision) {
      step.lastDecision = updates.lastDecision;
    }

    if (updates.retryIncrement) {
      step.retryCount += 1;
      state.metrics.totalRetries += 1;
    }

    // Update phase based on current step status
    if (stepName === "generation" && updates.status === "success") {
      state.phase = "generation";
    } else if (stepName === "render" && updates.status === "success") {
      state.phase = "rendering";
    } else if (stepName === "publish" && updates.status === "success") {
      state.phase = "publishing";
    }

    state.lastModifiedAt = new Date().toISOString();
    await this.persist(state);

    logger.debug({ videoId, stepName, status: updates.status }, "Step updated");
    return state;
  }

  /**
   * Record fallback usage for observability
   */
  async recordFallbackUsage(
    videoId: string,
    fallbackName: string,
  ): Promise<void> {
    let state: VideoProcessingState | null | undefined = this.inMemoryCache.get(videoId);

    if (!state) {
      state = await this.load(videoId);
    }

    if (!state) {
      logger.warn({ videoId }, "State not found");
      return;
    }

    state.metrics.fallbacksUsed.push(fallbackName);
    state.lastModifiedAt = new Date().toISOString();
    await this.persist(state);

    logger.debug({ videoId, fallbackName }, "Fallback recorded");
  }

  /**
   * Get next step to resume from
   */
  getNextStepToResume(state: VideoProcessingState): string | null {
    const stepOrder = [
      "prediction",
      "generation",
      "tts",
      "captions",
      "render",
      "publish",
    ];

    for (const stepName of stepOrder) {
      const step = state.steps[stepName];
      if (!step || step.status !== "success") {
        return stepName;
      }
    }

    return null; // All steps complete
  }

  /**
   * Check if pipeline can resume (no critical failures)
   */
  canResume(state: VideoProcessingState): boolean {
    // Can't resume if generation failed too many times
    const generationStep = state.steps.generation;
    if (generationStep && generationStep.retryCount >= 3) {
      logger.info(
        { retries: generationStep.retryCount },
        "Too many generation retries",
      );
      return false;
    }

    // Can't resume if prediction marked failure critical
    const predictionStep = state.steps.prediction;
    if (predictionStep && predictionStep.status === "failed" && predictionStep.error?.includes("critical")) {
      logger.info({}, "Critical prediction failure");
      return false;
    }

    return true;
  }

  /**
   * Get pipeline health score (0-100)
   */
  getHealthScore(state: VideoProcessingState): number {
    const steps = Object.values(state.steps);
    const completedSteps = steps.filter((s) => s.status === "success").length;
    const failedSteps = steps.filter((s) => s.status === "failed").length;

    const completionPercent = (completedSteps / steps.length) * 100;
    const failurePenalty = failedSteps * 15;

    return Math.max(0, Math.min(100, completionPercent - failurePenalty));
  }

  /**
   * Clean old states (> 30 days)
   */
  async cleanOldStates(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      await fs.mkdir(this.stateDir, { recursive: true });
      const files = await fs.readdir(this.stateDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.stateDir, file);
        const stat = await fs.stat(filePath);
        const age = Date.now() - stat.mtimeMs;

        if (age > maxAgeMs) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      logger.info({ deletedCount }, "Old states cleaned");
      return deletedCount;
    } catch (error) {
      logger.warn({ error }, "Failed to clean old states");
      return 0;
    }
  }

  /**
   * Get all active states (in-progress or pending)
   */
  async getActiveStates(): Promise<VideoProcessingState[]> {
    try {
      await fs.mkdir(this.stateDir, { recursive: true });
      const files = await fs.readdir(this.stateDir);
      const active: VideoProcessingState[] = [];

      for (const file of files) {
        const filePath = path.join(this.stateDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        const state: VideoProcessingState = JSON.parse(content);

        if (state.phase !== "completed") {
          active.push(state);
        }
      }

      return active;
    } catch (error) {
      logger.warn({ error }, "Failed to get active states");
      return [];
    }
  }

  /**
   * Export state for debugging
   */
  exportDebugInfo(state: VideoProcessingState): Record<string, unknown> {
    return {
      videoId: state.videoId,
      phase: state.phase,
      createdAt: state.createdAt,
      lastModifiedAt: state.lastModifiedAt,
      stepsStatus: Object.fromEntries(
        Object.entries(state.steps).map(([name, step]) => [
          name,
          {
            status: step.status,
            retryCount: step.retryCount,
            error: step.error,
          },
        ])
      ),
      metrics: state.metrics,
      health: this.getHealthScore(state),
      canResume: this.canResume(state),
      nextStep: this.getNextStepToResume(state),
    };
  }

  /**
   * Private: save state to disk
   */
  private async persist(state: VideoProcessingState): Promise<void> {
    try {
      await fs.mkdir(this.stateDir, { recursive: true });
      const filePath = this.getStateFilePath(state.videoId);
      await fs.writeFile(filePath, JSON.stringify(state, null, 2), "utf-8");
    } catch (error) {
      logger.warn({ error }, "Failed to persist state");
    }
  }

  /**
   * Private: get state file path
   */
  private getStateFilePath(videoId: string): string {
    return path.join(this.stateDir, `${videoId}.json`);
  }
}
