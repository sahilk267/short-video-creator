# AI Viral Content Empire SaaS Platform v12.0

## Overview
A full-stack, production-ready AI-powered viral content creation and publishing platform. Evolved from a short video maker into a complete SaaS empire with **60 complete engines**. Creates, optimizes, schedules, and publishes short-form video content across 7 platforms (YouTube, Instagram, TikTok, Facebook, Telegram, LinkedIn, X/Twitter). Includes trend intelligence, hook libraries, image generation + filters, content recycling, cost tracking, shadowban detection, translation, series builder, watermark engine, comment CTA, persistent schedule management, video library database, and multi-tenant support.

## Architecture
- **Backend**: Express.js server (port 5000 via $PORT env) + MCP protocol support
- **Frontend**: React + Vite + Material UI (dark theme) built to `dist/ui`, served statically
- **Language**: TypeScript (both frontend and backend)
- **Build**: `pnpm run build` → `tsc --project tsconfig.build.json && vite build`
- **Package Manager**: pnpm
- **Version**: v12.0 — Production-Ready

## Production Readiness (added this session)
- **`.env.example`** — Comprehensive 100-line reference with all env vars documented
- **`setup.sh`** — One-command full setup (checks, install, migrate, seed, build)
- **`docker-compose.yml`** — Enhanced with healthchecks, resource limits, named network
- **`database/migrations/001_init.js`** — Idempotent file store initialization (19 stores)
- **`database/seeders/001_seed_defaults.js`** — Default categories, hooks, branding, news, tenant
- **`database/migrate.sh`** + **`database/seed.sh`** — Shell runners for migrations and seeders
- **`src/server/swagger.ts`** — Full OpenAPI 3.0 spec (35 paths, 13 tag groups)
- **`/api/docs`** — Swagger UI (swagger-ui-express)
- **`/api/docs.json`** — Raw OpenAPI JSON spec
- **`src/config/validate.ts`** — Startup env validation with warnings for security issues
- **`scripts/deploy.sh`** — Production deploy with PM2/systemd support
- **`scripts/backup.sh`** — Data backup with retention and old backup cleanup
- **`scripts/healthcheck.sh`** — Multi-endpoint health checker (exit code 0/1)
- **`.github/workflows/ci.yml`** — Enhanced CI: lint, typecheck, tests, build, migration smoke test, docker build
- **`.github/workflows/deploy.yml`** — Full deploy: build → Docker push → VPS SSH deploy → health check → Slack notify
- **`docs/ARCHITECTURE.md`** — Full system diagram, data flows, component breakdown
- **`docs/API.md`** — Complete REST API reference
- **`docs/DATABASE_SCHEMA.md`** — All 19 JSON store schemas with field types
- **`docs/DEPLOYMENT.md`** — VPS, Docker, PM2, systemd, nginx, cloud deployment guides
- **`docs/postman_collection.json`** — 40+ request Postman collection (importable)
- **`README.md`** — Comprehensive production README with all sections

## Key Technologies
- **TTS**: Kokoro.js (ONNX model)
- **STT/Captions**: Whisper.cpp via `@remotion/install-whisper-cpp`
- **Video Composition**: Remotion
- **Background Videos**: Pexels API
- **Audio**: FFmpeg via `@ffmpeg-installer/ffmpeg`
- **Queue**: BullMQ (optional, requires Redis)
- **Styling**: Material UI (dark theme, indigo/amber palette)
- **Image Gen**: Canvas (with SVG fallback)
- **API Docs**: swagger-ui-express (served at /api/docs)
- **Database Layer**: File-based JSON stores (19 stores under DATA_DIR_PATH)

## Dark Theme
- Primary: `#6366f1` (Indigo)
- Secondary: `#f59e0b` (Amber)
- Accent: `#22c55e` (Green)
- Background: `#0f172a` (Dark Navy)

## Project Structure
```
ai-viral-content-empire/
├── src/
│   ├── config.ts                 # Env-var config class
│   ├── config/
│   │   └── validate.ts           # Startup env validation (NEW)
│   ├── index.ts                  # Entry point
│   ├── logger.ts
│   ├── db/                       # 19 file-based JSON stores
│   ├── server/
│   │   ├── server.ts             # Express — 33 routers + Swagger
│   │   ├── swagger.ts            # OpenAPI 3.0 spec (NEW)
│   │   ├── rateLimit.ts
│   │   └── routers/              # 33 feature routers
│   ├── short-creator/            # Core video pipeline
│   ├── workers/                  # BullMQ queue workers
│   └── services/                 # 60 AI engines
├── src/ui/                       # React frontend
├── database/
│   ├── migrations/001_init.js    # Idempotent store init (NEW)
│   ├── seeders/001_seed_defaults.js  # Default data (NEW)
│   ├── migrate.sh                # Migration runner (NEW)
│   └── seed.sh                   # Seeder runner (NEW)
├── scripts/
│   ├── deploy.sh                 # Production deploy (NEW)
│   ├── backup.sh                 # Data backup (NEW)
│   └── healthcheck.sh            # Health checker (NEW)
├── docs/
│   ├── ARCHITECTURE.md           # System diagrams (NEW)
│   ├── API.md                    # REST API reference (NEW)
│   ├── DATABASE_SCHEMA.md        # JSON store schemas (NEW)
│   ├── DEPLOYMENT.md             # Deployment guides (NEW)
│   └── postman_collection.json   # Postman collection (NEW)
├── .github/workflows/
│   ├── ci.yml                    # Enhanced CI pipeline (UPDATED)
│   ├── deploy.yml                # Full deploy pipeline (NEW)
│   └── security.yml              # Dependency audit
├── docker-compose.yml            # Enhanced with healthchecks (UPDATED)
├── main.Dockerfile               # Full Docker image
├── main-cuda.Dockerfile          # CUDA GPU image
├── main-tiny.Dockerfile          # Minimal image
├── .env.example                  # 100-line comprehensive reference (UPDATED)
├── setup.sh                      # One-command setup (NEW)
└── README.md                     # Production README (REWRITTEN)
```

## API Endpoints (33 routers)
```
GET  /api/health               — System health
GET  /api/docs                 — Swagger UI (NEW)
GET  /api/docs.json            — OpenAPI JSON spec (NEW)
GET/POST /api/shorts           — Video CRUD
/api/ai, /api/trends, /api/hooks, /api/translate
/api/image, /api/image/filters (7 endpoints)
/api/recycle, /api/costs, /api/shadowban
/api/strategy, /api/webhooks, /api/branding, /api/watermark
/api/humanized, /api/thumbnail, /api/editing, /api/visual
/api/audio, /api/emotional, /api/attention, /api/quality
/api/engagement, /api/account, /api/publish
/api/tenants, /api/marketing, /api/content, /api/queue
/api/videolibrary (10 endpoints)
/api/schedule (8 endpoints)
```

## Environment Variables
See `.env.example` for full reference. Key vars:
- `PEXELS_API_KEY` — Required for background video sourcing
- `PORT` — HTTP port (default 3123, Replit uses 5000)
- `REDIS_ENABLED` — Enable BullMQ job queue
- `DATA_DIR_PATH` — Data storage path (default ~/.ai-content-empire)
- `TENANT_KEYS_SECRET` — Multi-tenant API key signing
- `WHISPER_MODEL` — Whisper model size (default base.en)

## Build Commands
```bash
pnpm run build       # TypeScript + Vite (0 errors, ~52s)
node dist/index.js   # Start production server
./setup.sh           # Full one-command setup
bash database/migrate.sh   # Run migrations
bash database/seed.sh      # Seed defaults
./scripts/healthcheck.sh --verbose  # Health check all endpoints
./scripts/deploy.sh        # Production deploy
```

## Version History
- v1.0: Basic short video maker
- v5.0: Multi-platform publisher (6 platforms)
- v8.0: Phase 4-5 engines (Translation, Strategy, Recycle)
- v10.0: Phase 6 enterprise (Tenants, Branding, Webhooks)
- v11.0: Phase 7-8 advanced engines (10 dedicated UI pages)
- v12.0: Full SaaS platform (60 engines, all features)
- v12.0-prod (this session): Full production-readiness transformation
  - .env.example (comprehensive), setup.sh, docker-compose (healthchecks)
  - database migrations + seeders + shell runners
  - OpenAPI/Swagger docs at /api/docs
  - Startup env validation (src/config/validate.ts)
  - deploy.sh, backup.sh, healthcheck.sh scripts
  - Enhanced CI + new deploy GitHub Actions workflow
  - Full docs/ folder (ARCHITECTURE, API, DATABASE_SCHEMA, DEPLOYMENT, Postman)
  - README.md complete rewrite
  - Build: 0 TypeScript errors, 12,699 modules transformed
- v12.0-replit (migration): Replit environment migration
  - Workflow: `node dist/index.js` on port 5000 (SKIP_RUNTIME_INSTALL=true, PORT=5000 in userenv)
  - Lazy server startup: HTTP server binds immediately, heavy AI libraries (Remotion, Kokoro TTS, Whisper.cpp) initialize in background
  - Fixed Whisper.cpp detection: correctly identifies compiled binary path for v1.x vs v1.7.4+
  - Fixed partial Whisper install recovery: removes corrupt directory before re-cloning
  - Fixed HumanizedContentPage.tsx: added missing default export (caused React lazy() crash)
  - Server returns 503 JSON (not HTML) for API routes during initialization
  - PEXELS_API_KEY set via Replit Secrets
  - Nix packages: nss, nspr, expat added for Chrome headless (Remotion)

## AI Content Pipeline (Phase 9 — NEW)

**Auto Mode** (`/auto-mode`) — Central orchestration UI connecting all AI engines:
- **Input**: Topic + Platform + Tone + Variation count (1–30) + Auto-schedule toggle
- **Steps**: Hook generation → Humanization → Emotional resonance → Quality scoring → Attention optimization → Engagement prediction → Thumbnail directives → Watermark → Caption/hashtags → AI ranking
- **Output**: Ranked content variations with scores, captions, hashtags, color palette, music genre
- **Bulk mode**: Up to 30 variations per run; auto-schedules top 3 over next 3 days
- **API**: `POST /api/pipeline/run`, `GET /api/pipeline/jobs`, `GET /api/pipeline/stats`
- **New files**: `src/services/PipelineOrchestrator.ts`, `src/db/PipelineStore.ts`, `src/server/routers/pipeline.ts`, `src/ui/pages/AutoModePage.tsx`
- **New DB stores**: `pipeline-jobs.json`, `pipeline-variations.json`
- **Docs**: `docs/SYSTEM_MAP.md`, `docs/PIPELINE.md`, `docs/AI_ENGINES_USAGE.md`

## Replit Run Configuration
- **Workflow**: `Start application` → `node dist/index.js` (port 5000)
- **Env vars set in Replit**: PORT=5000, SKIP_RUNTIME_INSTALL=true, PEXELS_API_KEY (secret)
- **Rebuild after code changes**: `node_modules/.bin/tsc --project tsconfig.build.json && node_modules/.bin/vite build`
- **Note**: First startup downloads AI models (~500MB Whisper + Kokoro). Subsequent starts are fast.
