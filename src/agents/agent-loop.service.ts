/**
 * Agent Loop Service - Lightweight orchestration for self-improving pipeline
 * Coordinates feedback, retries, and memory without heavy frameworks
 */

import { logger } from "../logger";
import type { FeedbackService } from "../feedback/feedback.service";
import type { MemoryService } from "../memory/memory.service";
import type { PredictiveService } from "../predict/predict.service";

export interface AgentLoopConfig {
  maxRetries: number;
  scoreThreshold: number;
  enableMemory: boolean;
  enablePrediction: boolean;
  enableFeedback: boolean;
}

export interface GenerationAttempt {
  attemptNumber: number;
  script: string;
  score: number;
  issues?: Array<{ type: string; message: string }>;
  duration?: number;
}

export interface AgentResult {
  finalScript: string;
  finalScore: number;
  attempts: GenerationAttempt[];
  improved: boolean;
  memoryUsed?: boolean;
  fallbackUsed?: boolean;
}

export class AgentLoopService {
  constructor(
    private feedbackService?: FeedbackService,
    private memoryService?: MemoryService,
    private predictiveService?: PredictiveService,
    private config: AgentLoopConfig = {
      maxRetries: 2,
      scoreThreshold: 70,
      enableMemory: false,
      enablePrediction: false,
      enableFeedback: false,
    },
  ) {}

  /**
   * Run the agent loop: generate → evaluate → retry
   */
  async runLoop(
    generatorFn: (feedback?: string) => Promise<{ script: string; score: number }>,
    context: {
      category: string;
      topic: string;
      keywords?: string[];
      style?: "News" | "Viral" | "Explainer";
    },
  ): Promise<AgentResult> {
    const attempts: GenerationAttempt[] = [];
    let bestAttempt: GenerationAttempt | null = null;
    let memoryUsed = false;
    let fallbackUsed = false;

    logger.debug({ config: this.config }, "Starting agent loop");

    // Step 1: Check memory for similar patterns
    if (this.config.enableMemory && this.memoryService) {
      const patterns = this.memoryService.getTopPatterns({
        category: context.category,
        style: context.style,
        minScore: this.config.scoreThreshold,
        limit: 3,
      });

      if (patterns.length > 0) {
        logger.info({ patternsFound: patterns.length }, "Using memory patterns as boost");
        memoryUsed = true;
        // Could use this to generate better prompt
      }
    }

    // Step 2: Predict viability
    if (this.config.enablePrediction && this.predictiveService) {
      const assessment = this.predictiveService.assessTopic(context.topic, context.category, {
        keywords: context.keywords,
        style: context.style,
      });

      if (assessment.recommendation === "reject") {
        logger.warn({ assessment }, "Topic assessment: REJECT");
        fallbackUsed = true;
        // Could fallback to alternative topic
      } else if (assessment.recommendation === "risky") {
        logger.info({ assessment }, "Topic assessment: RISKY - will retry aggressively");
      }
    }

    // Step 3: Generation loop
    for (let i = 0; i <= this.config.maxRetries; i++) {
      try {
        // Generate script (with optional feedback from previous attempt)
        let feedbackPrompt: string | undefined;
        if (
          i > 0 &&
          this.config.enableFeedback &&
          this.feedbackService &&
          bestAttempt
        ) {
          feedbackPrompt = this.feedbackService.generateImprovementPrompt({
            script: bestAttempt.script,
            score: bestAttempt.score,
            issues: bestAttempt.issues || [],
            category: context.category,
            style: context.style || "News",
            keywords: context.keywords,
          });
          logger.debug({ attemptNumber: i }, "Using feedback-guided generation");
        }

        const generated = await generatorFn(feedbackPrompt);
        const issues = this.config.enableFeedback && this.feedbackService
          ? this.feedbackService.analyzeScript(generated.script, generated.score, {
              category: context.category,
              style: context.style,
              keywords: context.keywords,
            })
          : [];

        const attempt: GenerationAttempt = {
          attemptNumber: i + 1,
          script: generated.script,
          score: generated.score,
          issues: issues.map((issue) => ({
            type: issue.type,
            message: issue.message,
          })),
        };

        attempts.push(attempt);
        logger.debug(
          { attemptNumber: i + 1, score: generated.score },
          "Generation attempt completed",
        );

        // Track best attempt
        if (!bestAttempt || generated.score > bestAttempt.score) {
          bestAttempt = attempt;
        }

        // Check if we should continue
        if (this.config.enableFeedback && this.feedbackService) {
          const shouldRetry = this.feedbackService.shouldRetry(
            generated.score,
            i,
            this.config.maxRetries,
          );

          if (!shouldRetry) {
            logger.debug({ score: generated.score, attempt: i + 1 }, "Score acceptable, stopping loop");
            break;
          }
        } else if (generated.score >= this.config.scoreThreshold) {
          logger.debug({ score: generated.score }, "Threshold reached, stopping loop");
          break;
        }
      } catch (error) {
        logger.error(
          { error: (error as Error).message, attemptNumber: i + 1 },
          "Generation attempt failed",
        );

        if (i === this.config.maxRetries) {
          throw error; // Re-throw on final attempt
        }
        // Otherwise continue to next retry
      }
    }

    if (!bestAttempt) {
      throw new Error("Agent loop failed: no successful generation");
    }

    // Step 4: Store in memory if enabled and high-scoring
    if (
      this.config.enableMemory &&
      this.memoryService &&
      bestAttempt.score >= this.config.scoreThreshold
    ) {
      await this.memoryService.savePattern(bestAttempt.script, bestAttempt.score, context.category, {
        style: context.style,
        topic: context.topic,
        keywords: context.keywords,
      });
      logger.info({ score: bestAttempt.score }, "Pattern stored in memory");
    }

    return {
      finalScript: bestAttempt.script,
      finalScore: bestAttempt.score,
      attempts,
      improved: attempts.length > 1 && bestAttempt.score > (attempts[0]?.score || 0),
      memoryUsed,
      fallbackUsed,
    };
  }
}
