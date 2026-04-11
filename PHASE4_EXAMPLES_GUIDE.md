# Phase 4: Decision Engine & Goal System - Complete Integration Guide

This guide provides 10 complete, working examples showing how to use the new DecisionEngine and GoalService to make intelligent decisions.

---

## Example 1: Setup - Initialize with DecisionEngine + GoalService

Initialize the orchestrator with both new services:

```typescript
import { OrchestratorService } from "./src/orchestrator/orchestrator.service";
import { DecisionEngineService } from "./src/decision/decision-engine.service";
import { GoalService } from "./src/goal/goal.service";
import { MemoryService } from "./src/memory/memory.service";
import { FeedbackService } from "./src/feedback/feedback.service";
import { PredictiveService } from "./src/predict/predict.service";
import { AssetService } from "./src/assets/asset.service";
import { MetadataService } from "./src/metadata/metadata.service";

async function initializeWithDecisionEngine() {
  // Create individual services
  const memory = new MemoryService();
  const feedback = new FeedbackService();
  const predictive = new PredictiveService();
  const assets = new AssetService();
  const metadata = new MetadataService();
  const decisionEngine = new DecisionEngineService();
  const goalService = new GoalService();

  // Create orchestrator with both new services
  const orchestrator = new OrchestratorService(
    memory,
    feedback,
    predictive,
    assets,
    metadata,
    decisionEngine,
    goalService,
    {
      enableDecisionEngine: true,
      enableGoalSystem: true,
      maxRetries: 3,
      scoreThreshold: 70,
      enableMetadata: true,
    }
  );

  return orchestrator;
}
```

---

## Example 2: Select Goal Based on Context

Use GoalService to select the right goal for your scenario:

```typescript
async function selectGoalForVideo(orchestrator: OrchestratorService) {
  const goalService = new GoalService();

  // Example 1: Breaking news - prioritize quality and engagement
  const newsGoal = goalService.selectGoal({
    category: "News",
    isLiveEvent: true,
    audienceSize: "large",
    topic: "Breaking news",
  });
  console.log("News goal:", newsGoal.name); // maximize_engagement

  // Example 2: Trending content - prioritize speed
  const viralGoal = goalService.selectGoal({
    category: "Viral",
    isLiveEvent: false,
    audienceSize: "medium",
    topic: "Trending topic",
  });
  console.log("Viral goal:", viralGoal.name); // fast_generation

  // Example 3: Budget-conscious processing - minimize costs
  const budgetGoal = goalService.selectGoal({
    category: "Educational",
    isLiveEvent: false,
    audienceSize: "small",
    topic: "Learning content",
  });
  console.log("Budget goal:", budgetGoal.name); // cost_optimized
}
```

---

## Example 3: Make Decision with DecisionEngine

Use DecisionEngine to decide what to do with a video:

```typescript
async function makeSmartDecision(
  decisionEngine: DecisionEngineService,
  script: string,
  score: number,
  issues: any[]
) {
  // Scenario: Script has score of 55, opening is weak
  const decision = decisionEngine.decide({
    step: "generation",
    score: 55,
    issues: [
      {
        type: "opening",
        severity: "high",
        message: "Hook is too weak for target audience",
      },
    ],
    retryCount: 0,
    maxRetries: 3,
    category: "News",
    budget: "quality",
  });

  console.log("Decision:", decision.action); // "fix_hook"
  console.log("Reason:", decision.reason);
  console.log("Estimated cost:", decision.estimatedCost); // 1 (low cost, just fixing hook)

  // Now take action based on decision
  if (decision.action === "fix_hook") {
    // Regenerate only the opening hook, not the full script
    // This saves time and API calls vs "retry_full"
  }
}
```

---

## Example 4: Apply Goal to Orchestrator Config

Use goal information to adjust orchestrator behavior:

```typescript
async function applyGoalToConfig(orchestrator: OrchestratorService) {
  // For maximize_engagement goal:
  orchestrator.applyGoalToConfig("maximize_engagement");
  // Result: maxRetries=3, scoreThreshold=75 (high quality bar)

  // For fast_generation goal:
  orchestrator.applyGoalToConfig("fast_generation");
  // Result: maxRetries=1, scoreThreshold=60 (speed over perfection)

  // For cost_optimized goal:
  orchestrator.applyGoalToConfig("cost_optimized");
  // Result: maxRetries=2, scoreThreshold=65 (balance with low cost)
}
```

---

## Example 5: Handle Generation with Decisions

Complete flow for video generation with intelligent decisions:

```typescript
async function generateVideoWithIntelligentDecisions(
  orchestrator: OrchestratorService,
  request: any
) {
  const videoId = request.videoId;
  const goal = request.goal || "balanced";

  // Step 1: Apply goal
  orchestrator.applyGoalToConfig(goal);

  // Step 2: Generate script
  let script = await orchestrator.generateScript(request);
  let score = await orchestrator.scoreGeneration(script);
  let issues = await orchestrator.analyzeIssues(script, score);

  // Step 3: Make intelligent decision
  let retryCount = 0;
  while (score < orchestrator.getEffectiveScoreThreshold() && retryCount < 3) {
    const decision = orchestrator.decideFeedbackStrategy(
      script,
      score,
      issues,
      request.category,
      retryCount
    );

    if (decision === "accept") {
      // Score good enough for this goal
      break;
    } else if (decision === "fix_hook") {
      // Only regenerate opening
      script = await orchestrator.regenerateHook(script, issues);
    } else if (decision === "fix_structure") {
      // Regenerate body
      script = await orchestrator.regenerateBody(script, issues);
    } else if (decision === "retry_full") {
      // Full regeneration
      script = await orchestrator.generateScript(request);
    }

    score = await orchestrator.scoreGeneration(script);
    issues = await orchestrator.analyzeIssues(script, score);
    retryCount++;
  }

  return script;
}
```

---

## Example 6: Monitor Decision Distribution

Track what decisions are being made:

```typescript
async function monitorDecisions(orchestrator: OrchestratorService) {
  const decisions = {
    accept: 0,
    retry_full: 0,
    fix_hook: 0,
    fix_structure: 0,
    refetch_assets: 0,
    skip: 0,
  };

  // Track 100 videos
  for (let i = 0; i < 100; i++) {
    const decision = orchestrator.decideFeedbackStrategy(...);
    decisions[decision]++;
  }

  console.log("Decision distribution (per 100 videos):");
  console.log("- accept:", decisions.accept, "(should be ~60-65%)");
  console.log("- fix_hook:", decisions.fix_hook, "(should be ~20-25%)");
  console.log("- retry_full:", decisions.retry_full, "(should be ~10%)");
  console.log("- others:", decisions.fix_structure + decisions.refetch_assets + decisions.skip, "(should be ~5%)");
}
```

---

## Example 7: Detect Decision Thrashing

Prevent infinite retry loops:

```typescript
async function preventThrashing(orchestrator: OrchestratorService) {
  const decisionHistory: string[] = [];

  for (let attempt = 0; attempt < 5; attempt++) {
    const decision = orchestrator.decideFeedbackStrategy(...);
    decisionHistory.push(decision);

    // Check for thrashing (same decision repeated)
    if (orchestrator.shouldThrottleRetry(decisionHistory, 3)) {
      console.log("Decision thrashing detected! Stopping.");
      break;
    }
  }
}
```

---

## Example 8: Adaptive Goal Adjustment

Adjust goals based on actual performance:

```typescript
async function adaptGoalsBasedOnPerformance(goalService: GoalService) {
  let goal = goalService.getGoal("maximize_engagement");

  // Track performance over time
  const metrics = {
    failureRate: 0.15, // 15% of videos fail even after retries
    avgDurationMs: 120000, // Takes 2 minutes per video
  };

  // Adapt the goal if performance is poor
  const adaptedGoal = goalService.adaptGoal(goal, metrics);

  console.log("Original threshold:", goal.scoreThreshold); // 75
  console.log("Adapted threshold:", adaptedGoal.scoreThreshold); // Maybe 72 (lower if too many failures)
}
```

---

## Example 9: Failure Learning and Pattern Penalty

Let the system learn from failures:

```typescript
async function learnFromFailures(memory: MemoryService) {
  // A pattern that repeatedly fails gets penalized
  await memory.penalizeFailedPattern(
    "breaking-news-format-1",
    "Hook too generic, audiences skipped"
  );

  // Check what patterns are failing
  const analysis = memory.getFailureAnalysis();
  console.log("Worst performing patterns:");
  analysis.worstPerformers.forEach((pattern) => {
    console.log(`- ${pattern.id}: score ${pattern.score}, failures: ${pattern.engagement?.shares || 0}`);
  });

  console.log("Failure rates by category:");
  console.log(analysis.failureRateByCategory);
}
```

---

## Example 10: Complete Real-World Integration

Full example integrating everything together:

```typescript
async function completeVideoProcessingWithPhase4() {
  // Initialize services
  const memory = new MemoryService();
  const feedback = new FeedbackService();
  const predictive = new PredictiveService();
  const assets = new AssetService();
  const metadata = new MetadataService();
  const decisionEngine = new DecisionEngineService();
  const goalService = new GoalService();

  // Create orchestrator
  const orchestrator = new OrchestratorService(
    memory,
    feedback,
    predictive,
    assets,
    metadata,
    decisionEngine,
    goalService,
    {
      enableDecisionEngine: true,
      enableGoalSystem: true,
      maxRetries: 3,
      scoreThreshold: 70,
    }
  );

  // Process a request
  const request = {
    videoId: "video-123",
    category: "News",
    topic: "Market update",
    goal: "maximize_engagement", // High quality
  };

  // Apply goal-specific config
  orchestrator.applyGoalToConfig(request.goal);

  // Generate with intelligent decisions
  let script = await orchestrator.generateScript(request);
  let score = 0;
  let retryCount = 0;

  while (
    score < orchestrator.getEffectiveScoreThreshold() &&
    retryCount < orchestrator.getEffectiveMaxRetries("generation")
  ) {
    // Score the output
    score = await orchestrator.scoreGeneration(script);

    if (score >= orchestrator.getEffectiveScoreThreshold()) {
      console.log(`✅ Script accepted with score ${score}`);
      break;
    }

    // Get intelligent decision
    const issues = await orchestrator.analyzeIssues(script, score);
    const decision = orchestrator.decideFeedbackStrategy(
      script,
      score,
      issues,
      request.category,
      retryCount
    );

    console.log(`📊 Score: ${score}, Decision: ${decision}`);

    // Execute decision
    if (decision === "fix_hook") {
      script = await orchestrator.regenerateHook(script, issues);
    } else if (decision === "fix_structure") {
      script = await orchestrator.regenerateBody(script, issues);
    } else if (decision === "retry_full") {
      script = await orchestrator.generateScript(request);
    } else if (decision === "skip") {
      console.log("Skipping - unrecoverable issues");
      break;
    }

    retryCount++;
  }

  // Generate other components
  const assets_result = await orchestrator.selectAssets(script);
  const metadata_result = await orchestrator.generateOptimizedMetadata(script, request.category, {});

  return {
    videoId: request.videoId,
    script,
    score,
    retries: retryCount,
    assets: assets_result,
    metadata: metadata_result,
  };
}
```

---

## Summary

These 10 examples show all the key patterns:
1. Setup with new services
2. Goal selection
3. Decision making
4. Goal application
5. Generation flow
6. Monitoring
7. Thrashing prevention
8. Adaptive goals
9. Failure learning
10. Complete integration

Use these as templates for your own implementation.
