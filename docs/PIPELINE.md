# AI Content Pipeline — Technical Reference

## Overview

The AI Content Pipeline is a central orchestration system that connects all existing AI engines and content tools into a single automated workflow. Given a `topic`, `platform`, and `tone`, it produces ready-to-post content packages including hooks, captions, hashtags, thumbnail directives, and emotional/quality scores — all ranked by AI.

---

## Pipeline Flow

```
INPUT: { topic, platform, tone, bulkCount?, autoSchedule? }
         │
         ▼
Step 1 ─ Generate Hooks
         HookLibraryEngine.generateWithTopic(topic, { platform, limit: bulkCount })
         → Returns hook templates with {topic} interpolated
         │
         ▼
Step 2 ─ Humanize Content          (per variation)
         HumanizedContentEngine.humanizeContent(script, tone)
         → pause timings, gesture points, eye movement, voice settings
         │
         ▼
Step 3 ─ Emotional Resonance       (per variation)
         EmotionalResonanceEngine.scoreEmotionalContent(script, 30, 5)
         EmotionalResonanceEngine.generateEmotionalDirectives(tone)
         → music genre, color palette, pacing, script modifications
         │
         ▼
Step 4 ─ Quality Scoring           (per variation)
         QualityScoringEngine.scoreContent(hasAudio, lufs, resolution, fps, scriptLen)
         → audioQuality, visualQuality, scriptQuality, overallScore
         │
         ▼
Step 5 ─ Attention Optimization    (per variation)
         AttentionOptimizerEngine.optimizeForAttention(30, platform)
         → hookLength, paceMultiplier, transitionFrequency, estimatedRetention
         │
         ▼
Step 6 ─ Engagement Prediction     (per variation)
         EngagementPredictionEngine.predictEngagement(views, hookQuality, trend, time)
         → expectedViews, expectedLikes, viralScore, peakTime
         │
         ▼
Step 7 ─ Thumbnail Directives      (per variation)
         ThumbnailEngine.generateThumbnailDirectives(options)
         → colorScheme, contrastRatio, emotionalElement, curiosityGap
         │
         ▼
Step 8 ─ Watermark Filter          (per variation)
         WatermarkEngine.buildFfmpegFilter({ text: '@platform' })
         → FFmpeg drawtext filter string
         │
         ▼
Step 9 ─ Caption + Hashtags        (per variation)
         Built-in caption generator with tone openers + platform CTAs
         Built-in hashtag builder (platform tags + topic tags)
         │
         ▼
Step 10 ─ Rank by AI Score
          overallScore = avg(emotionalScore, qualityScore, attentionScore, engagementScore)
          Top 3 variations selected
         │
         ▼
Step 11 ─ Auto-Schedule (optional)
          ScheduleStore.create() for each top variation
          → Schedules posts 1/2/3 days out at 6PM
         │
         ▼
OUTPUT: { job, topVariations[3], allVariations[N] }
```

---

## API Reference

### Run Pipeline (Single Platform)

```
POST /api/pipeline/run
Content-Type: application/json

{
  "topic": "productivity hacks",
  "platform": "tiktok",
  "tone": "excited",
  "bulkCount": 5,
  "autoSchedule": false
}
```

---

### Compare Across Platforms (NEW)

Runs the same topic through all selected platforms **simultaneously** in parallel.
Returns immediately with a run ID — use the poll endpoint to get live results.

```
POST /api/pipeline/compare
Content-Type: application/json

{
  "topic": "crypto investing",
  "tone": "excited",
  "platforms": ["tiktok", "instagram", "youtube", "youtube_shorts", "linkedin"]
}
```

**Response (202 Accepted — background running):**
```json
{
  "status": "running",
  "run": {
    "id": "cmp_xxx",
    "topic": "crypto investing",
    "tone": "excited",
    "platforms": ["tiktok", "instagram", "youtube", "youtube_shorts", "linkedin"],
    "status": "running",
    "entries": [
      { "platform": "tiktok", "status": "pending" },
      { "platform": "instagram", "status": "pending" },
      ...
    ],
    "createdAt": "2026-05-05T..."
  }
}
```

### Poll Comparison Status

Poll every 500–1000ms to get live per-platform results as they complete.

```
GET /api/pipeline/comparisons/:id
```

**Response when in-progress:**
```json
{
  "status": "ok",
  "run": {
    "id": "cmp_xxx",
    "status": "running",
    "winner": null,
    "entries": [
      {
        "platform": "tiktok",
        "status": "done",
        "scores": { "emotionalScore": 78, "qualityScore": 85, "attentionScore": 70, "engagementScore": 65, "overallScore": 74 },
        "bestHook": "3 crypto investing mistakes you're making right now",
        "bestHashtags": ["#fyp", "#crypto", "#investing", ...],
        "emotionalTone": "anticipation",
        "musicGenre": "building tension",
        "pacing": "building",
        "durationMs": 98
      },
      { "platform": "instagram", "status": "running" },
      { "platform": "youtube", "status": "pending" }
    ]
  }
}
```

**Response when complete:**
```json
{
  "run": {
    "status": "completed",
    "winner": "instagram",
    "entries": [ ... all done ... ]
  }
}
```

### List Comparison History

```
GET /api/pipeline/comparisons?limit=20
```

---

**Response:**
```json
{
  "job": { "id": "pipe_xxx", "status": "completed", "durationMs": 120 },
  "topVariations": [
    {
      "id": "var_xxx",
      "rank": 1,
      "hook": "3 productivity hacks mistakes you're making right now",
      "caption": "🚀 ...",
      "hashtags": ["#fyp", "#viral", ...],
      "aiScores": {
        "emotionalScore": 78,
        "qualityScore": 85,
        "attentionScore": 70,
        "engagementScore": 65,
        "overallScore": 74
      }
    }
  ],
  "allVariations": [...]
}
```

### List Jobs

```
GET /api/pipeline/jobs?limit=20
```

### Get Job with Variations

```
GET /api/pipeline/jobs/:jobId
```

### Pipeline Stats

```
GET /api/pipeline/stats
```

---

## Data Structures

### PipelineJob

```typescript
{
  id: string;                // "pipe_<cuid>"
  topic: string;
  platform: string;
  tone: string;
  bulkCount: number;         // 1–30
  autoSchedule: boolean;
  status: "pending" | "running" | "completed" | "failed";
  currentStep: string;       // "generating-hooks" | "running-ai-engines" | ...
  totalVariations: number;
  topVariations: string[];   // IDs of top 3 variations
  scheduleIds: string[];     // IDs of created schedules
  durationMs?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
```

### GeneratedVariation

```typescript
{
  id: string;                // "var_<cuid>"
  jobId: string;
  rank: number;              // 1 = best
  hook: string;              // Hook text with topic interpolated
  caption: string;           // Full caption with CTA
  hashtags: string[];        // 15 platform + topic hashtags
  humanizedOutput: HumanizedOutput;
  emotionalDirectives: EmotionalDirectives;
  thumbnailDirectives: ThumbnailDirectives;
  watermarkFilter: string;   // FFmpeg filter string
  aiScores: {
    emotionalScore: number;  // 0–100
    qualityScore: number;    // 0–100
    attentionScore: number;  // 0–100
    engagementScore: number; // 0–100
    overallScore: number;    // Average of above
  };
  createdAt: string;
}
```

---

## Platform Comparison Mode (NEW)

The comparison mode runs the same topic across multiple platforms **simultaneously** — all pipelines fire in parallel, with results streaming in as each platform finishes.

### How it works

```
POST /api/pipeline/compare
{ topic, tone, platforms: [p1, p2, p3, ...] }
        │
        ▼
Creates ComparisonRun with status: "running"
Returns immediately with runId (202 Accepted)
        │
        ├──▶ Pipeline(topic, p1) ──▶ updateEntry(p1, scores)
        ├──▶ Pipeline(topic, p2) ──▶ updateEntry(p2, scores)
        ├──▶ Pipeline(topic, p3) ──▶ updateEntry(p3, scores)
        └──▶ Pipeline(topic, pN) ──▶ updateEntry(pN, scores)
                                            │
                                            ▼
                              All done? → determine winner
                                        → status: "completed"

Client polls GET /api/pipeline/comparisons/:id every 600ms
→ UI updates cards in real-time as each platform finishes
```

### Winner determination

The platform with the highest `overallScore` among all completed entries is declared the winner. The score is the average of:
- Emotional Score (EmotionalResonanceEngine)
- Quality Score (QualityScoringEngine)
- Attention Score (AttentionOptimizerEngine)
- Engagement Score (EngagementPredictionEngine)

### Score Breakdown Visualization

The UI renders a horizontal bar chart for each dimension showing all platforms ranked side-by-side, making it easy to see which platform excels in specific areas (e.g. TikTok might win on attention, but LinkedIn on quality).

### Data Structure: ComparisonRun

```typescript
{
  id: string;                   // "cmp_<cuid>"
  topic: string;
  tone: string;
  platforms: string[];          // All requested platforms
  status: "running" | "completed" | "partial";
  winner?: string;              // Platform key of the best scorer
  entries: PlatformComparisonEntry[];
  createdAt: string;
  updatedAt: string;
}

interface PlatformComparisonEntry {
  platform: string;
  status: "pending" | "running" | "done" | "failed";
  jobId?: string;               // References the underlying pipeline job
  scores?: {
    emotionalScore: number;
    qualityScore: number;
    attentionScore: number;
    engagementScore: number;
    overallScore: number;
  };
  bestHook?: string;
  bestCaption?: string;
  bestHashtags?: string[];
  emotionalTone?: string;       // e.g. "anticipation", "joy"
  musicGenre?: string;          // e.g. "upbeat pop"
  colorPalette?: string[];      // Hex colors for mood
  pacing?: string;              // "fast" | "moderate" | "slow"
  estimatedViralScore?: number;
  durationMs?: number;
  error?: string;
}
```

### Persisted in

`pipeline-comparisons.json` — all runs are saved, accessible in history.

---

## Bulk Mode

Set `bulkCount` to 2–30 to generate multiple variations in a single pipeline run.
All variations are scored and ranked by `overallScore`.

With `autoSchedule: true`, the top 3 variations are automatically scheduled:
- Variation 1 → tomorrow at 6PM
- Variation 2 → in 2 days at 6PM
- Variation 3 → in 3 days at 6PM

---

## Extending the Pipeline

To add a new engine to the pipeline:
1. Import the engine in `PipelineOrchestrator.ts`
2. Instantiate it in the constructor
3. Call it in the `run()` method's variation loop
4. Include its output in `AIScores` if it produces a numeric score
5. Persist its output in the `variation` object via `saveVariation()`
