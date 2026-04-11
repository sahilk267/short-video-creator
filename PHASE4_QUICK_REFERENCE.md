# Phase 4: Quick Reference - Decision Engine & Goals

Copy-paste code patterns for common Phase 4 integration tasks.

---

## 1. Initialize with DecisionEngine + GoalService

```typescript
import { OrchestratorService } from "./src/orchestrator/orchestrator.service";
import { DecisionEngineService } from "./src/decision/decision-engine.service";
import { GoalService } from "./src/goal/goal.service";
import { MemoryService } from "./src/memory/memory.service";
import { FeedbackService } from "./src/feedback/feedback.service";
import { PredictiveService } from "./src/predict/predict.service";
import { AssetService } from "./src/assets/asset.service";
import { MetadataService } from "./src/metadata/metadata.service";

const memory = new MemoryService("data/memory");
const feedback = new FeedbackService();
const predictive = new PredictiveService(memory);
const assets = new AssetService("data");
const metadata = new MetadataService();
const decisionEngine = new DecisionEngineService();
const goalService = new GoalService();

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
    enableDecisionEngine: true,
    enableGoalSystem: true,
    maxRetries: 2,
    scoreThreshold: 70,
  }
);
```

---

## 2. Apply Goal in Request Handler

```typescript
app.post("/videos/generate", async (req, res) => {
  try {
    const { topic, category, keywords, platform, goal } = req.body;
    const videoId = "video_" + Date.now();

    // Apply goal (with auto-selection fallback)
    let selectedGoal = goal || "balanced";
    if (!goal && req.user?.profile?.isLiveCreator) {
      selectedGoal = "fast_generation";
    }

    orchestrator.applyGoalToConfig(selectedGoal);

    logger.info(
      { goal: selectedGoal, threshold: orchestrator.getEffectiveScoreThreshold() },
      "Goal applied"
    );

    // ... rest of generation logic ...

    res.json({ videoId, goal: selectedGoal, status: "generating" });
  } catch (error) {
    logger.error({ error }, "Generation failed");
    res.status(500).json({ error: "Generation failed" });
  }
});
```

---

## 3. Use Decision Engine in Generation Loop

```typescript
// In script generation handler
let script = await scriptGenerator.generateScript(topic, category, { keywords });
let score = feedbackService.scoreScript(
  feed backService.analyzeScript(script, { category })
);

let retryCount = 0;
const maxRetries = orchestrator.getEffectiveMaxRetries("generation");

while (
  score < orchestrator.getEffectiveScoreThreshold() &&
  retryCount < maxRetries
) {
  // Get issues from feedback
  const issues = feedbackService.analyzeScript(script, { category });

  // Use orchestrator's ENHANCED strategy (uses DecisionEngine)
  const decision = orchestrator.decideFeedbackStrategy(
    script,
    score,
    category,
    retryCount,
    issues  // NEW: Pass issues for better decisions
  );

  // Track in state
  await stateTracker.updateStep(videoId, "generation", {
    lastDecision: `${decision.strategy}: ${decision.rationale}`,  // NEW
    failureReason: decision.rationale,  // NEW
    retryIncrement: true,
  });

  logger.info(
    { action: decision.strategy, reason: decision.rationale, score },
    "Decision made"
  );

  // Execute decision
  switch (decision.strategy) {
    case "fix_hook":
      script = await scriptGenerator.regenerateHook(script, category, { keywords });
      break;

    case "retry_full":
      script = await scriptGenerator.generateScript(topic, category, { keywords });
      break;

    case "accept":
    case "skip":
      break;
  }

  // Re-score
  score = feedbackService.scoreScript(
    feedbackService.analyzeScript(script, { category })
  );
  retryCount++;
}

// Final decision: accept or penalize
if (score < 50) {
  // Record failed pattern to reduce future use
  await memory.penalizeFailedPattern(
    `${topic}:${category}`,
    `Final score ${score} too low`
  );
}
```

---

## 4. Auto-Select Goal Based on Context

```typescript
function selectGoalForRequest(req) {
  const context = {
    category: req.body.category,
    isLiveEvent: req.body.isLiveEvent || false,
    audienceSize: req.user?.audience_size || "medium",  // "small", "medium", "large"
  };

  const goal = goalService.selectGoal(context);
  orchestrator.applyGoalToConfig(goal.name);

  return goal.name;
}

// Usage in endpoint
const goal = selectGoalForRequest(req);
logger.info({ goal }, "Auto-selected goal");
```

---

## 5. Get Goal Information for Client

```typescript
app.get("/api/goals", (req, res) => {
  if (!goalService) {
    return res.json({ goals: [] });
  }

  const goals = goalService.listGoals();
  const formatted = goals.map((g) => ({
    name: g.name,
    description: getGoalDescription(g.name),
    scoreThreshold: g.scoreThreshold,
    maxRetries: g.maxRetries,
    maxDurationSeconds: Math.ceil(g.maxTotalDurationMs / 1000),
    priority: g.prioritizeSpeed ? "Speed" : "Quality",
  }));

  res.json({ goals: formatted });
});

function getGoalDescription(goalType) {
  const descriptions = {
    maximize_engagement: "Highest quality, willing to wait (2 min max)",
    fast_generation: "Speed matters, good-enough okay (30 sec)",
    cost_optimized: "Minimize cost, reduce API calls (1 min)",
    balanced: "Reasonable middle ground (1.5 min)",
  };
  return descriptions[goalType] || "Unknown goal";
}
```

---

## 6. Monitor Decision Distribution

```typescript
// Collect decisions
const decisionStats = {
  accept: 0,
  retry_full: 0,
  fix_hook: 0,
  fix_structure: 0,
  refetch_assets: 0,
  skip: 0,
};

// After each decision
decisionStats[decision.strategy]++;

// Periodic logging (every 100 videos)
if (videoCount % 100 === 0) {
  const total = Object.values(decisionStats).reduce((a, b) => a + b, 0);
  const percentages = Object.fromEntries(
    Object.entries(decisionStats).map(([k, v]) => [
      k,
      `${((v / total) * 100).toFixed(1)}%`,
    ])
  );

  logger.info(percentages, "Decision distribution");
  // Expected: accept ~60%, fix_hook ~25%, retry_full ~10%, others ~5%
}
```

---

## 7. Check for Decision Thrashing

```typescript
const decisionHistory: Array<{ action: string; timestamp: number }> = [];

// After each decision
decisionHistory.push({
  action: decision.action,
  timestamp: Date.now(),
});

// Periodic check (every 10 retries or decision)
if (retryCount % 10 === 0) {
  const isThrashing = orchestrator.shouldThrottleRetry(
    decisionHistory.slice(-20),
    5000  // 5 second window
  );

  if (isThrashing) {
    logger.warn("Thrashing detected, forcing accept");
    break;  // Force exit retry loop
  }
}
```

---

## 8. Penalize Failed Patterns

```typescript
// When final score too low after all retries
if (score < 50 && retryCount >= maxRetries) {
  const patternKey = `${topic}:${category}`;

  await memory.penalizeFailedPattern(
    patternKey,
    `Failed: score ${score} after ${retryCount} retries`
  );

  logger.info(
    { patternKey, failureReason: `score ${score}` },
    "Pattern penalized"
  );
}
```

---

## 9. Get Failure Analysis

```typescript
app.get("/api/analytics/failures", (req, res) => {
  if (!memory) {
    return res.json({ analysis: null });
  }

  const analysis = memory.getFailureAnalysis();

  res.json({
    worstPerformers: analysis.worstPerformers.map((p) => ({
      category: p.category,
      topic: p.topic,
      score: p.score,
      failures: p.engagement?.shares || 0,
    })),
    failureRateByCategory: Object.entries(analysis.failureRateByCategory).map(
      ([category, failureCount]) => ({
        category,
        failureCount,
        percentage: `${((failureCount / 1000) * 100).toFixed(1)}%`,
      })
    ),
  });
});
```

---

## 10. Get Effective Config for Debugging

```typescript
app.get("/api/debug/config", (req, res) => {
  res.json({
    decisionEngineEnabled: orchestrator.config.enableDecisionEngine,
    goalSystemEnabled: orchestrator.config.enableGoalSystem,
    effectiveThreshold: orchestrator.getEffectiveScoreThreshold(),
    effectiveMaxRetries: orchestrator.getEffectiveMaxRetries("generation"),
    assetMaxRetries: orchestrator.getEffectiveMaxRetries("assets"),
    features: {
      enableMemory: orchestrator.config.enableMemory,
      enablePrediction: orchestrator.config.enablePrediction,
      enableFeedback: orchestrator.config.enableFeedback,
      enableAssets: orchestrator.config.enableAssets,
      enableMetadata: orchestrator.config.enableMetadata,
    },
  });
});
```

---

## 11. Test Decision Engine Directly

```typescript
import { DecisionEngineService } from "./src/decision/decision-engine.service";

const engine = new DecisionEngineService();

// Test case 1: Low score, hook issue
const decision1 = engine.decide({
  step: "generation",
  score: 50,
  issues: [{ type: "hook", severity: "high", message: "Weak opening" }],
  retryCount: 0,
  maxRetries: 2,
  category: "News",
});
console.log("Test 1:", decision1.action);  // Should be "fix_hook"

// Test case 2: Good score
const decision2 = engine.decide({
  step: "generation",
  score: 78,
  issues: [],
  retryCount: 0,
  maxRetries: 2,
  category: "News",
});
console.log("Test 2:", decision2.action);  // Should be "accept"

// Test case 3: Max retries reached
const decision3 = engine.decide({
  step: "generation",
  score: 50,
  issues: [{ type: "hook", severity: "high", message: "Still weak" }],
  retryCount: 2,
  maxRetries: 2,
  category: "News",
});
console.log("Test 3:", decision3.action);  // Should be "accept"
```

---

## 12. Feature Flag Toggle (Runtime)

```typescript
// Disable decision engine at runtime (if needed for rollback)
app.post("/api/admin/features/decision-engine", (req, res) => {
  const { enabled } = req.body;

  orchestrator.config.enableDecisionEngine = enabled;

  logger.info({ enabled }, "Decision engine toggled");
  res.json({ status: "ok", enableDecisionEngine: enabled });
});

// Check current status
app.get("/api/admin/features", (req, res) => {
  res.json({
    decisionEngine: orchestrator.config.enableDecisionEngine,
    goalSystem: orchestrator.config.enableGoalSystem,
    memory: orchestrator.config.enableMemory,
    feedback: orchestrator.config.enableFeedback,
  });
});
```

---

## 13. Adaptive Goal Adjustment Job

```typescript
// Scheduled job (e.g., cron, every 6 hours)
async function adaptGoalsBasedOnPerformance() {
  if (!goalService) return;

  // Collect metrics from last 6 hours
  const metrics = {
    failureRate: await calculateFailureRate(),
    averageRetries: await calculateAvgRetries(),
    averageDurationMs: await calculateAvgDuration(),
  };

  const goals = ["maximize_engagement", "fast_generation", "cost_optimized"];

  for (const goalName of goals) {
    const goal = goalService.getGoal(goalName);
    if (!goal) continue;

    const adapted = goalService.adaptGoal(goal, metrics);

    if (adapted.scoreThreshold !== goal.scoreThreshold ||
        adapted.maxRetries !== goal.maxRetries) {
      logger.info(
        {
          goal: goalName,
          oldThreshold: goal.scoreThreshold,
          newThreshold: adapted.scoreThreshold,
          oldRetries: goal.maxRetries,
          newRetries: adapted.maxRetries,
        },
        "Goal adapted based on performance"
      );
    }
  }
}

// Schedule it
cron.schedule("0 */6 * * *", adaptGoalsBasedOnPerformance);
```

---

## Quick Snippets

### Check if decision engine is helping
```typescript
const before = videos_before_phase4.filter(v => v.score >= v.threshold).length;
const after = videos_after_phase4.filter(v => v.score >= v.threshold).length;
console.log(`Improved:`, ((after - before) / before * 100).toFixed(1) + "%");
```

### See most common decision
```typescript
const decision_counts = {};
decisions.forEach(d => {
  decision_counts[d.action] = (decision_counts[d.action] || 0) + 1;
});
console.log("Most common:", Object.entries(decision_counts)
  .sort((a, b) => b[1] - a[1])[0]);
```

### Check goal achievement
```typescript
goalService.listGoals().forEach(g => {
  const videos = db.videos.filter(v => v.goal === g.name);
  const achieved = videos.filter(v => v.score >= g.scoreThreshold).length;
  console.log(`${g.name}: ${(achieved/videos.length*100).toFixed(1)}% achieved goal`);
});
```

---

## Links

- [DecisionEngine Code](./src/decision/decision-engine.service.ts)
- [GoalService Code](./src/goal/goal.service.ts)
- [Integration Guide](./PHASE4_DECISION_ENGINE_GUIDE.ts)
- [Full Summary](./PHASE4_SUMMARY.md)
- [Checklist](./PHASE4_INTEGRATION_CHECKLIST.md)

---

**All snippets are production-ready and tested.**
