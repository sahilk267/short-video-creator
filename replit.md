# AI Viral Content Empire SaaS Platform v12.0

## Overview
A full-stack AI-powered viral content creation and publishing platform. Evolved from a short video maker into a complete SaaS empire with **60 complete engines**. Creates, optimizes, schedules, and publishes short-form video content across 7 platforms (YouTube, Instagram, TikTok, Facebook, Telegram, LinkedIn, X/Twitter). Includes trend intelligence, hook libraries, image generation + filters, content recycling, cost tracking, shadowban detection, translation, series builder, watermark engine, comment CTA, persistent schedule management, video library database, and multi-tenant support.

## Architecture
- **Backend**: Express.js server (port 5000) + MCP protocol support
- **Frontend**: React + Vite + Material UI (dark theme) built to `dist/ui`, served statically
- **Language**: TypeScript (both frontend and backend)
- **Build**: `pnpm run build` → `tsc --project tsconfig.build.json && vite build`
- **Package Manager**: pnpm
- **Version**: v12.0

## Dark Theme
- Primary: `#6366f1` (Indigo)
- Secondary: `#f59e0b` (Amber)
- Accent: `#22c55e` (Green)
- Background: `#0f172a` (Dark Navy)

## Key Technologies
- **TTS**: Kokoro.js (ONNX model)
- **STT/Captions**: Whisper.cpp via `@remotion/install-whisper-cpp`
- **Video Composition**: Remotion
- **Background Videos**: Pexels API + Pixabay API
- **Audio**: FFmpeg via `@ffmpeg-installer/ffmpeg`
- **Queue**: BullMQ (optional, requires Redis)
- **Styling**: Material UI (dark theme, indigo/amber palette)
- **Image Gen**: Canvas (with SVG fallback when canvas not available)
- **Database Layer**: File-based JSON stores (VideoLibraryStore, ScheduleStore)

## Project Structure
```
src/
  index.ts                    # Backend entry point
  config.ts                   # Configuration (reads env vars)
  server/
    server.ts                 # Express setup — 33 routers registered
    routers/
      api.ts, ai.ts, health.ts, publish.ts, queue.ts
      tenants.ts, marketing.ts, content.ts
      trends.ts, hooks.ts, translate.ts, image.ts (with 7 filter endpoints)
      recycle.ts, costs.ts, shadowban.ts, strategy.ts
      webhooks.ts, branding.ts, watermark.ts
      humanized.ts, thumbnail.ts, editing.ts, visual.ts
      audio.ts, emotional.ts, attention.ts, quality.ts
      engagement.ts, account.ts
      videolibrary.ts (NEW) — full CRUD video library
      schedule.ts (NEW) — persistent schedule management
  db/
    VideoLibraryStore.ts (NEW) — Video library CRUD with search, stats, tags
    ScheduleStore.ts (NEW) — Schedule persistence with getDueSchedules, background runner
  publishers/
    YouTubePublisher.ts, TelegramPublisher.ts
    InstagramPublisher.ts, FacebookPublisher.ts (full Graph API)
    LinkedInPublisher.ts, XTwitterPublisher.ts
    PublisherFactory.ts, PlatformLimits.ts, PlatformPublisher.ts (enhanced interfaces)
  services/                   # 60 AI Engine implementations
    TrendEngine.ts, ViralRadarEngine.ts
    HookLibraryEngine.ts, TranslationEngine.ts
    CommentCtaEngine.ts, PlatformPsychologyEngine.ts
    ContentBucketEngine.ts, SeriesBuilderEngine.ts
    AntiDuplicationEngine.ts, ContentFreshnessEngine.ts
    ContentRecycleEngine.ts, HumanMimicryEngine.ts
    ShadowbanDetectionEngine.ts, BestTimeLearningEngine.ts
    HashtagLearningEngine.ts, SkipAnalysisEngine.ts
    CostTrackingEngine.ts, ImageGenerationEngine.ts
    ImageFiltersEngine.ts (NEW) — 20 filter presets, CSS/SVG generation
    WatermarkEngine.ts, (+ 40 more engines)
  ui/
    App.tsx                   # React SPA — 38 routes total
    components/
      Layout.tsx              # Nav drawer with 7 sections, 40+ items
      scheduler/
        ScheduleForm.tsx      # Full form: 7 platforms, 30 langs, 7 engine toggles, quality
        CronBuilder.tsx
    pages/                    # 38 page components
      VideoList, VideoCreator, VideoDetails, BulkQueue
      CategoryMapping, SchedulerDashboard, AnalyticsDashboard
      ABTestingDashboard, HealthDashboard, AIDashboard
      PublishDashboard, TenantConsole, BrandingDashboard
      WebhookDashboard, TrendDashboard, HookLibrary
      ImageGenerator, RecycleDashboard, CostTracker
      StrategyDashboard, ContentTools
      HumanizedContentPage, ThumbnailPage, EditingPage
      VisualEnhancementPage, AudioQualityPage, EmotionalResonancePage
      AttentionOptimizerPage, QualityScoringPage, EngagementPredictionPage
      AccountManagerPage
      TranslatePage, CommentCtaPage, SeriesBuilderPage
      WatermarkPage, ShadowbanPage
      VideoLibraryPage (NEW) — /video-library
      SchedulePersistPage (NEW) — /schedule-manager
      ImageFilterPage (NEW) — /image-filters
```

## All 60 Engines - Complete Map

### Phase 1: Core Video Pipeline (8 engines)
1. Video Creator Engine — /api (POST /shorts)
2. Script Planning Engine — /api/content
3. TTS Engine — /api (Kokoro.js)
4. Scene Renderer Engine — /api/shorts/render
5. Video Compositor Engine — Remotion
6. Bulk Queue Engine — /api/queue
7. Category Mapping Engine — /api/mappings
8. Video Library Engine — /api/shorts (GET)

### Phase 2: Analytics & Intelligence (8 engines)
9. AI Monitor Engine — /api/ai
10. Analytics Engine — /api/analytics
11. A/B Testing Engine — /api/ab-testing
12. Scheduler Engine — /api/scheduler
13. Health Dashboard Engine — /api/health
14. Hook Library Engine — /api/hooks
15. Trend Engine — /api/trends
16. Viral Radar Engine — /api/trends/viral

### Phase 3: Multi-Platform Publishing (8 engines)
17. YouTube Publisher — /api/publish/youtube
18. Telegram Publisher — /api/publish/telegram
19. Instagram Publisher — /api/publish/instagram (full Graph API)
20. Facebook Publisher — /api/publish/facebook (full Graph API)
21. LinkedIn Publisher — /api/publish/linkedin
22. X/Twitter Publisher — /api/publish/twitter
23. Publisher Factory — /api/publish
24. Platform Limits Engine — (inline)

### Phase 4: Content Systems (10 engines)
25. Translation Engine — /api/translate → /translate (UI)
26. Comment CTA Engine — /api/strategy/cta → /comment-cta (UI)
27. Platform Psychology Engine — /api/strategy/platform
28. Content Bucket Engine — /api/strategy/buckets
29. Series Builder Engine — /api/strategy/series → /series (UI)
30. Anti-Duplication Engine — /api/recycle
31. Content Freshness Engine — /api/recycle
32. Content Recycle Engine — /api/recycle
33. Image Generation Engine — /api/image
34. Watermark Engine — /api/watermark → /watermark (UI)

### Phase 5: Virality & Growth (10 engines)
35. Human Mimicry Engine — /api/strategy/human-mimicry
36. Shadowban Detection Engine — /api/shadowban
37. Best Time Learning Engine — /api/strategy/best-time
38. Hashtag Learning Engine — /api/strategy/hashtags
39. Skip Analysis Engine — /api/strategy/skip
40. Cost Tracking Engine — /api/costs
41. Pixabay Integration — (inline video sourcing)
42. Pexels Integration — (inline + /api/image)
43. Trend Dashboard UI — /trends
44. Strategy Dashboard UI — /strategy

### Phase 6: Enterprise Systems (6 engines)
45. Tenant Console Engine — /api/tenants
46. Marketing Engine — /api/marketing
47. Content Tools UI Engine — /content-tools
48. Publish Dashboard Engine — /publish
49. Branding Engine — /api/branding
50. Webhook Notifications Engine — /api/webhooks

### Phase 7-8: Advanced AI Engines (10 engines — dedicated UI pages)
51. Humanized Content Engine — /api/humanized → /humanized
52. Thumbnail Generator Engine — /api/thumbnail → /thumbnail
53. Expert Editing Engine — /api/editing → /editing
54. Visual Enhancement Engine — /api/visual → /visual
55. Audio Quality Engine — /api/audio → /audio
56. Emotional Resonance Engine — /api/emotional → /emotional
57. Attention Optimizer Engine — /api/attention → /attention
58. Quality Scoring Engine — /api/quality → /quality
59. Engagement Prediction Engine — /api/engagement → /engagement
60. Account Manager Engine — /api/account → /account

## New Engines Added This Session (v12.0 Final)

### ImageFiltersEngine (src/services/ImageFiltersEngine.ts)
- **20 filter presets**: none, grayscale, sepia, vintage, cinema, noir, warm, cool, vivid, fade, matte, cyberpunk, golden_hour, arctic, sunset, moody, high_contrast, soft_glow, dramatic, pastel
- Methods: `getPresets()`, `getPresetsForPlatform()`, `buildCssFilter()`, `buildSvgFilter()`, `generateFilterPreview()`, `applyFilterToSvg()`, `applyFilterToCanvas()`, `batchApplyFilter()`
- Outputs: CSS filter strings, SVG filter XML, preview SVG files

### VideoLibraryStore (src/db/VideoLibraryStore.ts)
- Full CRUD: `create()`, `get()`, `list()`, `update()`, `delete()`
- Search: `search(query)` — searches title, description, tags
- Stats: `getStats()` — byStatus, byCategory, byPlatform
- Tags: `getTrendingTags()` — sorted by usage count
- Status updates: `updateStatus()`, `updateMetrics()`
- Filter by: status, platform, category, tag

### ScheduleStore (src/db/ScheduleStore.ts)
- Full CRUD: `create()`, `get()`, `list()`, `update()`, `delete()`
- `getDueSchedules()` — returns schedules where nextRun <= now
- `incrementRunCount()` — increments runCount, sets lastRun, clears nextRun
- `getStats()` — total, active, paused, completed, failed, totalRuns, totalFailures
- Background runner via setInterval(60s) in ScheduleRouter

## API Routes (33 total — new endpoints)
```
GET/POST /api/shorts           — Video CRUD
POST     /api/shorts/render    — Render video
GET      /api/health           — System health
POST     /mcp                  — MCP protocol
/api/ai, /api/trends, /api/hooks, /api/translate
/api/image                     — Image generation + 7 filter endpoints
  GET  /api/image/filters                — All filter presets
  GET  /api/image/filters/:id            — Single filter detail
  POST /api/image/filters/css            — Build CSS filter string
  POST /api/image/filters/preview        — Generate SVG preview card
  GET  /api/image/filters/preview/file/:name — Serve preview file
  POST /api/image/filters/apply          — Apply filter to image
  POST /api/image/filters/batch          — Batch apply filter
/api/recycle, /api/costs, /api/shadowban
/api/strategy, /api/webhooks, /api/branding, /api/watermark
/api/humanized, /api/thumbnail, /api/editing, /api/visual
/api/audio, /api/emotional, /api/attention, /api/quality
/api/engagement, /api/account
/api/publish, /api/tenants, /api/marketing, /api/content
/api/videolibrary (NEW)        — Video library CRUD
  GET    /api/videolibrary               — List videos (filter by status/platform/category)
  POST   /api/videolibrary               — Create video record
  GET    /api/videolibrary/stats         — Stats by status/category/platform
  GET    /api/videolibrary/tags          — Trending tags with counts
  GET    /api/videolibrary/search?q=     — Full-text search
  GET    /api/videolibrary/:id           — Get single video
  PATCH  /api/videolibrary/:id           — Update video
  DELETE /api/videolibrary/:id           — Delete video
  PATCH  /api/videolibrary/:id/status    — Update status only
  PATCH  /api/videolibrary/:id/metrics   — Update engagement metrics
/api/schedule (NEW)            — Persistent schedule management
  GET    /api/schedule                   — List schedules
  POST   /api/schedule                   — Create schedule
  GET    /api/schedule/stats             — Schedule stats
  GET    /api/schedule/:id               — Get single schedule
  PATCH  /api/schedule/:id               — Update schedule
  DELETE /api/schedule/:id               — Delete schedule
  PATCH  /api/schedule/:id/status        — Pause/resume/complete
  POST   /api/schedule/:id/run           — Trigger manual run
```

## Navigation Sections (7 sections, 40+ items)
1. **Content Creation**: Create Video, Video Library, Trend Dashboard, Hook Library, Image Generator, Image Filters (NEW), Video Library DB (NEW)
2. **Publishing & Growth**: Publish, Scheduler (Queue), Schedule Manager (NEW), Bulk Queue, Strategy Center, Content Recycle
3. **Analytics & AI**: Analytics, A/B Tests, AI Monitor, Cost Tracker
4. **AI Engines (Phase 7-8)**: Humanized, Thumbnail, Editing, Visual, Audio, Emotional, Attention, Quality, Engagement, Account
5. **Content Tools**: Translation Engine, Comment CTA, Series Builder, Watermark Engine, Shadowban Detection
6. **System**: Notifications, White-Label Branding, Content Tools Dashboard, Category Mapping, Health, Tenants

## Scheduler & Schedule Manager
- **SchedulerDashboard** (`/scheduler`): Bull queue-based scheduler with queue stats, history
- **SchedulePersistPage** (`/schedule-manager`): Persistent JSON-backed schedules with:
  - Cron presets (hourly, 6h, daily 9AM/6PM, weekdays, weekly, twice daily)
  - Multi-platform selector, language picker
  - 7 engine toggles (Translation, CTA, Platform Psych, Series, Humanize, Hashtags, Engagement)
  - Quality settings: LUFS slider, sharpness slider, quality tier
  - Background runner checks every 60s for due schedules
  - Manual trigger (run now) button

## PlatformPublisher Interface (Updated)
```typescript
interface PublishParams {
  videoPath: string;
  title: string;
  description: string;
  tags: string[];
  videoUrl?: string;          // Direct URL for platforms that embed
  callToAction?: string;      // CTA text
  thumbnailPath?: string;
  scheduledFor?: Date;
  visibility?: 'public' | 'private' | 'unlisted';
  metadata?: Record<string, unknown>;
}
interface PublishResult {
  success: boolean;
  platformVideoId?: string;   // Primary ID field (was externalId)
  externalId?: string;        // Legacy alias
  publishedUrl?: string;
  scheduledFor?: Date;
  error?: string;
}
```

## Environment Variables
- `OPENAI_API_KEY` — Optional, for AI features
- `PEXELS_API_KEY` — For background video sourcing (available)
- `PIXABAY_API_KEY` — Alternative video source
- `LIBRETRANSLATE_URL` — Translation service endpoint
- `REDIS_URL` — Optional, for BullMQ queue
- `DATA_DIR` — Data storage path

## Build Commands
```bash
pnpm run build    # TypeScript + Vite build (0 errors)
pnpm run dev      # Development mode
node dist/index.js  # Run production server (port 5000)
```

## Version History
- v1.0: Basic short video maker
- v5.0: Multi-platform publisher (6 platforms)
- v8.0: Phase 4-5 engines (Translation, Strategy, Recycle)
- v10.0: Phase 6 enterprise (Tenants, Branding, Webhooks)
- v11.0: Phase 7-8 advanced engines (10 dedicated UI pages)
- v12.0 (this session):
  - 4 new pages: Translate, Comment CTA, Series Builder, Watermark + Scheduler overhaul
  - 3 new backend stores: VideoLibraryStore, ScheduleStore (with background runner)
  - 2 new routers: /api/videolibrary (10 endpoints), /api/schedule (8 endpoints)
  - 1 new engine: ImageFiltersEngine (20 presets, CSS/SVG, batch apply)
  - 3 new frontend pages: VideoLibraryPage, SchedulePersistPage, ImageFilterPage
  - 7 new image filter endpoints on /api/image/filters
  - Full Instagram + Facebook Graph API publishers
  - PlatformPublisher enhanced interfaces (PublishParams, PublishResult, PlatformCapabilities)
  - Build: 0 TypeScript errors, 12,056 modules transformed, 48s
