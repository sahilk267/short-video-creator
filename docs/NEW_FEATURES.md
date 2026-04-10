# Enhanced Features Documentation

This document describes new capabilities added to the Short Video Creator pipeline to enable intelligent, self-improving content generation.

## Overview

All new features are:
- **Optional**: Controlled by feature flags, all disabled by default
- **Non-breaking**: Existing pipeline works unchanged
- **Modular**: Each service can be used independently
- **Safe**: Graceful degradation if any service fails
- **Monitored**: Comprehensive logging

## Architecture

```
Raw Input
    ↓
[Predictive Service] ← if enabled: assess viability
    ↓
[Agent Loop] ← if enabled: orchestrate generation with feedback
    ├→ [Feedback Service] ← if enabled: improve scripts iteratively
    ├→ [Memory Service] ← if enabled: apply patterns from past
    └→ [Script Generator] ← existing, unchanged
    ↓
[Asset Service] ← if enabled: multi-source fallback
    ↓
[Beat Sync Service] ← if enabled: align with music
    ↓
[Existing Renderer]
    ↓
[Publisher] + [Metadata Service] ← if enabled: platform-specific optimization
    ↓
Published Video
```

## Services

### 1. Memory Service (`src/memory/memory.service.ts`)

**Purpose**: Store and retrieve high-performing script patterns to improve consistency.

**Key Methods**:
- `savePattern(script, score, category, options)` - Store high-scoring scripts
- `getTopPatterns(query)` - Retrieve top patterns by category/style
- `getSimilarPatterns(keywords, category)` - Find related patterns
- `updatePatternEngagement(patternId, engagement)` - Track performance

**Usage**:
```typescript
const memory = new MemoryService(config.dataDirPath);

// Store a high-performing script
if (score > 65) {
  await memory.savePattern(script, score, "Cricket", {
    style: "Viral",
    keywords: ["ipl", "cricket"],
    engagement: { views: 1000, likes: 50, shares: 10 }
  });
}

// Retrieve similar patterns
const patterns = memory.getSimilarPatterns(["ipl", "cricket"], "Cricket");
```

**Benefits**:
- Improves consistency without adding complexity
- Enables pattern discovery and reuse
- Bounded memory usage (prunes old patterns)
- Works across sessions

---

### 2. Feedback Service (`src/feedback/feedback.service.ts`)

**Purpose**: Analyze scripts and suggest improvements, enabling iterative refinement.

**Key Methods**:
- `analyzeScript(script, score, options)` - Identify quality issues
- `generateImprovementPrompt(context)` - Create feedback for regeneration
- `shouldRetry(score, retryCount, maxRetries)` - Decide if retry is worth it

**Issues Detected**:
- Hook weakness (opening doesn't grab attention)
- Low keyword coverage
- Incorrect length for style
- Poor clarity (long sentences)
- Generic engagement problems

**Usage**:
```typescript
const feedback = new FeedbackService();

// Analyze script
const issues = feedback.analyzeScript(script, 55, {
  category: "Cricket",
  style: "Viral",
  keywords: ["ipl", "batting"]
});

// If score is low, regenerate with feedback
if (feedback.shouldRetry(55, 0, 2)) {
  const improvementPrompt = feedback.generateImprovementPrompt({
    script,
    score: 55,
    issues,
    category: "Cricket",
    style: "Viral",
    keywords: ["ipl", "batting"]
  });
  
  // Pass this prompt to LLM for regeneration
}
```

**Benefits**:
- Specific improvement suggestions vs generic retries
- Reduces wasted regeneration attempts
- Combines multiple quality dimensions

---

### 3. Asset Service (`src/assets/asset.service.ts`)

**Purpose**: Gracefully fall back to alternative asset sources if primary fails.

**Key Methods**:
- `getVideoWithFallback(keywords, fallbackLogic)` - Try sources in priority order
- `findLocalAsset(keywords)` - Search local asset library
- `getLocalAssetStats()` - Monitor available assets
- `registerSource(source)` - Add new asset providers

**Fallback Chain**:
1. Try Pexels API (existing)
2. Try local assets in `data/assets/` directory
3. Return placeholder (pipeline continues in degraded mode)

**Usage**:
```typescript
const assetService = new AssetService(config.dataDirPath);

const asset = await assetService.getVideoWithFallback(
  ["cricket", "ipl"],
  {
    pexelsApi: pexelsInstance,
    duration: 5
  }
);

if (asset?.url) {
  // Use Pexels URL
}
else if (asset?.path) {
  // Use local video file
}
else {
  // Use placeholder or adjust rendering strategy
}
```

**Benefits**:
- Increases reliability (Pexels API failures don't break pipeline)
- Enables local asset library (control over stock footage)
- Easy to extend with new providers (Pixabay, Unsplash, etc.)

---

### 4. Metadata Service (`src/metadata/metadata.service.ts`)

**Purpose**: Generate platform-specific titles, descriptions, and hashtags.

**Key Methods**:
- `generateMetadata(script, platform, options)` - Create optimized metadata
- Platform limits auto-enforced (YouTube ≠ Instagram ≠ TikTok)

**Platforms Supported**:
- YouTube (SEO-focused, long descriptions)
- Instagram (emoji-rich, engagement CTAs)
- TikTok (trendy, hashtag-heavy)
- Telegram (clean, informative)
- Facebook (story-driven, sharing-focused)

**Usage**:
```typescript
const metadata = new MetadataService();

// Generate for YouTube
const ytMetadata = metadata.generateMetadata(script, "youtube", {
  category: "Cricket",
  keywords: ["ipl", "batting", "virat"],
  topic: "Virat Kohli century",
  style: "Viral"
});

// Auto-applied constraints:
// - Title: max 70 chars
// - Description: max 5000 chars
// - Hashtags: max 30, only YouTube relevant ones
```

**Benefits**:
- Eliminates manual metadata creation
- Platform-optimized (not one-size-fits-all)
- Auto-truncates to limits
- Includes platform-specific hashtags

---

### 5. Predictive Service (`src/predict/predict.service.ts`)

**Purpose**: Assess topic viability BEFORE generation to avoid wasted effort.

**Key Methods**:
- `assessTopic(topic, category, options)` - Viability score 0-100
- `predictEngagement(topic, options)` - Predict engagement potential

**Assessment Factors**:
- Topic specificity (5-8 words ideal)
- Keyword strength (2-4 strong keywords)
- Category historical performance
- Similar patterns in memory (if available)

**Recommendations**:
- `generate`: Go ahead (score >= 60)
- `risky`: Proceed with caution (score 40-60)
- `reject`: Likely to fail (score < 40)

**Usage**:
```typescript
const predictive = new PredictiveService(memory);

const assessment = predictive.assessTopic(
  "Virat Kohli scores century in IPL match",
  "Cricket",
  {
    keywords: ["ipl", "kohli", "cricket", "century"],
    pastEngagement: [{ category: "Cricket", avgScore: 82 }]
  }
);

if (assessment.recommendation === "reject") {
  // Skip generation
}
else if (assessment.recommendation === "risky") {
  // Generate but expect lower quality
}
else {
  // Generate with confidence
}
```

**Benefits**:
- Prevents wasted effort on low-quality topics
- Guides generation strategy based on category performance
- Optional gating before expensive operations

---

### 6. Beat Sync Service (`src/video/beat-sync.service.ts`)

**Purpose**: Align scene durations with music beats for rhythm-matched editing.

**Key Methods**:
- `syncScenesToBeats(scenes, config)` - Suggest optimal durations
- `applySyncToScenes(syncedScenes)` - Apply to actual scenes
- `suggestBPM(scenes)` - Infer BPM from content
- `getSyncStats(syncedScenes)` - Monitor alignment quality

**Musical Boundaries** (in priority order):
1. Full bar (e.g., 4 beats at 120 BPM = 2000ms)
2. Half bar (1000ms)
3. Single beat (500ms)
4. Half beat (250ms)

**Usage**:
```typescript
const beatSync = new BeatSyncService();

const syncedScenes = beatSync.syncScenesToBeats(scenes, {
  bpm: 120,                    // From music selection
  beatsPerBar: 4,              // Standard 4/4 time
  enforceAlignment: false      // Suggest only, don't force
});

// Apply if desired
const updatedScenes = beatSync.applySyncToScenes(syncedScenes);

// Monitor quality
const stats = beatSync.getSyncStats(syncedScenes);
// { avgAlignment: 0.92, wellAlignedCount: 5, ... }
```

**Benefits**:
- Creates rhythm-matched pacing (feels professional)
- Optional (can be suggested without enforcement)
- Works with any BPM/musictempo
- Backward compatible (original durations preserved)

---

### 7. Agent Loop Service (`src/agents/agent-loop.service.ts`)

**Purpose**: Lightweight orchestration that coordinates feedback, memory, and prediction.

**Key Methods**:
- `runLoop(generatorFn, context)` - Run generation with retries & feedback

**Loop Steps**:
1. Check memory for similar patterns
2. Predict topic viability
3. Generate script (with feedback if retry)
4. Evaluate against issues
5. Decide to retry or accept
6. Store in memory if high-quality

**Usage**:
```typescript
const agentLoop = new AgentLoopService(
  feedbackService,
  memoryService,
  predictiveService,
  {
    maxRetries: 2,
    scoreThreshold: 70,
    enableMemory: true,
    enablePrediction: true,
    enableFeedback: true
  }
);

const result = await agentLoop.runLoop(
  async (feedback) => {
    // Call existing script generator with optional feedback
    return aiLlmGenerator.generateScript(stories, options, feedback);
  },
  {
    category: "Cricket",
    topic: "IPL Century",
    keywords: ["ipl", "century"],
    style: "Viral"
  }
);

console.log(result);
// {
//   finalScript: "...",
//   finalScore: 82,
//   attempts: [ ... ],
//   improved: true,
//   memoryUsed: true
// }
```

**Benefits**:
- Coordinates multiple intelligent services
- Minimal dependencies (each service optional)
- Returns full context (attempts, decisions, etc.)
- Enables progressive deployment

---

## Feature Flags

Located in `src/config/featureFlags.ts`:

```typescript
enableFeedbackLoop: false           // Self-improving scripts
enableMemory: false                 // Pattern reuse
enablePredictiveScoring: false      // Topic viability
enableAssetFallback: false          // Multi-source assets
enableMetadataGeneration: false     // Platform optimization
enableBeatSync: false               // Music alignment
enableAgentLoop: false              // Orchestration
```

**Enable via environment variables**:
```bash
FEATURE_FEEDBACK_LOOP=true
FEATURE_MEMORY=true
FEATURE_PREDICTIVE_SCORING=true
FEATURE_ASSET_FALLBACK=true
FEATURE_METADATA_GENERATION=true
FEATURE_BEAT_SYNC=false
FEATURE_AGENT_LOOP=true
```

---

## Recommended Rollout

### Phase 1: Foundation (Low Risk)
- **Metadata Service** (pure generation, no side effects)
- **Asset Fallback** (only used if Pexels fails)
- **Beat Sync** (optional enhancement, doesn't change output if disabled)

### Phase 2: Intelligence (Medium Risk)
- **Feedback Loop** (requires careful monitoring)
- **Memory** (requires validation of stored patterns)

### Phase 3: Full Orchestration (After validation)
- **Predictive Scoring** (guides decisions)
- **Agent Loop** (full coordination)

**Each phase = 2-5 days validation before enabling next.**

---

## Monitoring & Observability

All services log comprehensively:

```typescript
logger.debug({ ... }, "Debug details")      // Detailed trace
logger.info({ ... }, "User action")          // Normal operation
logger.warn({ ... }, "Fallback used")        // Non-fatal issues
logger.error({ ... }, "Failure")             // Errors that need attention
```

**Key metrics to watch**:

| Service | Metric | Target |
|---------|--------|--------|
| Memory | Patterns stored | 100-500/category |
| Memory | Avg pattern score | > 75 |
| Feedback | Retry rate | < 30% |
| Feedback | Score improvement | +10-15 per retry |
| Assets | Fallback rate | < 5% (if Pexels stable) |
| Metadata | Generation time | < 100ms |
| Beat Sync | Avg alignment | > 0.85 |
| Agent Loop | Total attempts | avg 1.5-2 per script |

---

## Performance Impact

- **Memory**: ~10KB per pattern, bounded to ~50MB/category
- **Feedback Analysis**: ~50ms per script
- **Metadata Generation**: ~20ms per script
- **Beat Sync**: ~30ms for typical scenes
- **API calls**: No additional external calls

**Low-resource environments**: Can disable memory + beat sync to minimize overhead.

---

## Error Handling

All services follow pattern:

```typescript
try {
  // Attempt operation
} catch (error) {
  logger.warn/error({ error }, "Service degraded");
  // Continue with fallback/original logic
}
```

**Pipeline continues even if new services fail** (backward compatible).

---

## Future Extensions

The architecture supports adding:
- Additional asset providers (Pixabay, Unsplash)
- Additional publishing platforms (LinkedIn, Bluesky)
- Additional analysis dimensions (sentiment, tone, pacing)
- ML model integration (replace heuristics)
- A/B test framework (built on memory + metadata)

All without modifying existing code.

---

