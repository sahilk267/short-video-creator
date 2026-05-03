# AI Viral Content Empire SaaS Platform v11.0

## Overview
A full-stack AI-powered viral content creation and publishing platform. Evolved from a short video maker into a complete SaaS empire with 48+ engines. Creates, optimizes, schedules, and publishes short-form video content across 6 platforms (YouTube, Instagram, Facebook, Telegram, LinkedIn, X/Twitter). Includes trend intelligence, hook libraries, image generation, content recycling, cost tracking, shadowban detection, and multi-tenant support.

## Architecture
- **Backend**: Express.js server (port 5000) + MCP protocol support
- **Frontend**: React + Vite + Material UI (dark theme) built to `dist/ui`, served statically
- **Language**: TypeScript (both frontend and backend)
- **Build**: `pnpm run build` → `tsc --project tsconfig.build.json && vite build`
- **Package Manager**: pnpm

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
    server.ts                 # Express setup — all 16 routers registered
    routers/
      api.ts, ai.ts, analytics.ts, ab-testing.ts
      scheduler.ts, health.ts, publish.ts, queue.ts
      tenants.ts, marketing.ts, content.ts
      trends.ts, hooks.ts, translate.ts, image.ts
      recycle.ts, costs.ts, shadowban.ts, strategy.ts
  publishers/
    YouTubePublisher.ts, TelegramPublisher.ts
    InstagramPublisher.ts, FacebookPublisher.ts
    LinkedInPublisher.ts, XTwitterPublisher.ts
    PublisherFactory.ts, PlatformLimits.ts, PlatformPublisher.ts
  services/
    TrendEngine.ts, ViralRadarEngine.ts
    HookLibraryEngine.ts, TranslationEngine.ts
    CommentCtaEngine.ts, PlatformPsychologyEngine.ts
    ContentBucketEngine.ts, SeriesBuilderEngine.ts
    AntiDuplicationEngine.ts, ContentFreshnessEngine.ts
    ContentRecycleEngine.ts, HumanMimicryEngine.ts
    ShadowbanDetectionEngine.ts, BestTimeLearningEngine.ts
    HashtagLearningEngine.ts, SkipAnalysisEngine.ts
    CostTrackingEngine.ts, ImageGenerationEngine.ts
    WatermarkEngine.ts, PixabayService.ts
  ui/
    App.tsx                   # 20 routes (lazy-loaded)
    components/Layout.tsx     # Dark theme + drawer nav + top quick-nav
    pages/
      VideoList, VideoCreator, VideoDetails, BulkQueue
      CategoryMapping, PublishDashboard, AnalyticsDashboard
      SchedulerDashboard, ABTestingDashboard, AIDashboard
      TenantConsole, ContentTools, HealthDashboard
      TrendDashboard, HookLibrary, ImageGenerator
      RecycleDashboard, CostTracker, StrategyDashboard
  types/shorts.ts             # PlatformType includes linkedin + x
dist/                         # Built output
data/                         # Runtime data (videos, generated-images, json stores)
static/music/                 # Background music MP3s
STATUS.md                     # Full engine status tracker (48/50 done)
```

## Environment Variables
- `PEXELS_API_KEY` — required, free key from pexels.com/api/key
- `PIXABAY_API_KEY` — optional, for Pixabay stock video search
- `PORT=5000` — server port
- `LOG_LEVEL=info` — pino log level
- `DEV=true` — development mode
- `REDIS_ENABLED=false` — disable Redis/BullMQ by default
- `SKIP_RUNTIME_INSTALL=true` — skip Kokoro/Whisper install on startup

## Important Notes
- **canvas package**: ImageGenerationEngine gracefully falls back to SVG if canvas is not available (system libs issue on Replit)
- **API URLs**: Frontend uses relative URLs (empty baseURL) through Replit's proxy
- **PlatformType**: Includes `"youtube" | "telegram" | "instagram" | "facebook" | "linkedin" | "x"`
- **Installation flag**: Checks `~/.ai-agents-az-video-generator/installation-successful` to skip test render

## Workflow
- **Command**: `node dist/index.js`
- **Port**: 5000
- **Build**: `pnpm run build`

## Engine Status
See STATUS.md for the full 48/50 engine tracker across all 6 phases.
- 48 engines: DONE
- 2 pending: White-label branding, Webhook notifications
