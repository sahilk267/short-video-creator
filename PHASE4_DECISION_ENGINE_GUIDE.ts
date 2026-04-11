/**
 * PHASE 4: GOAL-DRIVEN DECISION-MAKING SYSTEM
 * 
 * Complete guide to using DecisionEngine + GoalService
 * 
 * This upgrade moves the system from:
 * "naive retry logic" → "goal-driven intelligent decisions"
 * 
 * Key concept: Different users have different needs
 * - maximize_engagement: High quality, willing to wait (news media)
 * - fast_generation: Speed matters, good-enough okay (viral feeds)
 * - cost_optimized: Minimize CPU/API calls (budget-conscious)
 * - balanced: Default, reasonable middle ground
 */

// ============================================================
// PART 1: BASIC SETUP - Initialize with new services
// ============================================================

/**
 * Example 1: Initialize orchestrator with DecisionEngine + GoalService
 */
async function exampleSetupWithDecisionEngine() {
  import { OrchestratorService } from "./src/orchestrator/orchestrator.service";
  import { DecisionEngineService } from "./src/decision/decision-engine.service";
  import { GoalService } from "./src/goal/goal.service";
  import { MemoryService } from "./src/memory/memory.service";
  import { FeedbackService } from "./src/feedback/feedback.service";
  import { PredictiveService } from "./src/predict/predict.service";
  import { AssetService } from "./src/assets/asset.service";
  import { MetadataService } from "./src/metadata/metadata.service";

  // Initialize individual services
  const memory = new MemoryService("data/memory");
  const feedback = new FeedbackService();
  const predictive = new PredictiveService(memory);
  const assets = new AssetService("data");
  const metadata = new MetadataService();

  // NEW: Initialize decision engine and goal service
  const decisionEngine = new DecisionEngineService();
  const goalService = new GoalService();

  // Create orchestrator with ALL services
  const orchestrator = new OrchestratorService(
    memory,
    feedback,
    predictive,
    assets,
    metadata,
    decisionEngine,
    goalService,
    {
      enableMemory: true,
      enablePrediction: true,
      enableFeedback: true,
      enableAssets: true,
      enableMetadata: true,
      enableDecisionEngine: true,  // NEW
      enableGoalSystem: true,      // NEW
      maxRetries: 2,
      scoreThreshold: 70,
    }
  );

  return { orchestrator, decisionEngine, goalService };
}

// ============================================================
// PART 2: GOAL-DRIVEN BEHAVIOR - How goals change behavior
// ============================================================

/**
 * Example 2: News organization wants MAXIMUM engagement
 * Goal: maximize_engagement → score threshold 75, max 3 retries
 */
async function exampleMaximizeEngagementGoal() {
  const { orchestrator, goalService } = await exampleSetupWithDecisionEngine();

  // Select goal for news content
  const context = {
    videoId: "news_001",
    category: "News",
    topic: "Breaking: Government announces new policy",
    keywords: ["politics", "policy", "government"],
    goalType: "maximize_engagement" as const,
  };

  // Apply goal to orchestrator config
  orchestrator.applyGoalToConfig(context.goalType);

  // Now when decideFeedbackStrategy is called:
  // - Will accept at score >= 75 (not 70)
  // - Will allow up to 3 retries (not 2)
  // - Decision engine will prioritize quality over speed

  // Get goal details for logging/monitoring
  const goal = goalService.getGoal("maximize_engagement");
  console.log(`
    Goal: ${goal?.name}
    Threshold: ${goal?.scoreThreshold}
    Max Retries: ${goal?.maxRetries}
    Budget: ${goal?.retryBudget}
    Priority: Quality over speed
  `);
}

/**
 * Example 3: Viral TikTok feed wants FAST generation
 * Goal: fast_generation → score threshold 60, max 1 retry
 */
async function exampleFastGenerationGoal() {
  const { orchestrator, goalService } = await exampleSetupWithDecisionEngine();

  const context = {
    videoId: "tiktok_001",
    category: "Viral",
    topic: "Funny pet video compilation",
    keywords: ["pets", "funny", "viral"],
    goalType: "fast_generation" as const,
  };

  orchestrator.applyGoalToConfig(context.goalType);

  // With fast_generation goal:
  // - Will accept at score >= 60 (not 75)
  // - Will allow only 1 retry (not 3)
  // - Decision engine will suggest "fix_hook" partial fixes instead of "retry_full"
  // - Total generation time: ~30 seconds max

  const goal = goalService.getGoal("fast_generation");
  console.log(`
    Goal: ${goal?.name}
    Threshold: ${goal?.scoreThreshold}
    Max Retries: ${goal?.maxRetries}
    Budget: ${goal?.retryBudget}
    Priority: Speed over quality
  `);
}

/**
 * Example 4: Live cricket coverage wants COST optimization
 * Goal: cost_optimized → score threshold 65, max 2 retries, minimal API calls
 */
async function exampleCostOptimizedGoal() {
  const { orchestrator, goalService } = await exampleSetupWithDecisionEngine();

  const context = {
    videoId: "cricket_live_001",
    category: "Cricket",
    topic: "Live: India vs Australia T20",
    keywords: ["cricket", "india", "australia", "live"],
    isLiveEvent: true,
    goalType: "cost_optimized" as const,
  };

  orchestrator.applyGoalToConfig(context.goalType);

  // cost_optimized goal:
  // - Minimal Pexels API calls (try local assets first)
  // - Fewer retries to reduce LLM requests
  // - Prioritize cached patterns from memory
  // - Skip expensive operations if score > 65

  const goal = goalService.getGoal("cost_optimized");
  console.log(`
    Goal: ${goal?.name}
    Threshold: ${goal?.scoreThreshold}
    Max Retries: ${goal?.maxRetries}
    Budget: ${goal?.retryBudget}
    API Calls: Minimal
    Priority: Cost efficiency
  `);
}

// ============================================================
// PART 3: DECISION ENGINE IN ACTION - How it makes decisions
// ============================================================

/**
 * Example 5: Decision engine evaluates a weak script
 */
async function exampleDecisionEngineEvaluation() {
  import { DecisionEngineService } from "./src/decision/decision-engine.service";

  const engine = new DecisionEngineService();

  // Scenario: Generated script scored 55 (below threshold)
  const context = {
    step: "generation",
    score: 55,
    issues: [
      { type: "hook", severity: "high" as const, message: "Opening is weak" },
    ],
    retryCount: 0,
    maxRetries: 2,
    category: "News",
    budget: "quality" as const,
  };

  const decision = engine.decide(context);

  console.log(`
    Score: ${context.score}
    Issues: ${context.issues.length}
    
    Decision: ${decision.action}
    Reason: ${decision.reason}
    Cost: ${decision.estimatedCost}
    
    Action breakdown:
    - Score 55 < threshold 60
    - High-severity hook issue detected
    - Retry count 0 < max 2
    - Suggestion: Fix only hook (low cost vs full retry)
  `);

  // Expected output:
  // Decision: "fix_hook"
  // Reason: "Hook effectiveness critically low"
  // Cost: "low"
}

/**
 * Example 6: Decision engine on good script
 */
async function exampleDecisionEngineGoodScript() {
  import { DecisionEngineService } from "./src/decision/decision-engine.service";

  const engine = new DecisionEngineService();

  const context = {
    step: "generation",
    score: 78,
    issues: [],
    retryCount: 0,
    maxRetries: 2,
    category: "Viral",
    budget: "quality" as const,
  };

  const decision = engine.decide(context);

  console.log(`
    Score: ${context.score}
    Issues: ${context.issues.length}
    
    Decision: ${decision.action}
    Reason: ${decision.reason}
    
    -> Accept immediately, no retry needed
  `);
}

/**
 * Example 7: Decision engine after max retries
 */
async function exampleDecisionEngineMaxRetries() {
  import { DecisionEngineService } from "./src/decision/decision-engine.service";

  const engine = new DecisionEngineService();

  const context = {
    step: "generation",
    score: 55,
    issues: [
      { type: "hook", severity: "high" as const, message: "Still weak" },
      { type: "structure", severity: "high" as const, message: "Confusing flow" },
    ],
    retryCount: 2,  // Already tried twice
    maxRetries: 2,  // Can't retry again
    category: "News",
    budget: "quality" as const,
  };

  const decision = engine.decide(context);

  console.log(`
    Score: ${context.score}
    Retry: ${context.retryCount}/${context.maxRetries}
    
    Decision: ${decision.action}
    Reason: ${decision.reason}
    
    -> Even with issues, accept (can't retry further)
  `);
}

// ============================================================
// PART 4: INTEGRATION WITH REQUEST HANDLERS
// ============================================================

/**
 * Example 8: Wire into video generation endpoint with goals
 */
async function exampleVideoGenerationWithGoals(
  scriptGenerationService,
  orchestrator,
  stateTracker
) {
  // In Express handler:
  // app.post("/videos/generate", async (req, res) => {

  const { topic, category, keywords, platform, goal } = {} as any; // req.body
  const videoId = "video_" + Date.now();

  // 1. Initialize state tracker
  const state = await stateTracker.initialize(videoId, {
    topic,
    category,
    keywords,
    platform,
    goal,
  });

  // 2. Apply goal to orchestrator
  orchestrator.applyGoalToConfig(goal || "balanced");

  // 3. Run generation with goal-driven behavior
  let script = await scriptGenerationService.generateScript(
    topic,
    category,
    { keywords }
  );

  let score = await feedbackService.analyzeScript(script, {
    category,
  }).then((issues) => feedbackService.scoreScript(issues));

  let retryCount = 0;
  const maxRetries = orchestrator.getEffectiveMaxRetries("generation");

  while (score < orchestrator.getEffectiveScoreThreshold() && retryCount < maxRetries) {
    // Get decision from decision engine
    const issues = await feedbackService.analyzeScript(script, { category });
    const decision = orchestrator.decideFeedbackStrategy(
      script,
      score,
      category,
      retryCount,
      issues
    );

    // Track decision in state
    await stateTracker.updateStep(videoId, "generation", {
      lastDecision: `${decision.strategy}: ${decision.rationale}`,
      retryIncrement: true,
    });

    // Execute decision
    switch (decision.strategy) {
      case "fix_hook":
        script = await scriptGenerationService.regenerateHook(
          script,
          category,
          { keywords }
        );
        break;

      case "retry_full":
        script = await scriptGenerationService.generateScript(
          topic,
          category,
          { keywords }
        );
        break;

      case "accept":
      case "skip":
        break;
    }

    // Re-score
    score = await feedbackService.analyzeScript(script, { category }).then(
      (issues) => feedbackService.scoreScript(issues)
    );
    retryCount++;
  }

  // 4. Continue with assets, metadata, etc.
  // (rest of pipeline continues normally)

  return { videoId, script, score, retryCount, goal };
}

// ============================================================
// PART 5: ADVANCED: GOAL ADAPTATION
// ============================================================

/**
 * Example 9: Dynamically adapt goal based on performance
 */
async function exampleAdaptiveGoals(orchestrator, goalService) {
  // After processing 100 videos, evaluate performance
  const metrics = {
    failureRate: 0.25,       // 25% of videos fail quality check
    averageRetries: 2.5,     // Average 2.5 retries per video
    averageDurationMs: 95000, // Average 95 seconds per video
  };

  // Current goal
  let currentGoal = goalService.getGoal("maximize_engagement");

  // If failing too often, adapt goal
  const adaptedGoal = goalService.adaptGoal(currentGoal!, metrics);

  console.log(`
    Performance metrics:
    - Failure rate: ${metrics.failureRate * 100}%
    - Avg retries: ${metrics.averageRetries}
    - Avg duration: ${metrics.averageDurationMs}ms
    
    Original goal: ${currentGoal?.name}
    Adapted goal: ${adaptedGoal.name}
    
    Changes:
    - Threshold: ${currentGoal?.scoreThreshold} → ${adaptedGoal.scoreThreshold}
    - Max retries: ${currentGoal?.maxRetries} → ${adaptedGoal.maxRetries}
    - Failure mode: ${adaptedGoal.failureMode}
  `);
}

// ============================================================
// PART 6: MONITORING & LOGGING
// ============================================================

/**
 * Example 10: Monitor decision engine activity
 */
async function exampleMonitoringDecisions(orchestrator) {
  // Track all decisions made by the engine
  const decisionHistory: Array<{
    videoId: string;
    action: string;
    reason: string;
    score: number;
    timestamp: number;
  }> = [];

  // After each video generation:
  const entry = {
    videoId: "video_001",
    action: "fix_hook", // from decision engine
    reason: "Hook effectiveness critically low",
    score: 55,
    timestamp: Date.now(),
  };

  decisionHistory.push(entry);

  // Check for decision thrashing
  const isThrashing = orchestrator.shouldThrottleRetry(
    decisionHistory.slice(-5).map((d) => ({ action: d.action, timestamp: d.timestamp })),
    5000 // 5 second window
  );

  console.log(`
    Latest decisions:
    ${decisionHistory.slice(-3).map((d) => `${d.action}: ${d.reason}`).join("\n    ")}
    
    Thrashing detected: ${isThrashing}
  `);
}

// ============================================================
// EXPORTS for testing/integration
// ============================================================

export {
  exampleSetupWithDecisionEngine,
  exampleMaximizeEngagementGoal,
  exampleFastGenerationGoal,
  exampleCostOptimizedGoal,
  exampleDecisionEngineEvaluation,
  exampleDecisionEngineGoodScript,
  exampleDecisionEngineMaxRetries,
  exampleVideoGenerationWithGoals,
  exampleAdaptiveGoals,
  exampleMonitoringDecisions,
};
