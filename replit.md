# AI Viral Content Empire

An AI-powered SaaS that generates short-form videos (TikTok/Instagram Reels/YouTube Shorts) using a suite of AI engines and publishes them automatically.

## Run & Operate

- **Install**: `pnpm install`
- **Build**: `pnpm run build` (compiles TypeScript + Vite React UI → `dist/`)
- **Start**: `node dist/index.js` (workflow runs this on port 5000)
- **Dev**: `pnpm run dev` (watch mode — requires manual build first)
- **Typecheck**: `pnpm run typecheck`
- **Test**: `pnpm test`

### Required env vars / secrets
| Key | Notes |
|-----|-------|
| `PEXELS_API_KEY` | **Required** — free key at pexels.com/api/key |
| `PORT` | Set to `5000` for Replit webview |
| `SKIP_RUNTIME_INSTALL` | `true` to skip heavy first-run installs (set in dev) |

### Optional secrets (for publishing features)
`YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`, `INSTAGRAM_ACCESS_TOKEN`, `FACEBOOK_ACCESS_TOKEN`, `SLACK_WEBHOOK_URL`, `TENANT_KEYS_SECRET`, `JWT_SECRET`

## Stack

- **Runtime**: Node.js 20, TypeScript 5
- **API**: Express 4 + Zod validation + Swagger UI (`/api/docs`)
- **Frontend**: React 19 + Vite 6 + MUI + Tailwind + Zustand + TanStack Query
- **Video rendering**: Remotion 4 + FFmpeg + Kokoro TTS + Whisper.cpp
- **Background videos**: Pexels API
- **Queue** (optional): BullMQ + Redis
- **Package manager**: pnpm

## Where things live

- `src/index.ts` — app entry point, starts server + background library init
- `src/server/server.ts` — Express server, route registration
- `src/server/routers/` — all API route handlers (competitor, engines, abtesting, approval, systemengines, contentbuckets + legacy)
- `src/short-creator/` — core video generation engine
- `src/services/` — 60 AI engines (see Product section)
- `src/publishers/` — YouTube, Telegram, Instagram, Facebook, X, LinkedIn publishers
- `src/workers/` — BullMQ workers (render, publish, dead-letter)
- `src/ui/pages/` — React pages; `EnginesDashboard.tsx` covers 16 v13 engine tabs
- `src/db/` — file-based JSON data stores
- `static/music/` — bundled background music tracks
- `dist/` — compiled output (gitignored; run `pnpm build` to generate)

## Architecture decisions

- **Single-port server**: Express serves both the API and the built React SPA on port 5000. No separate dev server in production.
- **Deferred ShortCreator**: The HTTP server starts immediately; heavy AI libs (Remotion, Kokoro, Whisper, FFmpeg) load in the background. Routes return 503 "initializing" until ready.
- **File-based storage**: No external database — data is stored as JSON files under `~/.ai-agents-az-video-generator/` (configurable via `DATA_DIR_PATH`).
- **LLM + rule-based fallback pattern**: Every AI engine uses `LlmGenerator` as primary and `RuleBasedGenerator` as fallback — no silent failures.
- **Redis optional**: BullMQ queue workers only start if `REDIS_ENABLED=true` and Redis is reachable.
- **First-run installs**: On first launch (without `SKIP_RUNTIME_INSTALL=true`), the app downloads Chrome Headless Shell and compiles Whisper.cpp from source — this takes several minutes.

## Product (v13.0 — all 60 engines complete)

- Generate AI short-form videos with scripts, hooks, TTS voiceover, captions, and background clips
- 60 AI engines across 6 router groups: competitor, engines (trend-hijack/category/content/caption/voice/image), abtesting, approval (moderation+validation), system (resource/throttle/assets/export/compliance/auth/errorrecovery/credentials/kb/marketing), content-buckets
- Engines Dashboard at `/engines-dashboard` — 16 tabs covering all Phase 2-3 engines
- Publish to YouTube, TikTok, Instagram, Facebook, Telegram, LinkedIn, X
- Scheduled/automated publishing with BullMQ + Redis
- Multi-tenant support with API key management + JWT auth
- MCP (Model Context Protocol) server at `/mcp` for AI agent integration
- Shadowban detection + auto recovery plan generation (`ShadowbanDetectionEngine.generateRecoveryPlan()`)
- A/B testing with statistical significance (chi-squared, p-value, confidence %)
- Compliance audit log + report generation
- Credential rotation engine with expiry detection
- Creator knowledge base with 10 built-in rules + search

## User preferences

- Keep `SKIP_RUNTIME_INSTALL=true` in dev to avoid re-downloading Chrome/Whisper on every restart

## Gotchas

- **First run is slow**: Whisper.cpp compiles from source and Chrome Headless Shell downloads (~87 MB) — can take 5–10 minutes. Subsequent restarts are fast once `installation-successful` marker file exists.
- **Build before run**: The workflow runs `node dist/index.js` — always run `pnpm build` after TypeScript changes.
- **Port must be 5000**: Replit webview requires port 5000; configured via `PORT` env var.
- **Content-buckets route**: mounted at `/api/system/content-buckets` (not `/api/content-buckets`) so that the UI's `/api/system/*` prefix stays consistent.

## Pointers

- API docs: `http://localhost:5000/api/docs` (Swagger UI)
- Engines Dashboard: `/engines-dashboard`
- Pexels API key: https://www.pexels.com/api/key/
- Remotion docs: https://www.remotion.dev/docs
