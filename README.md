# AI Viral Content Empire – SaaS Platform v12.0

> **60 AI Engines · 7 Publishing Platforms · Full Multi-Tenant SaaS**

An open-source, production-ready platform for automated viral short-form video creation and multi-platform publishing. Combines AI text-to-speech, automatic captions, AI-generated background footage, trend intelligence, and one-click publishing into a unified SaaS.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Publishing Platforms](#publishing-platforms)
- [60 AI Engines](#60-ai-engines)
- [CI/CD](#cicd)
- [Scripts](#scripts)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## Features

### Core Video Engine
- **AI Text-to-Speech** via Kokoro (multiple voices, 20+ languages)
- **Automatic Captions** via Whisper.cpp (word-level timing)
- **Background Videos** from Pexels API (free, no GPU required)
- **Video Composition** with Remotion + FFmpeg
- **AI Images** via Pollinations (optional)
- **Music Library** with mood/genre selection

### 60 AI Engines
| Category | Engines |
|----------|---------|
| Content Intelligence | Trend radar, viral scoring, audience targeting, A/B testing |
| Script Optimization | Hook generator, CTA builder, humanizer, psychological triggers |
| Visual Enhancement | 20 filter presets, thumbnail AI, color grading, watermark |
| Publishing Optimization | Hashtag optimizer, shadowban checker, platform-specific formatting |
| Analytics | Engagement prediction, retention curves, quality scoring |
| Content Management | Series builder, content recycler, multi-language translator |
| Platform Intelligence | Trend alignment, algorithm optimization, posting time predictor |

### Publishing Platforms
YouTube · Instagram · TikTok · Facebook · LinkedIn · X/Twitter · Telegram

### Client Profiles & Multi-Account
- **1 user → N profiles** (clients / niches / genres) → **N platform accounts per profile**
- Category-based **auto-routing**: videos publish to every active account whose profile matches the content category
- **OAuth connect flow** (YouTube via Google OAuth2) or manual credential entry for all platforms
- Credentials **encrypted at rest** with `TENANT_KEYS_SECRET` (AES-256-GCM)

### SaaS Infrastructure
- Multi-tenant with API key management
- Per-tenant usage tracking and billing hooks
- White-label branding
- Webhook notifications
- Cost tracking per operation
- BullMQ job queue with Redis (optional)
- Persistent cron scheduling with engine controls

---

## Quick Start

### Prerequisites

| Requirement | Version | Install |
|-------------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| pnpm | 10+ | `npm i -g pnpm` |
| ffmpeg | Any | [ffmpeg.org](https://ffmpeg.org/download.html) |
| Pexels API Key | — | [pexels.com/api](https://www.pexels.com/api/key/) |

### One-Command Setup

```bash
git clone https://github.com/your-org/ai-content-empire.git
cd ai-content-empire

# Copy and configure environment
cp .env.example .env
# Edit .env and set PEXELS_API_KEY (required)

# Run automated setup
chmod +x setup.sh
./setup.sh

# Start server
node dist/index.js
```

Open: [http://localhost:3123](http://localhost:3123)

### Manual Setup

```bash
# Install dependencies
pnpm install

# Initialize data directory and seed defaults
node database/migrations/001_init.js
node database/seeders/001_seed_defaults.js

# Build TypeScript + React
pnpm build

# Start
node dist/index.js
```

---

## Docker Deployment

The fastest way to run in production:

```bash
# Configure
cp .env.example .env
# Edit .env — set PEXELS_API_KEY

# Create data directory
mkdir -p data

# Start all services (app + Redis)
docker-compose up -d

# Monitor
docker-compose logs -f
curl http://localhost:3123/api/health
```

### Docker Images

| Dockerfile | Use Case |
|-----------|---------|
| `main.Dockerfile` | Full (default, CPU) |
| `main-cuda.Dockerfile` | NVIDIA GPU acceleration |
| `main-tiny.Dockerfile` | Minimal footprint |

---

## Environment Variables

See [`.env.example`](.env.example) for the complete reference with descriptions.

**Minimum required:**

```bash
PEXELS_API_KEY=your_key_here   # Get free at pexels.com/api/key
```

**Production recommended:**

```bash
REDIS_ENABLED=true
REDIS_HOST=redis
LOG_LEVEL=warn
TENANT_KEYS_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
```

---

## API Documentation

### Interactive Swagger UI

```
http://localhost:3123/api/docs
```

### Raw OpenAPI JSON

```
http://localhost:3123/api/docs.json
```

### Postman Collection

Import [`docs/postman_collection.json`](docs/postman_collection.json) into Postman.

### Quick Examples

**Create a video:**
```bash
curl -X POST http://localhost:3123/api/shorts \
  -H "Content-Type: application/json" \
  -d '{
    "scenes": [
      {
        "text": "AI is transforming the world as we know it.",
        "searchTerms": ["technology", "AI", "future"]
      },
      {
        "text": "Here are 3 ways AI will change your business.",
        "searchTerms": ["business", "office", "growth"]
      }
    ]
  }'
```

**Add to library:**
```bash
curl -X POST http://localhost:3123/api/videolibrary \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Trends 2026",
    "category": "Technology",
    "platform": "youtube",
    "status": "draft",
    "tags": ["AI", "tech", "viral"]
  }'
```

**Create a schedule:**
```bash
curl -X POST http://localhost:3123/api/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Tech Content",
    "platforms": ["youtube", "instagram"],
    "categories": ["Technology"],
    "cronExpression": "0 9 * * *",
    "engines": { "enableHashtagOptimization": true }
  }'
```

**Check trending topics:**
```bash
curl "http://localhost:3123/api/trends?category=Technology"
```

**Optimize hashtags:**
```bash
curl -X POST http://localhost:3123/api/strategy/hashtags \
  -H "Content-Type: application/json" \
  -d '{ "topic": "artificial intelligence", "platform": "instagram" }'
```

---

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full architecture diagram.

```
Browser (React + Vite + MUI)
    │
    ▼
Express.js API Server (Port 3123)
├── 42 Feature Routers (/api/*)
├── Swagger UI (/api/docs)
├── Rate Limiter (120 req/min)
└── Static UI (/*)
    │
    ├── ShortCreator Service
    │   ├── Kokoro TTS
    │   ├── Whisper STT (captions)
    │   ├── Remotion (video composition)
    │   ├── FFmpeg (encoding)
    │   └── Pexels API (background video)
    │
    ├── BullMQ Workers (Redis, optional)
    │   ├── RenderWorker
    │   ├── PublishWorker
    │   └── DeadLetterWorker
    │
    └── File-Based Data Layer
        └── ~/.ai-content-empire/*.json
```

---

## Publishing Platforms

| Platform | Setup |
|----------|-------|
| **YouTube** | `YOUTUBE_CLIENT_ID` + `YOUTUBE_CLIENT_SECRET` + `YOUTUBE_REFRESH_TOKEN` |
| **Instagram** | `INSTAGRAM_ACCESS_TOKEN` (via Facebook Business) |
| **Facebook** | `FACEBOOK_ACCESS_TOKEN` |
| **Telegram** | `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHANNEL_ID` |
| **LinkedIn** | `LINKEDIN_ACCESS_TOKEN` |
| **X/Twitter** | `TWITTER_API_KEY` + `TWITTER_API_SECRET` + tokens |

### Client Profiles (Multi-Account Publishing)

See [`docs/CLIENT_PROFILES.md`](docs/CLIENT_PROFILES.md) for the full reference.

Manage clients/niches and their connected platform accounts from **UI → Client Profiles** (`/profiles`) or via REST:

```bash
# Create a profile (client / niche) with routing categories
curl -X POST http://localhost:3123/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TechBrand Client",
    "description": "Technology content for TechBrand",
    "genres": ["Technology", "Science"]
  }'

# Add a platform account manually (credentials encrypted at rest)
curl -X POST http://localhost:3123/api/profiles/<profileId>/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "telegram",
    "label": "TechBrand Telegram channel",
    "credentials": { "botToken": "...", "channelId": "@techbrand" }
  }'

# Resolve which accounts should receive a video for a category+platform (auto-routing)
curl -X POST http://localhost:3123/api/profiles/resolve \
  -H "Content-Type: application/json" \
  -d '{ "category": "Technology", "platform": "youtube" }'
```

**Publishing to a specific account:** pass `accountId` in `POST /api/publish`. The publish worker decrypts that account's credentials and publishes as that account (falls back to global env credentials when omitted).

**OAuth connect (YouTube):**

```bash
# Start the flow → returns an authorizationUrl to open in a browser
curl -X POST http://localhost:3123/api/oauth/youtube/connect \
  -H "Content-Type: application/json" \
  -d '{ "profileId": "<profileId>" }'

# User approves → provider redirects to /api/oauth/youtube/callback?code=...&state=...
# The account is created automatically; UI shows the result at /oauth/success
```

> **Note:** `TENANT_KEYS_SECRET` is now **required** when using profiles — account credentials are encrypted with it. Generate one with `openssl rand -hex 32`.

---

## 60 AI Engines

Accessible via the web UI or REST API:

| Engine Group | Endpoints |
|-------------|---------|
| Content Intelligence | `/api/trends`, `/api/trends/viral`, `/api/analytics` |
| Script & Hook Tools | `/api/hooks`, `/api/humanized`, `/api/marketing` |
| Visual AI | `/api/image/generate`, `/api/thumbnail`, `/api/visual` |
| Audio AI | `/api/audio` |
| Engagement | `/api/engagement`, `/api/emotional`, `/api/attention`, `/api/quality` |
| Platform Safety | `/api/shadowban`, `/api/strategy/hashtags` |
| Publishing Tools | `/api/publish`, `/api/watermark` |
| Content Management | `/api/recycle`, `/api/translate`, `/api/editing` |
| A/B Testing | `/api/ab-testing` |
| Account & Billing | `/api/account`, `/api/costs` |
| Multi-Tenant | `/api/tenants` |
| Branding | `/api/branding` |

---

## CI/CD

### GitHub Actions

| Workflow | Trigger | Jobs |
|---------|---------|------|
| `.github/workflows/ci.yml` | Push / PR | Lint, Type Check, Tests, Build, Migration test |
| `.github/workflows/security.yml` | Push / PR | `pnpm audit` |
| `.github/workflows/deploy.yml` | Push to main / Tags | Build → Docker → VPS deploy |

### Required GitHub Secrets (for deploy)

```
DOCKER_USERNAME        Docker Hub username
DOCKER_PASSWORD        Docker Hub password or PAT
VPS_HOST               Your server hostname/IP
VPS_USER               SSH username
VPS_SSH_KEY            Private SSH key
SLACK_WEBHOOK_URL      (optional) Slack notifications
```

### Required GitHub Variables (for deploy)

```
APP_DIR     /opt/ai-content-empire
APP_URL     https://yourdomain.com
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `setup.sh` | Full one-command setup |
| `scripts/deploy.sh` | Production deployment |
| `scripts/backup.sh` | Data backup to archive |
| `scripts/healthcheck.sh` | Multi-endpoint health check |
| `database/migrate.sh` | Run all migrations |
| `database/seed.sh` | Run all seeders |

```bash
# Deploy
./scripts/deploy.sh

# Backup data
./scripts/backup.sh --output /backups

# Health check
./scripts/healthcheck.sh --verbose

# Run migrations only
bash database/migrate.sh

# Seed defaults
bash database/seed.sh
```

---

## Documentation

| Document | Description |
|---------|-------------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, data flow diagrams |
| [`docs/API.md`](docs/API.md) | Full REST API reference |
| [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) | All JSON store schemas |
| [`docs/CLIENT_PROFILES.md`](docs/CLIENT_PROFILES.md) | Client profiles & multi-account publishing reference |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Deployment guides (VPS, Docker, PM2, systemd) |
| [`docs/postman_collection.json`](docs/postman_collection.json) | Importable Postman collection |
| [`.env.example`](.env.example) | All environment variables with descriptions |

---

## Data Storage

All data is stored as JSON files under `DATA_DIR_PATH` (default: `~/.ai-content-empire/`):

```
~/.ai-content-empire/
├── videoLibrary.json        # Video library records
├── schedules.json           # Persistent schedules
├── renderJobs.json          # Render job queue
├── publishJobs.json         # Publish job queue
├── tenants.json             # Multi-tenant accounts
├── profiles.json            # Client profiles (multi-account system)
├── profileAccounts.json     # Per-profile platform accounts (encrypted credentials)
├── analytics.json           # Performance events
├── hooks.json               # Hook templates
├── brandingConfig.json      # White-label branding
├── webhooks.json            # Webhook configurations
├── costs.json               # Cost tracking
├── videos/                  # Rendered video files
├── thumbnails/              # Generated thumbnails
└── logs/                    # Application logs
```

See [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) for full schemas.

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 4 GB | 8–16 GB |
| Disk | 20 GB | 100+ GB SSD |
| OS | Linux / macOS / Windows (WSL2) | Ubuntu 22.04 LTS |
| Node.js | 20.x | 20.x LTS |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Install deps: `pnpm install`
4. Make changes and run `pnpm build`
5. Run tests: `pnpm vitest run`
6. Submit a pull request

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

*Originally open-sourced by the [AI Agents A-Z YouTube Channel](https://www.youtube.com/channel/UCloXqLhp_KGhHBe1kwaL2Tg). Enhanced to SaaS v12.0.*
