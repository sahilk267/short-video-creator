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

### Run Pipeline

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
