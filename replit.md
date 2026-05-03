# AI Viral Content Empire SaaS Platform v12.0

## Overview
A full-stack AI-powered viral content creation and publishing platform. Evolved from a short video maker into a complete SaaS empire with **60 complete engines**. Creates, optimizes, schedules, and publishes short-form video content across 7 platforms (YouTube, Instagram, TikTok, Facebook, Telegram, LinkedIn, X/Twitter). Includes trend intelligence, hook libraries, image generation, content recycling, cost tracking, shadowban detection, translation, series builder, watermark engine, comment CTA, and multi-tenant support.

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

## Project Structure
```
src/
  index.ts                    # Backend entry point
  config.ts                   # Configuration (reads env vars)
  server/
    server.ts                 # Express setup — 31 routers registered
    routers/
      api.ts, ai.ts, health.ts, publish.ts, queue.ts
      tenants.ts, marketing.ts, content.ts
      trends.ts, hooks.ts, translate.ts, image.ts
      recycle.ts, costs.ts, shadowban.ts, strategy.ts
      webhooks.ts, branding.ts, watermark.ts (NEW)
      humanized.ts, thumbnail.ts, editing.ts, visual.ts
      audio.ts, emotional.ts, attention.ts, quality.ts
      engagement.ts, account.ts
  publishers/
    YouTubePublisher.ts, TelegramPublisher.ts
    InstagramPublisher.ts, FacebookPublisher.ts
    LinkedInPublisher.ts, XTwitterPublisher.ts
    PublisherFactory.ts, PlatformLimits.ts, PlatformPublisher.ts
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
    WatermarkEngine.ts, (+ 40 more engines)
  ui/
    App.tsx                   # React SPA — 35 routes total
    components/
      Layout.tsx              # Nav drawer with 7 sections, 35+ items
      scheduler/
        ScheduleForm.tsx      # Full form: 7 platforms, 30 langs, 7 engine toggles, quality
        CronBuilder.tsx
    pages/                    # 35 page components
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
      TranslatePage (NEW), CommentCtaPage (NEW)
      SeriesBuilderPage (NEW), WatermarkPage (NEW)
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
19. Instagram Publisher — /api/publish/instagram
20. Facebook Publisher — /api/publish/facebook
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

## API Routes (31 total)
```
GET/POST /api/shorts           — Video CRUD
POST     /api/shorts/render    — Render video
GET/POST /api/queue            — BullMQ job queue
GET      /api/health           — System health
POST     /mcp                  — MCP protocol
/api/ai, /api/trends, /api/hooks, /api/translate
/api/image, /api/recycle, /api/costs, /api/shadowban
/api/strategy, /api/webhooks, /api/branding, /api/watermark (NEW)
/api/humanized, /api/thumbnail, /api/editing, /api/visual
/api/audio, /api/emotional, /api/attention, /api/quality
/api/engagement, /api/account
/api/publish, /api/tenants, /api/marketing, /api/content
```

## Navigation Sections (7 sections, 35+ items)
1. **Content Creation**: Create Video, Video Library, Trend Dashboard, Hook Library, Image Generator
2. **Publishing & Growth**: Publish, Scheduler, Bulk Queue, Strategy Center, Content Recycle
3. **Analytics & AI**: Analytics, A/B Tests, AI Monitor, Cost Tracker
4. **AI Engines (Phase 7-8)**: Humanized, Thumbnail, Editing, Visual, Audio, Emotional, Attention, Quality, Engagement, Account
5. **Content Tools (NEW)**: Translation Engine, Comment CTA, Series Builder, Watermark Engine
6. **System**: Notifications, White-Label Branding, Content Tools Dashboard, Category Mapping, Health, Tenants

## Scheduler Enhancements (v12.0)
- **7-Platform Multi-Select**: YouTube, Instagram, TikTok, LinkedIn, X/Twitter, Facebook, Telegram
- **30 Languages**: English, Hindi, Urdu, Arabic, Spanish, French, German, Portuguese, Japanese, Chinese, Korean, Bengali, Italian, Dutch, Swedish, Norwegian, Danish, Polish, Russian, Turkish, Vietnamese, Thai, Indonesian, Filipino, Greek, Hebrew, Romanian, Hungarian, Czech, Slovak
- **7 Engine Toggles**: Translation, Comment CTA, Platform Psychology, Series Builder, Human Mimicry, Hashtag Optimizer, Engagement Optimizer
- **Quality Settings**: LUFS slider (-24 to -6), Sharpness slider (0-5), Visual quality tier (Draft/Standard/Premium)
- **Cron Builder**: Visual cron schedule builder

## Environment Variables
- `OPENAI_API_KEY` — Optional, for AI features
- `PEXELS_API_KEY` — For background video sourcing
- `PIXABAY_API_KEY` — Alternative video source
- `LIBRETRANSLATE_URL` — Translation service endpoint
- `REDIS_URL` — Optional, for BullMQ queue
- `DATA_DIR` — Data storage path

## Build Commands
```bash
pnpm run build    # TypeScript + Vite build
pnpm run dev      # Development mode
node dist/index.js  # Run production server
```

## Version History
- v1.0: Basic short video maker
- v5.0: Multi-platform publisher (6 platforms)
- v8.0: Phase 4-5 engines (Translation, Strategy, Recycle)
- v10.0: Phase 6 enterprise (Tenants, Branding, Webhooks)
- v11.0: Phase 7-8 advanced engines (10 dedicated UI pages)
- v12.0: 4 new UI pages (Translate, Comment CTA, Series Builder, Watermark) + Scheduler overhaul (7 platforms, 30 langs, 7 engine toggles, quality settings)
