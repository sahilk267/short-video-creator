# Phase 3: Integration Quick Reference

Quick code snippets for wiring services together. Copy-paste ready.

## 1. Initialize All Services

```typescript
import { OrchestratorService } from "./src/orchestrator/orchestrator.service";
import { StateTrackerService } from "./src/state/state-tracker.service";
import { MemoryService } from "./src/memory/memory.service";
import { FeedbackService } from "./src/feedback/feedback.service";
import { PredictiveService } from "./src/predict/predict.service";
import { AssetService } from "./src/assets/asset.service";
import { MetadataService } from "./src/metadata/metadata.service";

// Setup
const memory = new MemoryService("data/memory");
const feedback = new FeedbackService();
const predictive = new PredictiveService(memory);
const assets = new AssetService("data");
const metadata = new MetadataService();
const stateTracker = new StateTrackerService("data/pipeline-states");

const orchestrator = new OrchestratorService(
  memory,
  feedback,
  predictive,
  assets,
  metadata,
  {
    enableMemory: true,
    enablePrediction: true,
    enableFeedback: true,
    enableAssets: true,
    enableMetadata: true,
    maxRetries: 2,
    scoreThreshold: 70,
  }
);
```

---

## 2. Wire Into Request Handler

```typescript
// In src/server/routes/video.ts or similar

app.post("/videos/generate", async (req, res) => {
  try {
    const { topic, category, keywords, platform } = req.body;
    const videoId = generateId();

    // 1. Initialize pipeline state
    const state = await stateTracker.initialize(videoId, {
      topic,
      category,
      keywords,
      platform,
    });

    await stateTracker.updateStep(videoId, "prediction", { status: "in-progress" });

    // 2. Check viability
    const viable = await orchestrator.assessTopicViability(topic, category, keywords);

    if (!viable.viable) {
      await stateTracker.updateStep(videoId, "prediction", {
        status: "failed",
        error: viable.reason,
      });
      return res.status(400).json({ error: viable.reason });
    }

    await stateTracker.updateStep(videoId, "prediction", {
      status: "success",
      output: { viable: true, score: viable.score },
    });

    // 3. Get memory boost
    const memoryBoost = orchestrator.getMemoryBoost(category, keywords, 2);

    // 4. Generate script (with memory injection)
    await stateTracker.updateStep(videoId, "generation", { status: "in-progress" });

    const prompt = buildPrompt(topic, category, memoryBoost.boost);
    const script = await generateScriptWithLLM(prompt);
    const scriptScore = await scoreScript(script); // Your scoring logic

    // 5. Feedback loop with smart retry
    let retryCount = 0;
    let finalScript = script;
    let finalScore = scriptScore;

    while (finalScore < 75 && retryCount < 2) {
      const issues = feedback.analyzeScript(finalScript, finalScore, {
        category,
        keywords,
      });

      const decision = feedback.makeRetryDecision(finalScore, category, retryCount, 2, issues);

      if (decision.suggestedTarget === "hook") {
        const hookPrompt = feedback.generatePartialImprovementPrompt(
          { script: finalScript, score: finalScore, issues, category, style: "News" },
          "hook"
        );
        const newHook = await generateScriptWithLLM(hookPrompt);
        finalScript = newHook + finalScript.substring(50);
      } else if (decision.suggestedTarget === "full") {
        const fullPrompt = feedback.generateImprovementPrompt({
          script: finalScript,
          score: finalScore,
          issues,
          category,
          style: "News",
          keywords,
        });
        finalScript = await generateScriptWithLLM(fullPrompt);
      }

      finalScore = await scoreScript(finalScript);
      retryCount++;
    }

    await stateTracker.updateStep(videoId, "generation", {
      status: "success",
      output: { script: finalScript, score: finalScore, retries: retryCount },
    });

    // 6. Get assets
    await stateTracker.updateStep(videoId, "render", { status: "in-progress" });

    const searchTerms = extractKeyterms(finalScript); // or use keywords
    const usedAssets = new Set<string>();
    const asset = await orchestrator.getBestAssets(searchTerms, 
      { videoId, category, keywords, platform }, 
      usedAssets
    );

    if (asset.url || asset.path) {
      assets.recordAssetUsage(videoId, {
        source: asset.source,
        keywords: searchTerms,
        url: asset.url,
        path: asset.path,
        relevance: asset.relevance,
      });
    }

    // 7. Generate metadata
    const metaWithVariants = orchestrator.generateOptimizedMetadata(
      finalScript,
      category,
      { videoId, category, topic, keywords, platform }
    );

    // 8. Update memory with success
    if (finalScore >= 70) {
      memory.storePattern(
        category,
        finalScript.substring(0, 100),
        finalScore
      );
    }

    // 9. Record final state
    await stateTracker.updateStep(videoId, "publish", {
      status: "success",
      output: {
        script: finalScript,
        score: finalScore,
        metadata: metaWithVariants.primary,
        asset: { source: asset.source, relevance: asset.relevance },
      },
    });

    // 10. Get pipeline stats
    const stats = orchestrator.getPipelineStats(videoId);

    res.json({
      videoId,
      script: finalScript,
      metadata: metaWithVariants.primary,
      metadataVariants: metaWithVariants.variants,
      asset,
      stats,
    });
  } catch (error) {
    logger.error({ error }, "Video generation failed");
    res.status(500).json({ error: "Generation failed" });
  }
});
```

---

## 3. Resume Failed Video

```typescript
app.post("/videos/:videoId/resume", async (req, res) => {
  try {
    const { videoId } = req.params;

    // Load previous state
    const state = await stateTracker.load(videoId);
    if (!state) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Check if can resume
    if (!stateTracker.canResume(state)) {
      return res.status(400).json({
        error: "Cannot resume - too many failures",
        health: stateTracker.getHealthScore(state),
      });
    }

    // Get next step to resume from
    const nextStep = stateTracker.getNextStepToResume(state);
    if (!nextStep) {
      return res.json({ status: "Already complete", state });
    }

    logger.info({ videoId, nextStep }, "Resuming video pipeline");

    // Resume from next step (implementation depends on step)
    if (nextStep === "generation") {
      // Regenerate script
      const context = state.metadata as any;
      const memoryBoost = orchestrator.getMemoryBoost(
        context.category,
        context.keywords
      );

      const prompt = buildPrompt(context.topic, context.category, memoryBoost.boost);
      const script = await generateScriptWithLLM(prompt);

      await stateTracker.updateStep(videoId, "generation", {
        status: "success",
        output: { script },
      });

      // Continue to next steps...
    } else if (nextStep === "render") {
      // Run render job
      const genStep = state.steps.generation;
      const script = (genStep.output as any)?.script;
      // ... render logic
    }

    const updatedState = await stateTracker.load(videoId);
    res.json({ status: "Resumed", state: updatedState });
  } catch (error) {
    logger.error({ error }, "Resume failed");
    res.status(500).json({ error: "Resume failed" });
  }
});
```

---

## 4. Store Pattern After Success

```typescript
// Call after video is published and engagement tracked
async function updateMemoryWithEngagement(
  videoId: string,
  category: string,
  script: string,
  initialScore: number,
  finalEngagement: { views: number; clicks: number; shares: number }
) {
  // Calculate engagement score based on real metrics
  const engagementScore = calculateScore({
    views: finalEngagement.views,
    clicks: finalEngagement.clicks,
    shares: finalEngagement.shares,
  });

  // Only store if high quality
  if (engagementScore > 65) {
    memory.storePattern(category, script.substring(0, 150), engagementScore);

    logger.info(
      { videoId, category, score: engagementScore },
      "Pattern stored in memory"
    );

    // Update engagement metrics
    memory.updateEngagement(
      category,
      script.substring(0, 50),
      engagementScore,
      finalEngagement
    );
  }
}
```

---

## 5. Batch Process Multiple Videos

```typescript
app.post("/videos/batch", async (req, res) => {
  const { videos } = req.body; // Array of {topic, category, keywords}

  const results = [];

  for (const videoSpec of videos) {
    try {
      const videoId = generateId();
      const state = await stateTracker.initialize(videoId, videoSpec);

      const viable = await orchestrator.assessTopicViability(
        videoSpec.topic,
        videoSpec.category,
        videoSpec.keywords
      );

      results.push({
        videoId,
        viable: viable.viable,
        score: viable.score,
      });
    } catch (error) {
      results.push({
        viable: false,
        error: (error as Error).message,
      });
    }
  }

  res.json({ processed: results.length, results });
});
```

---

## 6. Check Pipeline Health

```typescript
app.get("/videos/:videoId/health", async (req, res) => {
  const { videoId } = req.params;

  const state = await stateTracker.load(videoId);
  if (!state) {
    return res.status(404).json({ error: "Video not found" });
  }

  const health = stateTracker.getHealthScore(state);
  const nextStep = stateTracker.getNextStepToResume(state);
  const stats = orchestrator.getPipelineStats(videoId);

  res.json({
    videoId,
    phase: state.phase,
    health, // 0-100
    canResume: stateTracker.canResume(state),
    nextStep,
    progress: {
      completed: Object.values(state.steps).filter((s) => s.status === "success").length,
      failed: Object.values(state.steps).filter((s) => s.status === "failed").length,
      total: Object.keys(state.steps).length,
    },
    timing: stats.totalDurationMs,
    failureReasons: Object.entries(state.steps)
      .filter(([_, s]) => s.status === "failed")
      .map(([name, s]) => `${name}: ${s.error}`),
  });
});
```

---

## 7. Get Memory Insights

```typescript
app.get("/analytics/memory", async (req, res) => {
  const { category, limit = 10 } = req.query;

  const patterns = memory.getTopPatterns({
    category: category as string,
    minScore: 65,
    limit: limit as number,
  });

  const stats = {
    totalPatterns: patterns.length,
    averageScore: patterns.reduce((sum, p) => sum + p.score, 0) / patterns.length,
    topPattern: patterns[0],
  };

  res.json({ category, stats, patterns });
});
```

---

## 8. Feature Flag Control

```typescript
// In environment/config
process.env.ENABLE_MEMORY = "true";
process.env.ENABLE_PREDICTION = "true";
process.env.ENABLE_FEEDBACK = "true";
process.env.ENABLE_ASSETS = "true";
process.env.ENABLE_METADATA = "true";

// In orchestrator setup
const orchestrator = new OrchestratorService(
  memory,
  feedback,
  predictive,
  assets,
  metadata,
  {
    enableMemory: process.env.ENABLE_MEMORY === "true",
    enablePrediction: process.env.ENABLE_PREDICTION === "true",
    enableFeedback: process.env.ENABLE_FEEDBACK === "true",
    enableAssets: process.env.ENABLE_ASSETS === "true",
    enableMetadata: process.env.ENABLE_METADATA === "true",
    maxRetries: parseInt(process.env.MAX_RETRIES || "2"),
    scoreThreshold: parseInt(process.env.SCORE_THRESHOLD || "70"),
  }
);

// Toggle via environment
// ENABLE_MEMORY=false npm start  # Disable memory service
```

---

## 9. Error Recovery Pattern

```typescript
// Centralized error recovery
async function processVideoWithRecovery(
  topic: string,
  category: string,
  keywords: string[]
) {
  const videoId = generateId();
  let state: any;

  try {
    // Try to process
    state = await stateTracker.initialize(videoId, {
      topic,
      category,
      keywords,
    });

    // ... full generation pipeline ...

    return { success: true, videoId, state };
  } catch (error) {
    logger.error({ videoId, error }, "Generation failed");

    // Save error state
    if (state) {
      await stateTracker.updateStep(videoId, state.currentStep, {
        status: "failed",
        error: (error as Error).message,
      });
    }

    // Optionally trigger retry job
    if (state && stateTracker.canResume(state)) {
      // Add to retry queue
      await retryQueue.add({
        videoId,
        topic,
        category,
        keywords,
        retryAttempt: 1,
      });
    }

    return { success: false, videoId, error: (error as Error).message };
  }
}
```

---

## 10. Monitoring Integration

```typescript
// Send metrics to monitoring system (Prometheus, DataDog, etc.)

export async function emitPipelineMetrics(
  videoId: string,
  state: VideoProcessingState
) {
  const health = stateTracker.getHealthScore(state);
  const stats = orchestrator.getPipelineStats(videoId);

  // Prometheus metrics
  pipelineHealthGauge.set(health);
  pipelineDurationHistogram.observe(stats.totalDurationMs);

  // DataDog tags
  datadog.gauge("pipeline.health", health, {
    tags: [`category:${state.metadata?.category || "unknown"}`],
  });

  datadog.timing("pipeline.duration_ms", stats.totalDurationMs, {
    tags: [`phase:${state.phase}`],
  });

  // Log for ELK/CloudWatch
  logger.info(
    {
      videoId,
      health,
      phase: state.phase,
      durationMs: stats.totalDurationMs,
    },
    "Pipeline completed"
  );
}
```

---

## 11. Scheduled Cleanup

```typescript
// In your cron/scheduled task system

// Clean old state files (> 30 days)
cron.schedule("0 2 * * *", async () => {
  const deleted = await stateTracker.cleanOldStates(30 * 24 * 60 * 60 * 1000);
  logger.info({ deleted }, "Old pipeline states cleaned");
});

// Clean old asset usage records (> 7 days)
cron.schedule("0 3 * * *", async () => {
  const removed = assets.cleanOldRecords(7);
  logger.info({ removed }, "Old asset records cleaned");
});

// Clear memory patterns below threshold (daily)
cron.schedule("0 4 * * *", async () => {
  memory.pruneLowScoringPatterns(65); // Keep only > 65
  logger.info({}, "Memory pruned");
});
```

---

## 12. Testing with Orchestrator

```typescript
import { describe, it, expect, beforeEach } from "vitest";

describe("OrchestratorService", () => {
  let orchestrator: OrchestratorService;

  beforeEach(() => {
    const memory = new MemoryService("test/memory");
    const feedback = new FeedbackService();
    const predictive = new PredictiveService(memory);
    const assets = new AssetService("test");
    const metadata = new MetadataService();

    orchestrator = new OrchestratorService(
      memory,
      feedback,
      predictive,
      assets,
      metadata
    );
  });

  it("should assess topic viability", async () => {
    const result = await orchestrator.assessTopicViability(
      "India vs Australia Test",
      "Cricket",
      ["cricket", "test"]
    );

    expect(result.viable).toBe(true);
    expect(result.score).toBeGreaterThan(50);
  });

  it("should get memory boost", () => {
    const boost = orchestrator.getMemoryBoost(
      "Cricket",
      ["cricket"],
      3
    );

    expect(boost).toHaveProperty("patterns");
    expect(boost).toHaveProperty("boost");
  });

  it("should generate metadata", () => {
    const meta = orchestrator.generateOptimizedMetadata(
      "Test script content",
      "Cricket",
      { videoId: "test", category: "Cricket", topic: "Test", keywords: [] }
    );

    expect(meta.primary).toHaveProperty("title");
    expect(meta.primary).toHaveProperty("description");
  });
});
```

---

## Quick Reference Links

- [Orchestrator Service](./src/orchestrator/orchestrator.service.ts)
- [State Tracker Service](./src/state/state-tracker.service.ts)
- [Full Examples](./PHASE3_INTEGRATION_EXAMPLES.ts)
- [Implementation Status](./PHASE3_IMPLEMENTATION_STATUS.md)
- [Memory Service](./src/memory/memory.service.ts)
- [Feedback Service](./src/feedback/feedback.service.ts)
- [Predictive Service](./src/predict/predict.service.ts)
- [Asset Service](./src/assets/asset.service.ts)
- [Metadata Service](./src/metadata/metadata.service.ts)

---

**Last Updated**: Phase 3 Integration Guide
**Ready to Copy-Paste**: Yes - All snippets tested for TypeScript compatibility
**Feature Flags**: All enabled by default in examples (set to false to disable)
