#!/usr/bin/env node
/**
 * PHASE 3 INTEGRATION GUIDE
 * 
 * Converting modular intelligent services into a coordinated, connected system
 * This guide shows how to wire up all Phase 2 services with orchestration
 * 
 * ==================== TABLE OF CONTENTS ====================
 * 
 * A. QUICK START (5 minutes)
 * B. FULL INTEGRATION (30 minutes)
 * C. SERVICE-BY-SERVICE INTEGRATION
 * D. ADVANCED PATTERNS
 * E. TROUBLESHOOTING
 * F. MONITORING & OBSERVABILITY
 */

// ============================================================
// A. QUICK START - Minimal integration to get services working together
// ============================================================

import { OrchestratorService } from "./src/orchestrator/orchestrator.service";
import { StateTrackerService } from "./src/state/state-tracker.service";
import { MemoryService } from "./src/memory/memory.service";
import { FeedbackService } from "./src/feedback/feedback.service";
import { PredictiveService } from "./src/predict/predict.service";
import { AssetService } from "./src/assets/asset.service";
import { MetadataService } from "./src/metadata/metadata.service";
import { logger } from "./src/logger";

/**
 * EXAMPLE 1: Single video processing pipeline
 * 
 * This shows the orchestrator coordinating all services for one video
 */
async function exampleMinimalIntegration() {
  // 1. Initialize services
  const memory = new MemoryService("data/memory");
  const feedback = new FeedbackService();
  const predictive = new PredictiveService(memory);
  const assets = new AssetService("data");
  const metadata = new MetadataService();
  const stateTracker = new StateTrackerService("data/pipeline-states");

  // 2. Create orchestrator (central coordinator)
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

  // 3. Process single video
  const videoId = "video_001";
  const context = {
    videoId,
    category: "Cricket",
    topic: "India-Australia Test Series",
    keywords: ["cricket", "test match", "india", "australia"],
    style: "News" as const,
    platform: "youtube" as const,
  };

  // 4. Initialize pipeline state
  const state = await stateTracker.initialize(videoId, context);
  console.log(`Pipeline initialized for ${videoId}`);
  console.log(`State: ${state.phase}, Steps: ${Object.keys(state.steps).length}`);

  // 5. Check topic viability via orchestrator
  const viable = await orchestrator.assessTopicViability(
    context.topic,
    context.category,
    context.keywords
  );

  console.log(`Topic viable: ${viable.viable}, Score: ${viable.score}`);

  if (!viable.viable) {
    console.log(`Not viable: ${viable.reason}`);
    return;
  }

  // 6. Get memory patterns to boost generation
  const memoryBoost = orchestrator.getMemoryBoost(
    context.category,
    context.keywords,
    3 // top 3 patterns
  );

  console.log(`Memory patterns available: ${memoryBoost.patterns.length}`);

  // 7. Update state after prediction step
  await stateTracker.updateStep(videoId, "prediction", {
    status: "success",
    output: {
      viable: viable.viable,
      score: viable.score,
      reason: viable.reason,
    },
  });
}

// ============================================================
// B. FULL INTEGRATION - Complete video processing with all services
// ============================================================

/**
 * EXAMPLE 2: Full pipeline with smart retry and feedback loop
 */
async function exampleFullIntegration() {
  const memory = new MemoryService("data/memory");
  const feedback = new FeedbackService();
  const predictive = new PredictiveService(memory);
  const assets = new AssetService("data");
  const metadata = new MetadataService();
  const stateTracker = new StateTrackerService("data/pipeline-states");

  const orchestrator = new OrchestratorService(memory, feedback, predictive, assets, metadata, {
    enableMemory: true,
    enablePrediction: true,
    enableFeedback: true,
    enableAssets: true,
    enableMetadata: true,
    maxRetries: 2,
    scoreThreshold: 70,
  });

  const videoId = "video_full_001";
  const context = {
    videoId,
    category: "Cricket",
    topic: "India-Australia Test Series Updates",
    keywords: ["cricket", "test", "india", "australia", "sports"],
    style: "News" as const,
    platform: "youtube" as const,
  };

  // Initialize state and pipeline
  const state = await stateTracker.initialize(videoId, context);
  let currentState = state;

  // Step 1: Predict viability
  console.log("\n=== STEP 1: Prediction ===");
  await stateTracker.updateStep(videoId, "prediction", { status: "in-progress" });

  const viable = await orchestrator.assessTopicViability(
    context.topic,
    context.category,
    context.keywords
  );

  await stateTracker.updateStep(videoId, "prediction", {
    status: viable.viable ? "success" : "failed",
    output: { viable: viable.viable, score: viable.score },
  });

  if (!viable.viable) {
    console.log(`❌ Topic rejected: ${viable.reason}`);
    return;
  }

  console.log(`✅ Topic approved with score ${viable.score}`);

  // Step 2: Get memory boost for generation
  console.log("\n=== STEP 2: Get Memory Boost ===");
  const memoryBoost = orchestrator.getMemoryBoost(context.category, context.keywords, 2);
  console.log(`Memory boost: ${memoryBoost.patterns.length} patterns available`);
  console.log(`Prompt boost: ${memoryBoost.boost.substring(0, 100)}...`);

  // Step 3: Generate script (simplified - just using memory info)
  console.log("\n=== STEP 3: Script Generation ===");
  await stateTracker.updateStep(videoId, "generation", { status: "in-progress" });

  // Simulate script generation with memory boost
  const generatedScript = `Breaking News: India vs Australia Test Series\n\n${memoryBoost.boost}\n\nThis is a breaking news update about the latest cricket developments...`;

  // Score the script (mock scoring - normally from AI)
  let scriptScore = 65;
  let retryCount = 0;

  while (scriptScore < 75 && retryCount < 2) {
    await stateTracker.updateStep(videoId, "generation", {
      status: "failed",
      output: { script: generatedScript, score: scriptScore },
    });

    console.log(`📊 Script score: ${scriptScore} (retrying...)`);

    // Use feedback to decide retry strategy
    const issues = feedback.analyzeScript(generatedScript, scriptScore, {
      category: context.category,
      style: context.style,
      keywords: context.keywords,
    });

    const decision = feedback.makeRetryDecision(scriptScore, context.category, retryCount);

    console.log(`  Retry strategy: ${decision.suggestedTarget || 'full'}`);
    console.log(`  Reason: ${decision.reason}`);

    // Regenerate (simplified)
    scriptScore += 10; // Assume regeneration improves score
    retryCount++;
  }

  await stateTracker.updateStep(videoId, "generation", {
    status: "success",
    output: { script: generatedScript, score: scriptScore, retries: retryCount },
  });

  console.log(`✅ Script approved with score ${scriptScore}`);

  // Step 4: Get best assets with orchestrator
  console.log("\n=== STEP 4: Asset Selection ===");
  await stateTracker.updateStep(videoId, "render", { status: "in-progress" });

  const assetSearchTerms = ["cricket", "test match"];
  const usedAssets = new Set<string>();

  const asset = await orchestrator.getBestAssets(assetSearchTerms, context, usedAssets);
  console.log(`Asset selected: source=${asset.source}, relevance=${asset.relevance.toFixed(2)}`);

  if (asset.path || asset.url) {
    assets.recordAssetUsage(videoId, {
      source: asset.source,
      keywords: assetSearchTerms,
      path: asset.path,
      url: asset.url,
      relevance: asset.relevance,
    });
  }

  // Step 5: Generate metadata with variants
  console.log("\n=== STEP 5: Metadata Generation ===");
  const metaWithVariants = orchestrator.generateOptimizedMetadata(
    generatedScript,
    context.category,
    context
  );

  console.log(`Primary title: ${metaWithVariants.primary.title}`);
  console.log(`Variants: ${metaWithVariants.variants?.length || 0}`);

  // Update final state
  await stateTracker.updateStep(videoId, "publish", {
    status: "success",
    output: {
      metadata: metaWithVariants.primary,
      asset: { source: asset.source, relevance: asset.relevance },
      scriptScore,
      retries: retryCount,
    },
  });

  // Get stats
  const stats = orchestrator.getPipelineStats(videoId);
  console.log(`\n=== Pipeline Stats ===`);
  console.log(`Duration: ${stats.totalDurationMs}ms`);
  console.log(`Success rate: ${(stats.successRate * 100).toFixed(1)}%`);

  // Show health check
  const health = stateTracker.getHealthScore(currentState);
  console.log(`Health score: ${health}/100`);
}

// ============================================================
// C. SERVICE-BY-SERVICE INTEGRATION EXAMPLES
// ============================================================

/**
 * EXAMPLE 3: Memory Service Integration
 * 
 * Inject learned patterns into script generation
 */
async function exampleMemoryIntegration() {
  const memory = new MemoryService("data/memory");

  // Step 1: Store successful patterns
  memory.storePattern("Cricket", "Breaking news format with stats", 85);
  memory.storePattern("Cricket", "Visual comparison style", 78);
  memory.storePattern("Cricket", "Player interview format", 72);

  // Step 2: Retrieve for current generation
  const patterns = memory.getTopPatterns({
    category: "Cricket",
    minScore: 70,
    limit: 3,
  });

  console.log("Top patterns for Cricket:");
  patterns.forEach((p, i) => {
    console.log(`  ${i + 1}. [${p.score}] ${p.script}`);
  });

  // Step 3: Use similarity search
  const keywords = ["cricket", "breaking", "news"];
  const similar = memory.getSimilarPatterns(keywords, "Cricket", 2);
  console.log(`\nSimilar patterns (${similar.length}):`);
  similar.forEach((p) => {
    console.log(`  - [${p.score}] ${p.script}`);
  });

  // Step 4: Update engagement post-publish
  memory.updateEngagement("Cricket", "Player interview format", 82, { views: 50000, clicks: 2000 });
}

/**
 * EXAMPLE 4: Feedback Service with Smart Retry
 */
async function exampleFeedbackIntegration() {
  const feedback = new FeedbackService();

  const script = "Cricket update: India team performance in latest test.";
  const score = 55;

  // Step 1: Analyze script
  const issues = feedback.analyzeScript(script, score, {
    category: "Cricket",
    style: "News",
    keywords: ["cricket", "india", "test", "breaking"],
  });

  console.log(`Issues found: ${issues.length}`);
  issues.forEach((issue) => {
    console.log(`  - [${issue.severity}] ${issue.type}: ${issue.message}`);
  });

  // Step 2: Make smart retry decision
  const decision = feedback.makeRetryDecision(score, "Cricket", 0, 2, issues);
  console.log(`\nRetry decision:`);
  console.log(`  Should retry: ${decision.shouldRetry}`);
  console.log(`  Reason: ${decision.reason}`);
  console.log(`  Target: ${decision.suggestedTarget}`);

  // Step 3: Generate targeted improvement prompt
  if (decision.suggestedTarget) {
    const improvePrompt = feedback.generatePartialImprovementPrompt(
      { script, score, issues, category: "Cricket", style: "News" },
      decision.suggestedTarget
    );

    console.log(`\nPartial improvement prompt (${decision.suggestedTarget}):`);
    console.log(improvePrompt.substring(0, 150) + "...");
  }
}

/**
 * EXAMPLE 5: Predictive Service with Memory Integration
 */
async function examplePredictiveIntegration() {
  const memory = new MemoryService("data/memory");
  memory.storePattern("Cricket", "Breaking news format", 88);
  memory.storePattern("Cricket", "Comparison style", 82);

  const predictive = new PredictiveService(memory);

  const topic = "India vs Australia Test Final Day";
  const category = "Cricket";
  const keywords = ["cricket", "test", "india", "australia"];

  // Step 1: Get detailed assessment with memory
  const assessment = predictive.getDetailedAssessment(topic, category, {
    keywords,
    style: "News",
    memoryEnabled: true,
  });

  console.log("Detailed Assessment:");
  console.log(`  Viability score: ${assessment.viability.score}`);
  console.log(`  Memory forecast: ${assessment.memory.forecast.toFixed(1)}`);
  console.log(`  Confidence: ${(assessment.viability.confidence * 100).toFixed(0)}%`);

  // Step 2: Enforce strict threshold
  const threshold = predictive.enforceScoreThreshold(assessment.viability.score, category, true);
  console.log(`\nStrict threshold check:`);
  console.log(`  Passed: ${threshold.passed}`);
  console.log(`  Reason: ${threshold.reason}`);

  // Step 3: Get memory-boosted forecast
  const forecast = predictive.getForecastWithMemory(topic, category, keywords);
  console.log(`\nMemory-boosted forecast:`);
  console.log(`  Base: ${forecast.baseScore}`);
  console.log(`  Memory boost: +${forecast.memoryBoosted.toFixed(1)}`);
  console.log(`  Final forecast: ${forecast.forecast.toFixed(1)}`);
}

/**
 * EXAMPLE 6: Asset Service with Relevance Scoring
 */
async function exampleAssetIntegration() {
  const assets = new AssetService("data");

  // Step 1: Score asset relevance
  const searchKeywords = ["cricket", "batting", "india"];
  const assetKeywords = ["cricket", "india", "sports"];

  const relevance = assets.scoreAssetRelevance(searchKeywords, assetKeywords);
  console.log(`Asset relevance: ${(relevance * 100).toFixed(1)}%`);

  // Step 2: Track asset usage
  const videoId = "vid_001";
  const asset = {
    source: "pexels",
    keywords: ["cricket", "batting"],
    url: "https://example.com/cricket.mp4",
  };

  assets.recordAssetUsage(videoId, asset);
  console.log(`Asset usage recorded for ${videoId}`);

  // Step 3: Check for duplicates
  const isDuplicate = assets.hasRecentlyUsed(asset.url || "", 30);
  console.log(`Used recently: ${isDuplicate}`);

  // Step 4: Get all assets for video
  const videoAssets = assets.getVideoAssets(videoId);
  console.log(`Assets for video: ${videoAssets.length}`);
}

/**
 * EXAMPLE 7: Metadata Service with Variants
 */
async function exampleMetadataIntegration() {
  const metadata = new MetadataService();

  const script = "Breaking: India wins the test match with amazing performance by the batsmen.";
  const platform = "youtube";

  // Step 1: Generate metadata with variants
  const result = metadata.generateMetadataWithVariants(script, platform as any, {
    category: "Cricket",
    keywords: ["cricket", "india", "test", "match"],
    style: "News",
    generateVariants: true,
  });

  console.log("Primary metadata:");
  console.log(`  Title: ${result.primary.title}`);
  console.log(`  Keywords: ${result.primary.keywords.join(", ")}`);

  console.log(`\nVariants: ${result.variants.length}`);
  result.variants.forEach((v, i) => {
    console.log(`  Variant ${i + 1}: ${v.title.substring(0, 50)}...`);
  });

  // Step 2: Generate SEO keywords
  const seoKeywords = metadata.generateSEOKeywords(script, "Cricket", 5);
  console.log("\nSEO Keywords:");
  console.log(`  Primary: ${seoKeywords.primary.join(", ")}`);
  console.log(`  Secondary: ${seoKeywords.secondary.join(", ")}`);

  // Step 3: Get LLM prompts for enhancement
  const prompts = metadata.generateLLMPrompt(script, "Cricket", seoKeywords.primary);
  console.log("\nLLM Prompts generated:");
  console.log(`  SEO prompt: ${prompts.seoPrompt.substring(0, 80)}...`);
  console.log(`  Title variant prompt: ${prompts.titleVariantPrompt.substring(0, 80)}...`);
}

// ============================================================
// D. STATE TRACKER - Resume capability across steps
// ============================================================

/**
 * EXAMPLE 8: State Tracking for Resume Capability
 */
async function exampleStateTracking() {
  const stateTracker = new StateTrackerService("data/pipeline-states");

  const videoId = "vid_resumable";
  const context = { category: "Cricket", topic: "Test Match" };

  // Step 1: Initialize
  const state = await stateTracker.initialize(videoId, context);
  console.log(`Initialized state for ${videoId}`);

  // Step 2: Simulate steps
  await stateTracker.updateStep(videoId, "prediction", { status: "success" });
  await stateTracker.updateStep(videoId, "generation", { status: "success" });
  await stateTracker.updateStep(videoId, "tts", {
    status: "failed",
    error: "TTS service error",
    retryIncrement: true,
  });

  // Step 3: Load and check for resume
  const loadedState = await stateTracker.load(videoId);
  if (loadedState) {
    const nextStep = stateTracker.getNextStepToResume(loadedState);
    console.log(`Next step to resume: ${nextStep}`);

    const canResume = stateTracker.canResume(loadedState);
    console.log(`Can resume: ${canResume}`);

    const health = stateTracker.getHealthScore(loadedState);
    console.log(`Health score: ${health}/100`);

    // Step 4: Export debug info
    const debug = stateTracker.exportDebugInfo(loadedState);
    console.log("\nDebug info:");
    console.log(JSON.stringify(debug, null, 2));
  }
}

// ============================================================
// E. ADVANCED PATTERNS
// ============================================================

/**
 * EXAMPLE 9: Batch processing with orchestrator
 */
async function exampleBatchProcessing() {
  const memory = new MemoryService("data/memory");
  const feedback = new FeedbackService();
  const predictive = new PredictiveService(memory);
  const assets = new AssetService("data");
  const metadata = new MetadataService();
  const stateTracker = new StateTrackerService("data/pipeline-states");

  const orchestrator = new OrchestratorService(memory, feedback, predictive, assets, metadata);

  const videos = [
    { videoId: "batch_01", topic: "India Cricket Updates", category: "Cricket" },
    { videoId: "batch_02", topic: "Tech Startups", category: "Technology" },
    { videoId: "batch_03", topic: "Market Trends", category: "Business" },
  ];

  console.log(`Processing ${videos.length} videos...\n`);

  for (const video of videos) {
    const context = {
      videoId: video.videoId,
      category: video.category,
      topic: video.topic,
      keywords: [video.category.toLowerCase()],
    };

    const state = await stateTracker.initialize(video.videoId, context);

    const viable = await orchestrator.assessTopicViability(
      video.topic,
      video.category,
      [video.category.toLowerCase()]
    );

    console.log(
      `${video.videoId}: ${viable.viable ? "✅" : "❌"} (score: ${viable.score})`
    );
  }

  // Get all active states
  const active = await stateTracker.getActiveStates();
  console.log(`\nActive pipelines: ${active.length}`);
}

// ============================================================
// F. MONITORING & OBSERVABILITY
// ============================================================

/**
 * EXAMPLE 10: Comprehensive logging and metrics
 */
async function exampleObservability() {
  const memory = new MemoryService("data/memory");
  const feedback = new FeedbackService();
  const predictive = new PredictiveService(memory);
  const assets = new AssetService("data");
  const metadata = new MetadataService();
  const stateTracker = new StateTrackerService("data/pipeline-states");

  const orchestrator = new OrchestratorService(memory, feedback, predictive, assets, metadata);

  const videoId = "obs_001";
  const context = {
    videoId,
    category: "Cricket",
    topic: "Test Series",
    keywords: ["cricket", "test"],
  };

  // Track each step with timing
  console.log("Observability Example:\n");

  const stepTimings: Record<string, number> = {};

  // Prediction step
  let startTime = Date.now();
  await orchestrator.assessTopicViability("Test Series", "Cricket", ["cricket"]);
  stepTimings["prediction"] = Date.now() - startTime;
  console.log(`[PREDICTION] ${stepTimings["prediction"]}ms`);

  // Memory boost step
  startTime = Date.now();
  const boost = orchestrator.getMemoryBoost("Cricket", ["cricket"], 3);
  stepTimings["memory"] = Date.now() - startTime;
  console.log(`[MEMORY] ${stepTimings["memory"]}ms - ${boost.patterns.length} patterns`);

  // Asset step
  startTime = Date.now();
  await orchestrator.getBestAssets(["cricket"], context);
  stepTimings["assets"] = Date.now() - startTime;
  console.log(`[ASSETS] ${stepTimings["assets"]}ms`);

  // Metadata step
  startTime = Date.now();
  orchestrator.generateOptimizedMetadata("Test script", "Cricket", context);
  stepTimings["metadata"] = Date.now() - startTime;
  console.log(`[METADATA] ${stepTimings["metadata"]}ms`);

  // Summary
  const totalTime = Object.values(stepTimings).reduce((a, b) => a + b, 0);
  console.log(`\nTotal: ${totalTime}ms`);
  console.log(
    `Slowest: ${Object.entries(stepTimings).sort((a, b) => b[1] - a[1])[0][0]} (${Object.entries(stepTimings).sort((a, b) => b[1] - a[1])[0][1]}ms)`
  );
}

// ============================================================
// Run examples
// ============================================================

if (require.main === module) {
  console.log("Phase 3 Integration Examples\n");
  console.log("Available examples:");
  console.log("  1. Minimal Integration (5 min)");
  console.log("  2. Full Integration (30 min)");
  console.log("  3. Memory Service");
  console.log("  4. Feedback Service");
  console.log("  5. Predictive Service");
  console.log("  6. Asset Service");
  console.log("  7. Metadata Service");
  console.log("  8. State Tracking");
  console.log("  9. Batch Processing");
  console.log("  10. Observability\n");

  // Run example (change number to run different example)
  const exampleNumber = process.env.EXAMPLE || "1";
  const examples = [
    exampleMinimalIntegration,
    exampleFullIntegration,
    exampleMemoryIntegration,
    exampleFeedbackIntegration,
    examplePredictiveIntegration,
    exampleAssetIntegration,
    exampleMetadataIntegration,
    exampleStateTracking,
    exampleBatchProcessing,
    exampleObservability,
  ];

  const example = examples[parseInt(exampleNumber) - 1];
  if (example) {
    example().catch(console.error);
  } else {
    console.log(`Invalid example: ${exampleNumber}`);
  }
}

export {
  exampleMinimalIntegration,
  exampleFullIntegration,
  exampleMemoryIntegration,
  exampleFeedbackIntegration,
  examplePredictiveIntegration,
  exampleAssetIntegration,
  exampleMetadataIntegration,
  exampleStateTracking,
  exampleBatchProcessing,
  exampleObservability,
};
