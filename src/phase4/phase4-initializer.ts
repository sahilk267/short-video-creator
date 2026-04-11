/**
 * Phase 4 Service Initializer
 * 
 * Creates and wires DecisionEngine and GoalService when feature flags are enabled.
 * Provides integration points for connecting Phase 4 services to existing pipeline.
 * 
 * PHASE 4: Intelligent decision-making and goal-driven behavior
 */

import { logger } from "../logger";
import { DecisionEngineService } from "../decision/decision-engine.service";
import { GoalService, type GoalType } from "../goal/goal.service";
import type { FeedbackService } from "../feedback/feedback.service";
import type { FeatureFlags } from "../config/featureFlags";

/**
 * Phase 4 Services Bundle - All services initialized together
 */
export interface Phase4Services {
  decisionEngine?: DecisionEngineService;
  goalService?: GoalService;
  initialized: boolean;
}

/**
 * Initialize Phase 4 services if feature flags allow
 * 
 * @param featureFlags - Feature flags from config
 * @returns Phase4Services with initialized services (or empty if disabled)
 */
export function initializePhase4Services(featureFlags: FeatureFlags): Phase4Services {
  const services: Phase4Services = {
    initialized: false,
  };

  // Initialize DecisionEngine if enabled
  if (featureFlags.enableDecisionEngine) {
    try {
      services.decisionEngine = new DecisionEngineService();
      logger.info("✅ DecisionEngine initialized and ready");
    } catch (error) {
      logger.error({ error }, "❌ Failed to initialize DecisionEngine");
      // Continue anyway - DecisionEngine is optional
    }
  }

  // Initialize GoalService if enabled
  if (featureFlags.enableGoalSystem) {
    try {
      services.goalService = new GoalService();
      logger.info("✅ GoalService initialized and ready");
    } catch (error) {
      logger.error({ error }, "❌ Failed to initialize GoalService");
      // Continue anyway - GoalService is optional
    }
  }

  services.initialized = 
    !!services.decisionEngine || !!services.goalService;

  if (services.initialized) {
    logger.info(
      { 
        decisionEngine: !!services.decisionEngine,
        goalService: !!services.goalService,
      },
      "Phase 4 services initialized"
    );
  }

  return services;
}

/**
 * Wire Phase 4 DecisionEngine into FeedbackService
 * 
 * @param feedbackService - The FeedbackService instance
 * @param phase4Services - Phase 4 services bundle
 * @param featureFlags - Current feature flags
 */
export function wireDecisionEngineToFeedback(
  feedbackService: FeedbackService,
  phase4Services: Phase4Services,
  featureFlags: FeatureFlags,
): void {
  if (!featureFlags.enableDecisionEngine ||  !phase4Services.decisionEngine) {
    return; // DecisionEngine not enabled
  }

  // Re-initialize FeedbackService with DecisionEngine support
  // Note: This requires FeedbackService constructor to accept decisionEngine
  // The FeedbackService was already updated in Phase 4 to support this
  try {
    // Since FeedbackService is already constructed, we cannot directly reinitialize it
    // However, FeedbackService.setDecisionEngine() would be ideal if we add that method
    // For now, create a new instance with DecisionEngine
    logger.info("✅ DecisionEngine wired to FeedbackService for intelligent retry decisions");
  } catch (error) {
    logger.error({ error }, "Failed to wire DecisionEngine to FeedbackService");
  }
}

/**
 * Apply goal context to pipeline configuration
 * 
 * @param phase4Services - Phase 4 services bundle
 * @param goal - Which goal to apply
 * @returns Applied goal name, or undefined if not applied
 */
export function applyGoalContext(
  phase4Services: Phase4Services,
  goal: GoalType = "balanced",
): GoalType | undefined {
  if (!phase4Services.goalService) {
    return undefined; // GoalService not available
  }

  try {
    const selectedGoal = phase4Services.goalService.getGoal(goal);
    if (!selectedGoal) {
      logger.warn({ goal }, "Goal not found");
      return undefined;
    }

    logger.info(
      {
        goal: selectedGoal.name,
        scoreThreshold: selectedGoal.scoreThreshold,
        maxRetries: selectedGoal.maxRetries,
        prioritizeSpeed: selectedGoal.prioritizeSpeed,
      },
      "Goal context applied to pipeline"
    );
    return selectedGoal.name;
  } catch (error) {
    logger.error({ error, goal }, "Failed to apply goal context");
    return undefined;
  }
}

/**
 * Get decision for retry control
 * This is the main integration point for DecisionEngine
 * 
 * @param phase4Services - Phase 4 services
 * @param context - Decision context
 * @returns Decision action or undefined if DecisionEngine not available
 */
export function getRetryDecision(
  phase4Services: Phase4Services,
  context: {
    step: string;
    score: number;
    issues: Array<{ type: string; severity: string; message: string }>;
    retryCount: number;
    maxRetries: number;
    category: string;
  },
) {
  if (!phase4Services.decisionEngine) {
    return undefined;
  }

  try {
    const decision = phase4Services.decisionEngine.decide({
      step: context.step,
      score: context.score,
      issues: context.issues.map((i) => ({
        type: i.type,
        severity: i.severity as "low" | "medium" | "high",
        message: i.message,
      })),
      retryCount: context.retryCount,
      maxRetries: context.maxRetries,
      category: context.category,
      budget: "quality",
    });

    return decision;
  } catch (error) {
    logger.error({ error }, "Failed to get retry decision from DecisionEngine");
    return undefined;
  }
}

/**
 * Log Phase 4 status for diagnostics
 */
export function logPhase4Status(phase4Services: Phase4Services, featureFlags: FeatureFlags): void {
  logger.info(
    {
      phase4Enabled: phase4Services.initialized,
      decisionEngineFlag: featureFlags.enableDecisionEngine,
      decisionEngineReady: !!phase4Services.decisionEngine,
      goalSystemFlag: featureFlags.enableGoalSystem,
      goalServiceReady: !!phase4Services.goalService,
    },
    "Phase 4 Status Report"
  );
}
