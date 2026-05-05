# System Map — AI Viral Content Empire v12.0

Generated: 2026-05-05

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Frontend (Vite)                       │
│  VideoCreator · AutoMode · Scheduler · Analytics · BulkQueue    │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTP (port 5000)
┌───────────────────────▼─────────────────────────────────────────┐
│                   Express API Server                             │
│              33+ routers · Rate limiting · Swagger               │
└───────────────────────┬─────────────────────────────────────────┘
                        │
      ┌─────────────────┼──────────────────┐
      ▼                 ▼                  ▼
┌──────────┐    ┌──────────────┐   ┌──────────────────┐
│ AI Engine│    │ Content Tools│   │  Pipeline Engine  │
│  Layer   │    │    Layer     │   │  (Orchestrator)   │
└──────────┘    └──────────────┘   └──────────────────┘
      │                 │                  │
      └─────────────────┴──────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                    Data Layer (JSON stores)                       │
│  pipeline-jobs · schedules · renderJobs · hookLibrary · reports  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Engines (Phase 7–8)

| Engine | Service File | API Route | Purpose |
|--------|-------------|-----------|---------|
| Humanized Content | `HumanizedContentEngine.ts` | `POST /api/humanized/humanize` | Makes content feel natural with pauses, gestures, eye movement |
| Thumbnail Generator | `ThumbnailEngine.ts` | `POST /api/thumbnail/generate` | Creates scroll-stopping thumbnail directives with curiosity gaps |
| Emotional Resonance | `EmotionalResonanceEngine.ts` | `POST /api/emotional/score` | Scores and aligns emotional tone across audio/visual/script |
| Engagement Prediction | `EngagementPredictionEngine.ts` | `POST /api/engagement/predict` | Predicts views, likes, shares, viral score |
| Quality Scoring | `QualityScoringEngine.ts` | `POST /api/quality/score` | Scores audio, visual, script, technical quality |
| Attention Optimizer | `AttentionOptimizerEngine.ts` | `POST /api/attention/optimize` | Optimizes hook length and pacing for platform-specific audiences |
| Expert Editing | `ExpertEditingEngine.ts` | `POST /api/editing/enhance` | Frame-level editing directives |
| Visual Enhancement | `VisualEnhancementEngine.ts` | `POST /api/visual/enhance` | Color grading, LUT, visual effects |
| Audio Quality | `AudioQualityEngine.ts` | `POST /api/audio/analyze` | LUFS, frequency, audio mastering |
| Account Manager | `AccountManagerEngine.ts` | `GET /api/account/insights` | Multi-account performance tracking |

---

## Content Tools

| Tool | Service File | API Route | Purpose |
|------|-------------|-----------|---------|
| Translation Engine | `TranslationEngine.ts` | `POST /api/translate/` | Multilingual content via LibreTranslate |
| Comment CTA | `CommentCtaEngine.ts` | `POST /api/content/comment-cta` | Comment call-to-action strategies |
| Series Builder | `SeriesBuilderEngine.ts` | `POST /api/series/build` | Multi-part content series planning |
| Watermark Engine | `WatermarkEngine.ts` | `POST /api/watermark/filter` | FFmpeg watermark filter builder |
| Hook Library | `HookLibraryEngine.ts` | `GET /api/hooks/best` · `POST /api/hooks/generate` | 20+ viral hook templates with performance scores |
| Image Generator | `ImageGenerationEngine.ts` | `POST /api/image/generate` | Quote cards, thumbnails, announcements |
| Image Filters | `ImageFiltersEngine.ts` | `POST /api/image/filters/apply` | Cinematic, vintage, moody filters |
| Content Enhancement | `ContentEnhancementService.ts` | `POST /api/content/ideation` | Ideation, personalization, trend optimization |

---

## Core Infrastructure Modules

| Module | Location | Purpose |
|--------|----------|---------|
| Scheduler (Queue) | `SchedulerService.ts` | Enqueues Remotion render jobs |
| Schedule Manager | `ScheduleStore.ts` + `ScheduleRouter.ts` | Cron-like persistent scheduling with auto-runner |
| Trend Engine | `TrendEngine.ts` + `ViralRadarEngine.ts` | Real-time trend detection |
| Bulk Queue | `QueueRouter.ts` | Batch render job submission |
| AI Learning | `AiLearningStore.ts` + `AiTrainingService.ts` | Feedback loops for model improvement |
| Analytics | `AnalyticsStore.ts` + `AnalyticsDashboard.tsx` | Performance tracking dashboard |
| Tenant System | `TenantStore.ts` + `TenantQuotaService.ts` | Multi-tenant / white-label support |
| Branding | `BrandingEngine.ts` | White-label brand config |
| Webhooks | `WebhookNotificationEngine.ts` | External notification triggers |
| Content Recycle | `ContentRecycleEngine.ts` | Repurpose existing content |
| Strategy Center | `ViralStrategyService.ts` | Platform-specific growth strategies |
| Shadowban Detection | `ShadowbanDetectionEngine.ts` | Risk assessment for accounts |
| Cost Tracker | `CostTrackingEngine.ts` | API/render cost tracking |
| A/B Testing | `ABVariantStore.ts` | Split testing for content variants |
| Script Generator | `AiLlmGenerator.ts` | AI-powered script generation |
| Video Creator | `ShortCreator.ts` + Remotion | Core video rendering engine |
| TTS (Kokoro) | `@huggingface/transformers` | Local text-to-speech (82M ONNX model) |
| STT (Whisper.cpp) | Binary at `~/.ai-agents-az-video-generator/libs/whisper/` | Speech-to-text transcription |

---

## Pipeline System (NEW — Phase 9)

| Component | Location | Purpose |
|-----------|----------|---------|
| Pipeline Orchestrator | `src/services/PipelineOrchestrator.ts` | Central controller connecting all engines |
| Pipeline Store | `src/db/PipelineStore.ts` | Stores pipeline_jobs, generated_variations, ai_scores |
| Pipeline Router | `src/server/routers/pipeline.ts` | REST API: POST /api/pipeline/run |
| Auto Mode UI | `src/ui/pages/AutoModePage.tsx` | One-click full content generation |

### Pipeline Flow
```
Topic + Platform + Tone
        │
        ▼
1. Generate Hooks (HookLibraryEngine)
        │
        ▼
2. Humanize Content (HumanizedContentEngine)
        │
        ▼
3. Apply Emotional Resonance (EmotionalResonanceEngine)
        │
        ▼
4. Score Quality (QualityScoringEngine)
        │
        ▼
5. Optimize Attention (AttentionOptimizerEngine)
        │
        ▼
6. Predict Engagement (EngagementPredictionEngine)
        │
        ▼
7. Generate Thumbnail Directives (ThumbnailEngine)
        │
        ▼
8. Apply Watermark (WatermarkEngine)
        │
        ▼
9. Generate Caption + Hashtags
        │
        ▼
10. Rank & Select Top 3 Variations
        │
        ▼
11. Send to Scheduler / Bulk Queue (optional, bulk mode)
        │
        ▼
Ready-to-post content package
```

---

## Data Stores (JSON-based)

| Store | File | Contents |
|-------|------|---------|
| PipelineStore | `pipeline-jobs.json` + `pipeline-variations.json` | Pipeline job tracking + AI-scored variations |
| RenderJobStore | `renderJobs.json` | Video render queue |
| ScriptPlanStore | `scriptPlans.json` | Generated script plans |
| ScheduleStore | `schedules.json` | Persistent cron schedules |
| HookLibraryEngine | `hook-library.json` | Custom + built-in hooks |
| AiLearningStore | `ai-learning.json` | ML training events |
| AnalyticsStore | `analytics.json` | Performance metrics |
| TenantStore | `tenants.json` | Multi-tenant configs |
| VideoLibraryStore | `video-library.json` | Video metadata catalogue |
| ReportStore | `reports.json` | News/trend reports |

---

## API Endpoints Summary (35+ routes)

```
Core Video:
  POST   /api/short-video              – Create render job
  GET    /api/short-video/:id/status   – Check render status
  GET    /api/voices                   – List TTS voices (28)
  GET    /api/music-tags               – List music categories (12)

Pipeline (NEW):
  POST   /api/pipeline/run             – Run full AI pipeline
  GET    /api/pipeline/jobs            – List pipeline jobs
  GET    /api/pipeline/jobs/:id        – Get job + variations
  GET    /api/pipeline/stats           – Aggregate statistics

AI Engines:
  POST   /api/humanized/humanize
  POST   /api/emotional/score
  POST   /api/quality/score
  POST   /api/attention/optimize
  POST   /api/engagement/predict
  POST   /api/thumbnail/generate

Content Tools:
  POST   /api/translate/
  POST   /api/watermark/filter
  POST   /api/hooks/generate
  POST   /api/image/quote-card
  POST   /api/content/ideation

Scheduler:
  POST   /api/schedule                 – Create schedule
  GET    /api/schedule                 – List schedules
  POST   /api/schedule/:id/run         – Trigger now
  POST   /api/queue/bulk               – Bulk enqueue

System:
  GET    /api/health
  GET    /api/docs                     – Swagger UI
```
