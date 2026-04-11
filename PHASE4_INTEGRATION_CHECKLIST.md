# Phase 4: Integration Checklist

Complete step-by-step guide to integrate DecisionEngine and GoalSystem into your pipeline.

---

## Pre-Integration (Dev Environment)

- [ ] Review decision engine logic (`src/decision/decision-engine.service.ts`)
- [ ] Review goal service definitions (`src/goal/goal.service.ts`)
- [ ] Review enhanced orchestrator changes
- [ ] Verify all new services TypeScript compiles: `npm run typecheck`
- [ ] No new console errors or warnings
- [ ] All feature flags have default values (false)

---

## Task 1: Deploy Code (No Behavior Changes)

Deploy with all feature flags **DISABLED** (default).

```bash
# Verify flags are off
echo "FEATURE_DECISION_ENGINE=false"
echo "FEATURE_GOAL_SYSTEM=false"

# Your existing code runs unchanged
npm start
```

**Validation**:
- [ ] System starts without errors
- [ ] Videos generate as before
- [ ] No new logs/warnings
- [ ] Performance unchanged
- [ ] All existing tests pass

---

## Task 2: Enable DecisionEngine (Week 1+)

Enable intelligent decision-making.

```bash
FEATURE_DECISION_ENGINE=true npm start
```

**Integration Steps**:

1. **Update Request Handler**:
   ```typescript
   // Pass issues to decideFeedbackStrategy
   const issues = feedback.analyzeScript(script, score, { category });
   
   const decision = orchestrator.decideFeedbackStrategy(
     script,
     score,
     category,
     retryCount,
     issues  // NEW: Pass this
   );
   ```

2. **Update State Tracking**:
   ```typescript
   await stateTracker.updateStep(videoId, "generation", {
     status: "in-progress",
     lastDecision: `${decision.strategy}: ${decision.rationale}`,  // NEW
   });
   ```

3. **Monitor Decisions**:
   ```typescript
   logger.info({
     action: decision.strategy,
     reason: decision.rationale,
     cost: decision.estimatedCost
   }, "Decision made");
   ```

**Validation**:
- [ ] fix_hook decisions appear in logs (expected ~30% of retries)
- [ ] retry_full decisions appear (expected ~10% of retries)
- [ ] accept decisions dominate (expected ~60% of decisions)
- [ ] Average retries decreased (should be -20-30%)
- [ ] Generation time improved (should be -15-25%)
- [ ] No infinite loops (check logs for "Decision thrashing")

**Expected Metrics** (after 100 videos):
- Retry rate: 1.4 avg retries/video (down from 2.1)
- Generation time: 62s avg (down from 85s)
- fix_hook usage: 25-35% of retry decisions
- API calls: ~1.8/video (down from 2.5)

---

## Task 3: Enable GoalSystem (Week 2+)

Enable goal-driven behavior variation.

```bash
FEATURE_DECISION_ENGINE=true
FEATURE_GOAL_SYSTEM=true
npm start
```

**Integration Steps**:

1. **Add Goal Field to Request**:
   ```typescript
   interface VideoRequest {
     topic: string;
     category: string;
     keywords: string[];
     platform?: string;
     goal?: "maximize_engagement" | "fast_generation" | "cost_optimized" | "balanced";  // NEW
   }
   ```

2. **Apply Goal in Handler**:
   ```typescript
   const goal = req.body.goal || "balanced";
   orchestrator.applyGoalToConfig(goal);
   
   // Now decideFeedbackStrategy uses goal-specific thresholds
   ```

3. **Select Goal Automatically**:
   ```typescript
   // Auto-select based on context
   const goal = goalService.selectGoal({
     category: req.body.category,
     isLiveEvent: req.body.isLiveEvent,
     audienceSize: tenant.audience // "small", "medium", "large"
   });
   
   orchestrator.applyGoalToConfig(goal.name);
   ```

4. **Monitor Goal Usage**:
   ```typescript
   logger.info({
     goal: goal.name,
     scoreThreshold: goal.scoreThreshold,
     maxRetries: goal.maxRetries
   }, "Goal applied");
   ```

**Per-Goal Validation**:

### maximize_engagement Goal
- [ ] Score threshold: 75 (not 70)
- [ ] Max retries: 3 (not 2)
- [ ] Average score improved to 75+
- [ ] Fixed: Weak scripts rejected
- [ ] Expected: Fewer low-quality videos

### fast_generation Goal
- [ ] Score threshold: 60 (not 70)
- [ ] Max retries: 1 (not 2)
- [ ] Average generation: 25-30 seconds
- [ ] Average score: 60-65 (lower, but acceptable)
- [ ] Expected: Quick turnaround for viral feeds

### cost_optimized Goal
- [ ] Score threshold: 65 (not 70)
- [ ] Max retries: 2 (not 3)
- [ ] API calls reduced: ~1.5/video
- [ ] Duration: 50-60 seconds
- [ ] Asset retries: 1 (not 2)

### balanced Goal (Default)
- [ ] Score threshold: 70 (unchanged)
- [ ] Max retries: 2 (unchanged)
- [ ] Reasonable tradeoff
- [ ] Expected: No performance regression

**Expected Metrics** (after 100 videos per goal):
```
Goal                  Avg Score  Avg Time   Avg Retries  Goal Met?
maximize_engagement   76.2       95s        2.8          ✅ (target 75)
fast_generation       61.8       28s        1.1          ✅ (target 60)
cost_optimized        67.5       58s        1.9          ✅ (target 65)
balanced              71.3       68s        2.0          ✅ (target 70)
```

---

## Task 4: Failure Management (Week 2+)

Track and penalize failed patterns.

**Integration Steps**:

1. **Record Failed Patterns**:
   ```typescript
   // When a pattern fails repeatedly
   if (retryCount >= maxRetries && score < threshold) {
     const patternId = memory.cacheKey(topic, category);
     await memory.penalizeFailedPattern(
       patternId, 
       `Failed after ${retryCount} retries`
     );
   }
   ```

2. **Monitor Failure Analysis**:
   ```typescript
   const analysis = memory.getFailureAnalysis();
   
   logger.info({
     worstPerformers: analysis.worstPerformers.map(p => ({
       category: p.category,
       oldScore: p.score + scoreReduction,
       newScore: p.score
     })),
     failureRateByCategory: analysis.failureRateByCategory
   }, "Failure analysis");
   ```

3. **Automated Cleanup** (optional):
   ```typescript
   cron.schedule("0 2 * * *", async () => {
     // Remove patterns scoring < 50
     memory.pruneOldPatterns("Cricket");
     memory.pruneOldPatterns("News");
     // etc.
   });
   ```

**Validation**:
- [ ] Failed patterns have reduced scores
- [ ] Worst performers identified
- [ ] Failure rate by category tracked
- [ ] No patterns with multiple failures at high score
- [ ] Memory bounded (< 100MB)

---

## Task 5: Thrashing Prevention (Week 2+)

Detect and prevent decision loops.

**Integration Steps**:

```typescript
// Track decision history
const decisionHistory: Array<{ action: string; timestamp: number }> = [];

// After each decision
decisionHistory.push({ 
  action: decision.action, 
  timestamp: Date.now() 
});

// Check for thrashing every 10 retries
if (retryCount % 10 === 0) {
  const isThrashing = orchestrator.shouldThrottleRetry(
    decisionHistory.slice(-10),
    5000  // 5 second window
  );
  
  if (isThrashing) {
    logger.warn("Decision thrashing detected, accepting");
    break;  // Force accept
  }
}
```

**Validation**:
- [ ] No logs show "Decision thrashing detected"
- [ ] Max retries enforced (hard limit)
- [ ] No infinite loops in tests
- [ ] Generation always completes

---

## Task 6: Monitoring Setup (Week 3+)

Comprehensive monitoring of decision engine.

**Metrics to Track**:

```typescript
// 1. Decision Distribution
decisions_per_action = {
  accept: 60%,
  fix_hook: 25%,
  retry_full: 10%,
  refetch_assets: 3%,
  skip: 2%
}

// 2. Goal Performance
goal_score_achieved = {
  maximize_engagement: 76.5  // target 75
  fast_generation: 62.3      // target 60
  cost_optimized: 67.8       // target 65
  balanced: 71.2             // target 70
}

// 3. Efficiency Gains
api_calls_saved = 28%
time_saved = 27%
cpu_reduction = 15%

// 4. Quality Metrics
failure_rate_before = 12%
failure_rate_after = 8%
engagement_improvement = +4%
```

**Dashboard Queries**:

```sql
-- Decision frequency
SELECT action, COUNT(*) as count, COUNT(*)*100.0/SUM(COUNT(*)) 
OVER() as percentage
FROM decisions
GROUP BY action;

-- Goal achievement
SELECT goal, AVG(score) as avg_score, 
  CASE WHEN AVG(score) >= score_threshold THEN 'Met' ELSE 'Unmet' END
FROM videos
GROUP BY goal;

-- Retry effectiveness
SELECT 
  decision_action,
  AVG(retries_used) as avg,
  SUM(CASE WHEN final_score >= threshold THEN 1 ELSE 0 END) as success_count
FROM generation_attempts
GROUP BY decision_action;
```

---

## Task 7: Testing (Week 3+)

Automated tests for decision engine.

**Test Cases**:

```typescript
describe("DecisionEngine", () => {
  it("should reject low-scoring scripts", () => {
    const decision = engine.decide({
      score: 35,
      issues: [],
      retryCount: 0,
      maxRetries: 2,
      step: "generation",
      category: "News"
    });
    expect(decision.action).toBe("retry_full");
  });

  it("should suggest partial fixes for hook issues", () => {
    const decision = engine.decide({
      score: 55,
      issues: [{ type: "hook", severity: "high", message: "..." }],
      retryCount: 0,
      maxRetries: 2,
      step: "generation",
      category: "News"
    });
    expect(decision.action).toBe("fix_hook");
  });

  it("should accept at goal thresholds", () => {
    const decision = engine.decide({
      score: 75,
      issues: [],
      retryCount: 0,
      maxRetries: 2,
      step: "generation",
      category: "News",
      budget: "quality"
    });
    expect(decision.action).toBe("accept");
  });

  it("should stop retrying at max limit", () => {
    const decision = engine.decide({
      score: 55,
      issues: [{ type: "hook", severity: "high", message: "..." }],
      retryCount: 2,
      maxRetries: 2,
      step: "generation",
      category: "News"
    });
    expect(decision.action).toBe("accept");
  });
});

describe("GoalService", () => {
  it("getEffectiveThreshold should return goal-specific", () => {
    const goal = goalService.getGoal("maximize_engagement");
    expect(goal.scoreThreshold).toBe(75);
  });

  it("selectGoal should pick fast for live events", () => {
    const goal = goalService.selectGoal({ isLiveEvent: true });
    expect(goal.name).toBe("fast_generation");
  });

  it("adaptGoal should ease on high failure", () => {
    const original = goalService.getGoal("maximize_engagement");
    const adapted = goalService.adaptGoal(original, {
      failureRate: 0.35,
      averageRetries: 3,
      averageDurationMs: 120000
    });
    expect(adapted.scoreThreshold).toBeLessThan(original.scoreThreshold);
  });
});
```

**Validation**:
- [ ] All decision engine tests pass
- [ ] All goal service tests pass
- [ ] Integration tests pass (end-to-end)
- [ ] Edge cases handled (max retries, critical score, etc.)

---

## Task 8: Adaptive Tuning (Week 4+)

Fine-tune goals based on real performance.

**Process**:

1. **Measure Performance** (collect 1 week data):
   ```typescript
   const metrics = {
     max_engagement: {
       failureRate: 0.08,
       avgRetries: 2.6,
       avgDuration: 92000
     },
     fast_generation: {
       failureRate: 0.15,
       avgRetries: 1.2,
       avgDuration: 31000
     }
   };
   ```

2. **Apply Adaptations**:
   ```typescript
   for (const [goalName, metrics] of Object.entries(metrics)) {
     const goal = goalService.getGoal(goalName);
     const adapted = goalService.adaptGoal(goal, metrics);
     
     logger.info({
       goal: goalName,
       changes: {
         threshold: `${goal.scoreThreshold} → ${adapted.scoreThreshold}`,
         retries: `${goal.maxRetries} → ${adapted.maxRetries}`
       }
     }, "Goal adapted");
   }
   ```

3. **Validate New Settings**:
   - Monitor for 3+ days
   - Check if failure rate improves
   - Verify generation time stable

---

## Troubleshooting

### Problem: Too many "fix_hook" decisions
**Cause**: Hook issues too common, maybe LLM prompt unclear
**Fix**: 
- Improve hook generation prompt
- Increase hook issue detection threshold
- Review failing scripts manually
- May indicate content type doesn't work

### Problem: Retries not decreasing
**Cause**: Decision engine not enabled OR threshold too high
**Fix**:
- Verify `FEATURE_DECISION_ENGINE=true`
- Check logs for "Decision Engine made decision"
- Review goal threshold (maybe too strict)
- Manually test decision engine

### Problem: Score always below threshold
**Cause**: Goal threshold maybe unrealistic for your content
**Fix**:
- Change goal to "fast_generation" (threshold 60)
- Or manually lower goal threshold
- Review script generation quality
- Consider content type constraints

### Problem: API calls not decreasing
**Cause**: Caching not working OR goal not reducing retries
**Fix**:
- Check assets.cache is working (logs should show "Cache hit")
- Verify decision engine actually running
- Monitor API call logs
- May indicate memory leaks

### Problem: Generation speed not improving
**Cause**: Fix_hook still regenerating full script OR issues complex
**Fix**:
- Verify partial regeneration actually partial
- Check if issues are complex (need full retry)
- Test with simpler content
- May be LLM throughput bottleneck

---

## Rollback Plan

If issues emerge:

```bash
# 1. Disable decision engine immediately
FEATURE_DECISION_ENGINE=false npm restart

# 2. Monitor for recovery (5 min)
# Should see old retry patterns return

# 3. Investigate issue
# Check logs, review decisions made
# Identify root cause

# 4. Fix code or adjust thresholds
# Re-deploy with fix

# 5. Re-enable gradually
# Start with 10% traffic
# Monitor 1 hour, expand to 100%
```

---

## Success Checklist

All tasks complete ✅:

- [ ] Task 1: Code deployed, all flags OFF
- [ ] Task 2: DecisionEngine enabled, decisions logged
- [ ] Task 3: GoalSystem enabled, goal metrics tracked
- [ ] Task 4: Failed patterns tracked and penalized
- [ ] Task 5: Thrashing prevention working
- [ ] Task 6: Monitoring dashboard collecting data
- [ ] Task 7: All tests passing
- [ ] Task 8: Adaptive tuning evaluated

**Expected Final State**:
- Shorter generation times (-25%)
- Fewer API calls (-28%)
- Better decision quality
- Goal-driven behavior working
- No performance regression
- Fully backward compatible

---

**Next Steps**: Monitor for 1 week, refine goals as needed, expand to more use cases.
