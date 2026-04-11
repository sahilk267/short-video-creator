/**
 * Orchestrator Service - Central coordination for intelligent pipeline
 * 
 * Connects Memory → Predictive → Feedback → Generation → Assets → Metadata
 * Implements smart routing and caching between services
 * NEW: Integrates DecisionEngine for goal-driven decisions
 */

import { logger } from "../logger";
import type { MemoryService } from "../memory/memory.service";
import type { FeedbackService } from "../feedback/feedback.service";
import type { PredictiveService } from "../predict/predict.service";
import type { AssetService } from "../assets/asset.service";
import type { MetadataService } from "../metadata/metadata.service";
import type { DecisionEngineService } from "../decision/decision-engine.service";
import type { GoalService } from "../goal/goal.service";
import type { AiLlmGenerator } from "../script-generator/AiLlmGenerator";

export interface OrchestratorContext {
  videoId: string;
  category: string;
  topic: string;
  keywords?: string[];
  style?: "News" | "Viral" | "Explainer";
  platform?: string;
  language?: string;
  goalType?: "maximize_engagement" | "fast_generation" | "cost_optimized" | "balanced";
}

export interface PipelineStep {
  name: string;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  startTime?: number;
  endTime?: number;
  durationMs?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface PipelineState {
  videoId: string;
  startedAt: string;
  steps: Record<string, PipelineStep>;
  currentStep: string;
  metadata?: Record<string, unknown>;
}

export class OrchestratorService {
  private states: Map<string, PipelineState> = new Map();
  private config: {
    enableMemory: boolean;
    enablePrediction: boolean;
    enableFeedback: boolean;
    enableAssets: boolean;
    enableMetadata: boolean;
    enableDecisionEngine: boolean;
    enableGoalSystem: boolean;
    maxRetries: number;
    scoreThreshold: number;
  };

  constructor(
    private memory?: MemoryService,
    private feedback?: FeedbackService,
    private predictive?: PredictiveService,
    private assets?: AssetService,
    private metadata?: MetadataService,
    private decisionEngine?: DecisionEngineService,
    private goalService?: GoalService,
    configOverrides?: Partial<OrchestratorService["config"]>,
  ) {
    this.config = {
      enableMemory: !!memory,
      enablePrediction: !!predictive,
      enableFeedback: !!feedback,
      enableAssets: !!assets,
      enableMetadata: !!metadata,
      enableDecisionEngine: !!decisionEngine,
      enableGoalSystem: !!goalService,
      maxRetries: 2,
      scoreThreshold: 70,
      ...configOverrides,
    };
  }

  /**
   * Initialize pipeline state for a video
   */
  initializePipeline(context: OrchestratorContext): PipelineState {
    const state: PipelineState = {
      videoId: context.videoId,
      startedAt: new Date().toISOString(),
      steps: {
        prediction: { name: "Prediction", status: "pending" },
        generation: { name: "Generation", status: "pending" },
        feedback: { name: "Feedback", status: "pending" },
        assets: { name: "Assets", status: "pending" },
        metadata: { name: "Metadata", status: "pending" },
      },
      currentStep: "prediction",
      metadata: { ...context },
    };

    this.states.set(context.videoId, state);
    logger.info({ videoId: context.videoId }, "Pipeline initialized");
    return state;
  }

  /**
   * Get best patterns from memory for generation boost
   */
  getMemoryBoost(
    category: string,
    keywords?: string[],
    limit: number = 3,
  ): { patterns: Array<{ text: string; score: number }>; boost: string } {
    if (!this.memory || !this.config.enableMemory) {
      return { patterns: [], boost: "" };
    }

    try {
      let patterns = this.memory.getTopPatterns({
        category,
        minScore: this.config.scoreThreshold,
        limit,
      });

      // If keywords provided, find similar patterns
      if (keywords && keywords.length > 0) {
        const similar = this.memory.getSimilarPatterns(keywords, category, limit);
        if (similar.length > 0) {
          patterns = similar.slice(0, limit);
        }
      }

      if (patterns.length === 0) {
        return { patterns: [], boost: "" };
      }

      const boost = this.buildMemoryPromptBoost(patterns, category);
      logger.debug(
        { category, patternCount: patterns.length, boost },
        "Memory boost generated",
      );

      return {
        patterns: patterns.map((p) => ({ text: p.script, score: p.score })),
        boost,
      };
    } catch (error) {
      logger.warn({ error, category }, "Memory boost failed");
      return { patterns: [], boost: "" };
    }
  }

  /**
   * Check topic viability using predictive service
   */
  async assessTopicViability(
    topic: string,
    category: string,
    keywords?: string[],
  ): Promise<{ viable: boolean; score: number; reason: string }> {
    if (!this.predictive || !this.config.enablePrediction) {
      return { viable: true, score: 50, reason: "Predictive disabled" };
    }

    try {
      const assessment = this.predictive.assessTopic(topic, category, {
        keywords,
      });

      if (assessment.recommendation === "reject") {
        logger.info({ topic, category, score: assessment.score }, "Topic rejected");
        return {
          viable: false,
          score: assessment.score,
          reason: assessment.reasons[0] || "Poor viability",
        };
      }

      logger.debug({ topic, category, score: assessment.score }, "Topic viable");
      return {
        viable: true,
        score: assessment.score,
        reason: assessment.reasons[0] || "Acceptable",
      };
    } catch (error) {
      logger.warn({ error, topic }, "Topic assessment failed");
      return { viable: true, score: 50, reason: "Assessment error" };
    }
  }

  /**
   * Smart decision: full retry or partial fix only
   * NEW: Uses DecisionEngine if enabled, otherwise falls back to basic logic
   */
  decideFeedbackStrategy(
    script: string,
    score: number,
    category: string,
    retryCount: number,
    issues?: Array<{ type: string; severity: string; message: string }>,
  ): {
    strategy: "skip" | "retry_hook" | "retry_keywords" | "retry_full" | "accept";
    rationale: string;
  } {
    if (!this.feedback || !this.config.enableFeedback) {
      return { strategy: "accept", rationale: "Feedback disabled" };
    }

    // NEW: Use DecisionEngine if enabled
    if (this.decisionEngine && this.config.enableDecisionEngine) {
      const analysisIssues = (issues || this.feedback.analyzeScript(script, score, { category })) as Array<{
        type: string;
        severity: "high" | "low" | "medium";
        message: string;
      }>;

      const decision = this.decisionEngine.decide({
        step: "generation",
        score,
        issues: analysisIssues,
        retryCount,
        maxRetries: this.config.maxRetries,
        category,
        budget: "quality",
      });

      logger.info(
        { action: decision.action, reason: decision.reason },
        "Decision Engine made decision"
      );

      // Map DecisionEngine actions to old strategy names for backward compatibility
      const strategyMap: Record<string, any> = {
        "accept": "accept",
        "retry_full": "retry_full",
        "fix_hook": "retry_hook",
        "fix_structure": "retry_full",
        "refetch_assets": "accept", // Assets handled separately
        "skip": "accept",
      };

      return {
        strategy: strategyMap[decision.action] || "accept",
        rationale: decision.reason,
      };
    }

    // FALLBACK: Original logic when DecisionEngine disabled

    // Category-based thresholds
    const thresholdMap: Record<string, number> = {
      "News": 60,
      "Viral": 75,
      "Explainer": 70,
      "Cricket": 72,
      "Technology": 65,
      "Entertainment": 68,
    };

    const threshold = thresholdMap[category] || this.config.scoreThreshold;

    // Max retry check
    if (retryCount >= this.config.maxRetries) {
      logger.debug({ retryCount, maxRetries: this.config.maxRetries }, "Max retries reached");
      return { strategy: "accept", rationale: "Max retries reached" };
    }

    // Score-based decision
    if (score >= threshold) {
      logger.debug({ score, threshold }, "Script acceptable");
      return { strategy: "accept", rationale: `Score ${score} >= threshold ${threshold}` };
    }

    if (score < 40) {
      logger.info({ score }, "Score too low, full retry");
      return { strategy: "retry_full", rationale: "Score critically low" };
    }

    // Partial improvement strategy: identify weakest component
    const analysisIssues = issues || this.feedback.analyzeScript(script, score, { category });

    if (analysisIssues.length === 0) {
      return { strategy: "accept", rationale: "No issues detected" };
    }

    const hookIssues = analysisIssues.filter(
      (i) => i.type === "hook" && i.severity === "high"
    );
    if (hookIssues.length > 0) {
      logger.debug({}, "Weak hook detected, partial retry");
      return { strategy: "retry_hook", rationale: "Hook effectiveness low" };
    }

    const keywordIssues = analysisIssues.filter(
      (i) => i.type === "keywords" && i.severity === "high"
    );
    if (keywordIssues.length > 0) {
      logger.debug({}, "Weak keywords, partial retry");
      return { strategy: "retry_keywords", rationale: "Keyword coverage low" };
    }

    logger.debug({ issueCount: analysisIssues.length }, "Multiple issues, full retry");
    return { strategy: "retry_full", rationale: `${analysisIssues.length} issues detected` };
  }

  /**
   * Get best assets with relevance scoring
   */
  async getBestAssets(
    searchTerms: string[],
    context: OrchestratorContext,
    usedAssets?: Set<string>,
  ): Promise<{ url?: string; path?: string; relevance: number; source: string }> {
    if (!this.assets || !this.config.enableAssets) {
      return { relevance: 0, source: "none" };
    }

    try {
      const asset = await this.assets.getVideoWithFallback(searchTerms, {
        duration: 5,
      } as any);

      if (!asset) {
        return { relevance: 0, source: "none" };
      }

      // Track used assets for duplicate prevention
      const assetKey = asset.url || asset.path || "";
      if (usedAssets?.has(assetKey)) {
        logger.debug({ assetKey }, "Asset already used, skipping");
        return { relevance: 0, source: "duplicate" };
      }

      usedAssets?.add(assetKey);

      // Score relevance based on keyword matching
      const relevance = this.scoreAssetRelevance(searchTerms, asset.keywords || []);

      logger.debug({ source: asset.source, relevance }, "Asset selected");
      return {
        url: asset.url,
        path: asset.path,
        relevance,
        source: asset.source,
      };
    } catch (error) {
      logger.warn({ error }, "Asset selection failed");
      return { relevance: 0, source: "error" };
    }
  }

  /**
   * Generate optimized metadata with variants
   */
  generateOptimizedMetadata(
    script: string,
    category: string,
    context: OrchestratorContext,
  ): {
    primary: Record<string, unknown>;
    variants?: Record<string, unknown>[];
    confidence: number;
  } {
    if (!this.metadata || !this.config.enableMetadata) {
      return { primary: {}, confidence: 0 };
    }

    try {
      const platform = (context.platform || "youtube") as any;

      const primary = this.metadata.generateMetadata(script, platform, {
        category,
        keywords: context.keywords,
        topic: context.topic,
        style: context.style,
      });

      // Generate 1-2 variants for A/B testing readiness
      const variants = [];

      // Variant 1: More keyword-focused (YouTube SEO)
      if (platform === "youtube" && context.keywords && context.keywords.length > 0) {
        variants.push({
          title: `${context.keywords[0]}: ${primary.title}`,
          description: `Topics: ${context.keywords.join(", ")}\n\n${primary.description}`,
        });
      }

      // Variant 2: Shorter/catchier (for social)
      if (["instagram", "tiktok"].includes(platform) && primary.title) {
        variants.push({
          title: (primary.title as string).substring(0, 30) + "...",
          description: (primary.description as string).substring(0, 100),
        });
      }

      logger.debug(
        { platform, hasVariants: variants.length > 0 },
        "Metadata generated",
      );

      return {
        primary: (primary as unknown) as Record<string, unknown>,
        variants: variants.length > 0 ? variants : undefined,
        confidence: 0.85,
      };
    } catch (error) {
      logger.warn({ error }, "Metadata generation failed");
      return { primary: {}, confidence: 0 };
    }
  }

  /**
   * Update step status in pipeline
   */
  updateStep(
    videoId: string,
    stepName: string,
    status: PipelineStep["status"],
    details?: { input?: Record<string, unknown>; output?: Record<string, unknown>; error?: string },
  ): void {
    const state = this.states.get(videoId);
    if (!state) {
      logger.warn({ videoId }, "Pipeline state not found");
      return;
    }

    if (!state.steps[stepName]) {
      state.steps[stepName] = { name: stepName, status };
    }

    const step = state.steps[stepName];
    const now = Date.now();

    if (status === "running" && !step.startTime) {
      step.startTime = now;
    }

    if (["success", "failed", "skipped"].includes(status) && step.startTime) {
      step.endTime = now;
      step.durationMs = now - step.startTime;
    }

    step.status = status;
    if (details?.input) step.input = details.input;
    if (details?.output) step.output = details.output;
    if (details?.error) step.error = details.error;

    state.currentStep = stepName;
  }

  /**
   * Get pipeline statistics for monitoring
   */
  getPipelineStats(videoId: string): {
    totalDurationMs: number;
    steps: Array<{ name: string; durationMs?: number; status: string }>;
    successRate: number;
  } {
    const state = this.states.get(videoId);
    if (!state) {
      return { totalDurationMs: 0, steps: [], successRate: 0 };
    }

    const steps = Object.values(state.steps).map((step) => ({
      name: step.name,
      durationMs: step.durationMs,
      status: step.status,
    }));

    const totalDurationMs =
      (state.steps.prediction?.endTime || 0) -
      Date.parse(state.startedAt);

    const successCount = Object.values(state.steps).filter(
      (s) => s.status === "success"
    ).length;
    const successRate = successCount / Object.keys(state.steps).length;

    return {
      totalDurationMs: Math.max(0, totalDurationMs),
      steps,
      successRate,
    };
  }

  /**
   * Private helper: build memory boost prompt
   */
  private buildMemoryPromptBoost(
    patterns: Array<{ script: string; score: number }>,
    category: string,
  ): string {
    if (patterns.length === 0) return "";

    const topPattern = patterns[0];
    return (
      `\n\nInspired by high-performing ${category} content (score: ${topPattern.score}):\n` +
      `Style example: ${topPattern.script.substring(0, 100)}...\n`
    );
  }

  /**
   * Private helper: score asset relevance
   */
  private scoreAssetRelevance(searchTerms: string[], assetKeywords: string[]): number {
    if (assetKeywords.length === 0) return 0.5; // Default medium relevance

    const matched = searchTerms.filter((term) =>
      assetKeywords.some((kw) => kw.toLowerCase().includes(term.toLowerCase()))
    ).length;

    return Math.min(1, matched / Math.max(1, searchTerms.length));
  }

  /**
   * NEW: Select goal and apply its constraints
   */
  applyGoalToConfig(
    goalType: "maximize_engagement" | "fast_generation" | "cost_optimized" | "balanced" | undefined,
  ): void {
    if (!this.goalService || !this.config.enableGoalSystem) {
      return;
    }

    const goal = this.goalService.getGoal(goalType || "balanced");
    if (!goal) {
      logger.warn({ goalType }, "Goal not found");
      return;
    }

    // Apply goal constraints to orchestrator config
    this.config.maxRetries = goal.maxRetries;
    this.config.scoreThreshold = goal.scoreThreshold;

    logger.info(
      {
        goal: goal.name,
        maxRetries: goal.maxRetries,
        scoreThreshold: goal.scoreThreshold,
      },
      "Goal applied to configuration"
    );
  }

  /**
   * NEW: Get effective max retries based on context and goal
   */
  getEffectiveMaxRetries(stepName: string): number {
    if (!this.goalService || !this.config.enableGoalSystem) {
      return this.config.maxRetries;
    }

    // Asset retries have separate budget
    if (stepName === "assets") {
      // Return a smaller budget for asset retries to avoid thrashing
      return Math.max(1, this.config.maxRetries - 1);
    }

    return this.config.maxRetries;
  }

  /**
   * NEW: Get effective score threshold based on goal
   */
  getEffectiveScoreThreshold(): number {
    return this.config.scoreThreshold;
  }

  /**
   * NEW: Check if decision engine should avoid repeated decisions
   */
  shouldThrottleRetry(
    decisionHistory: Array<{ action: string; timestamp: number }>,
    timeWindowMs: number = 5000,
  ): boolean {
    const recent = decisionHistory.filter(
      (d) => Date.now() - d.timestamp < timeWindowMs
    );

    // If same decision repeated 3+ times in 5 seconds, throttle
    if (recent.length >= 3) {
      const firstAction = recent[0].action;
      if (recent.every((r) => r.action === firstAction)) {
        logger.warn(
          { action: firstAction, count: recent.length },
          "Decision thrashing detected, throttling"
        );
        return true;
      }
    }

    return false;
  }
}
