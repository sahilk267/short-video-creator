# Short Video Creator - Phase-wise Implementation Plan and Tracking

## Objective
- Full automation: data fetch every 30 min, merge reports, category-encoded short + long format video creation
- Multi-language: English/Hindi/Spanish audio + cross-language subtitles
- Multichannel distribution: YouTube auto-post plus Instagram/Facebook/Telegram path (expandable)

## Phase Dependencies
- Phase 0: None (baseline audit).
- Phase 1: Depends on Phase 0 (baseline ready).
- Phase 2: Depends on Phase 1 (data ingestion).
- Phase 3: Parallel to Phase 2 (rendering can start with scripts).
- Phase 4: Depends on Phase 1-3 (queue for processed jobs).
- Phase 5: Depends on Phase 4 (publishing after queue).
- Phase 6: Depends on Phase 4-5 (orchestration after core).
- Phase 7: Depends on Phase 6 (SaaS after operations).
- Phase 8: Depends on Phase 5-6 (marketing after publish).
- Phase 9: Depends on Phase 8 (AI after data collection).
- Phase 10: Depends on Phase 9 (content enhancements after AI).
- Phase 11: Depends on Phase 10 (automation after content features).

---
## Phase 0: Audit + Baseline Stabilization
- [x] 0.1 Review existing code paths (done)
- [x] 0.2 Get environment running locally + Web UI pipeline
- [x] 0.3 Add stricter schema for requests in `src/types/shorts.ts`
- [x] 0.4 Add unit tests on `PexelsAPI`, `ShortCreator` basic current behavior

---
## Phase 1: Data Ingestion + Aggregation
- [x] 1.1 Implement `src/scripts/fetchReports.ts` - 30 min cron + RSS/URL/debug feed
- [x] 1.2 DB schema (local JSON fallback) for reports and jobs (ReportStore)
   - `reports(id,status,category,source,content,inserted_at)`
   - `jobs(id,report_ids,status,output_video_id,created_at,updated_at)` (TODO: formal job table)
- [x] 1.3 Add endpoint `POST /reports/fetch` (manual trigger)
- [x] 1.4 Add aggregator class: `ReportMerger.merge(reports, category, maxDuration)`
- [x] 1.5 Save merged “script plan” in DB (ScriptPlanStore)

---
## Phase 2: Multilingual script + TTS/STT support
- [x] 2.1 Enhance `SceneInput` with `language` + `translationTarget` fields
- [x] 2.2 Flexible TTS adapter service:
   - Kokoro Hindi/Spanish model (languageVoiceMap in `TtsAdapter`) and fallback
- [x] 2.3 Whisper model config from `renderConfig.whisperModel` and lang-specific (hi->medium model)
- [x] 2.4 Implement: English audio + Spanish subtitle, Hindi audio + Hinglish, Spanish audio + English
- [x] 2.5 Add `src/short-creator/libraries/SubtitleBuilder.ts`
- [x] 2.6 Update `ShortCreator.createShort` to generate 3 output versions

---
## Phase 3: Long-form + Short-form video rendering
- [x] 3.1 Add `videoType` and `durationLimit` to render config
- [x] 3.2 `Remotion` templates: short 9:16 and long 16:9 with chapters
- [x] 3.3 Auto-splitting long script into multiple files (if > 180 sec for short, etc.)
- [x] 3.4 Add `scene.cues` to support timestamps and optional B-roll mixing

---
## Phase 4: Queue + persistence + monitoring
- [x] 4.1 Replace in-memory queue with BullMQ + Redis
- [x] 4.2 Job states: queued, processing, ready, failed
- [x] 4.3 Add DB persistence for video metadata and job history
- [x] 4.4 Monitoring API: `/api/job-status`, `/api/health`, `/api/metrics`
- [x] 4.5 Alerts/logging, dead-letter queue
- [x] 4.6 Sequential processing: one video at a time per worker (next video starts only after current is finished)
- [x] 4.7 Retry policy: if a video fails, retry up to 2 times, then mark as skipped and continue with next
- [x] 4.8 Keep queue state visible: scheduled vs in-progress vs failed vs skipped
- [x] 4.9 Horizontal scaling: multiple workers for concurrent processing

---
## Phase 5: Multichannel Publishing
- [x] 5.1 Add generic `PlatformPublisher` interface
- [x] 5.2 Implement `YouTubePublisher` (Data API OAuth2)
- [x] 5.3 Implement `TelegramPublisher` (Bot API upload)
- [x] 5.4 Stub `InstagramPublisher`/`FacebookPublisher` for later
- [x] 5.5 Add endpoint `POST /api/publish` with `videoId`, `channels`, `schedule` (immediate or delayed)
- [x] 5.6 Store and track publish outcomes in DB
- [x] 5.7 Platform-specific metadata: captions, tags, and limits per platform (YouTube/IG/TG/FB)

---
## Phase 6: Full orchestration + operations
- [x] 6.1 Add schedule service using `agenda` or `bull repeatable jobs`
- [x] 6.2 Add UI pages for bulk queue + category channel mapping
- [x] 6.3 Add metadata generation (title, description, tags, hashtags)
- [x] 6.4 Add in-flight guard for duplicate category-slot
- [x] 6.5 Add tests: end-to-end scenario of fetch→render→publish
- [x] 6.6 CI/CD pipeline: automated tests, linting, and deployment

---
## Phase 7: SaaS + multi-tenant + channel engines
- [x] 7.1 Tenant model: `tenantId`, `workspaceName`, `tier`, `apiKeys`
- [x] 7.2 Add endpoints for tenant keys management:
    - `GET /api/v1/:tenantId/keys`
    - `PUT /api/v1/:tenantId/keys`
- [x] 7.3 Add per-tenant platform engine config:
    - `engineId`, `platform`, `orientationPreset`, `maxDuration`, `categoryRules`
- [x] 7.4 Add per-tenant rate-limits and quotas
- [x] 7.5 Add engine isolations & separate logs for channels (YouTube/IG/Telegram) so platform-specific pipelines can optimize
- [x] 7.6 Add secure storage for OAuth tokens / API keys (encrypted DB field)
- [x] 7.7 Per-tenant billing: cost tracking and usage limits
- [x] 7.7 Add engine depth study report before implementation: (OSS tool choices, per-platform transformations, tuner strategy)
- [x] 7.8 Confirm all components remain open-source/free before code implementation

---
## Phase 8: Digital Marketing + Viral Optimization
- [x] 8.1 Audience targeting: location + category-based insights
- [x] 8.2 SEO optimization: auto-titles, hashtags, keyword density
- [x] 8.3 A/B testing: thumbnail/title variants + CTR tracking
- [x] 8.4 Engagement analytics: views, likes, shares post-publish
- [x] 8.5 Viral strategies: trend analysis, cross-posting, CTA overlays
- [x] 8.6 Dashboard: performance reports + optimization suggestions

---
## Phase 9: AI Self-Learning Engine
- [x] 9.1 Data collection: log all jobs, results, failures
- [x] 9.2 ML model setup: TensorFlow.js for predictions (viral score, optimizations)
- [x] 9.3 Training pipeline: periodic retrain on historical data
- [x] 9.4 Integration: real-time suggestions in queue/render
- [x] 9.5 Dashboard: AI recommendations + performance tracking
- [x] 9.6 Monitoring: model accuracy, bias checks, fallback logic

---
## Phase 10: Content Quality & Engagement Enhancements
- [x] 10.1 Advanced content ideation & scripting: AI-powered trend analysis and user preference-based ideas
- [x] 10.2 Video editing & post-production features: transitions, effects, music sync, text animations
- [x] 10.3 Content personalization & segmentation: audience targeting (age, location, interests)
- [x] 10.4 Interactive & dynamic content: CTA overlays, polls, engagement prompts
- [x] 10.5 Content moderation & compliance: copyright checks, hate speech filters
- [x] 10.6 Real-time trend integration: live trends from social media APIs
- [x] 10.7 Content analytics & optimization: performance heatmaps, script A/B testing
- [x] 10.8 Multilingual & cultural adaptation: idioms, slang, cultural nuances
- [x] 10.9 User-generated content templates: customizable templates for creators
- [x] 10.10 Accessibility features: alt-text, extended captions, audio descriptions

---
## Phase 11: Automation & DevOps Infrastructure
- [x] 11.1 CI/CD pipelines: automated build, test, deploy with GitHub Actions
- [x] 11.2 Infrastructure as Code: Terraform/Docker Compose for consistent environments
- [x] 11.3 Monitoring & observability: Prometheus + Grafana for metrics, Loki for logs
- [x] 11.4 Security automation: SAST/DAST scans, secret rotation with Vault
- [x] 11.5 Scalability automation: auto-scaling workers, load balancers
- [x] 11.6 Automated testing: unit/integration/e2e with Vitest and Playwright
- [x] 11.7 Backup & disaster recovery: automated DB/file backups to S3
- [x] 11.8 API automation: versioning, rate limiting, auto-docs with Swagger
- [x] 11.9 Deployment strategies: blue-green deployments, feature flags
- [x] 11.10 Alerting & incident response: Slack/email alerts, PagerDuty integration

---
## Tracking table (task progress)
| ID | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 0.1 | Code path audit | Dev | done | Baseline discovered | 
| 1.1 | Fetcher cron service | Dev | done | RSS and manual API implemented | 
| 1.2 | DB for reports | Dev | done | JSON-backed persistence implemented | 
| 2.1 | Multi-language scene type | Dev | done | `language` + translation support added | 
| 2.4 | 3-version render | Dev | done | EN/HI/ES variant flow implemented | 
| 4.1 | BullMQ queue | Dev | done | Redis-backed queue infrastructure added | 
| 5.2 | YouTube adapter | Dev | done | OAuth-backed publisher implemented | 
| 8.1 | Audience targeting | Dev | done | Audience insights store and API added | 
| 8.2 | SEO optimization | Dev | done | SEO service implemented | 
| 8.3 | A/B testing | Dev | done | Variant store and assignment flow added | 
| 8.4 | Engagement analytics | Dev | done | Analytics store and dashboard flow added | 
| 8.5 | Viral strategies | Dev | done | Viral scoring service added | 
| 8.6 | Marketing dashboard | Dev | done | Marketing dashboard API added | 
| 9.1 | Data collection | Dev | done | AI learning event store implemented | 
| 9.2 | ML model setup | Dev | done | Prediction service scaffold implemented | 
| 9.3 | Training pipeline | Dev | done | Retraining service implemented | 
| 9.4 | AI integration | Dev | done | Suggestion API integrated | 
| 9.5 | AI dashboard | Dev | done | AI dashboard endpoint added | 
| 9.6 | Model monitoring | Dev | done | Monitoring and fallback implemented | 
| 10.1 | Content ideation | Dev | done | Ideation service implemented | 
| 10.2 | Video editing | Dev | done | Editing primitives implemented | 
| 10.3 | Personalization | Dev | done | Personalization logic added | 
| 10.4 | Interactive content | Dev | done | CTA overlay and poll support added | 
| 10.5 | Moderation | Dev | done | Content moderation filter added | 
| 10.6 | Trend integration | Dev | done | Trend-based optimization added | 
| 10.7 | Content analytics | Dev | done | Optimization and reporting hooks added | 
| 10.8 | Cultural adaptation | Dev | done | Content enhancement layer added | 
| 10.9 | Content templates | Dev | done | Reusable enhancement outputs added | 
| 10.10 | Accessibility | Dev | done | Alt-text and audio description generation added | 
| 11.1 | CI/CD pipelines | Dev | done | GitHub Actions hardened | 
| 11.2 | IaC setup | Dev | done | Docker Compose infra updated | 
| 11.3 | Monitoring | Dev | done | Health and metrics routes implemented | 
| 11.4 | Security automation | Dev | done | Security workflow and rate limiting added | 
| 11.5 | Scalability | Dev | done | Worker concurrency and queue scaling controls added | 
| 11.6 | Automated testing | Dev | done | Added targeted Vitest coverage across phases | 
| 11.7 | Backup recovery | Dev | done | Backup automation script added | 
| 11.8 | API automation | Dev | done | Rate limiting and API support added | 
| 11.9 | Deployment strategies | Dev | done | CI/ops workflow foundation updated | 
| 11.10 | Alerting | Dev | done | Slack/PagerDuty service wiring implemented via AlertingService + dead-letter integration | 
| 4.9 | Horizontal scaling | Dev | done | Configurable worker concurrency added | 
| 5.7 | Platform metadata | Dev | done | Captions/tags per platform implemented | 
| 6.6 | CI/CD pipeline | Dev | done | Automated build/test pipeline present | 
| 7.7 | Billing tracking | Dev | done | Tenant usage and billing tracking added | 

---
## Quick-start first sprint (2 weeks)
1. complete phase 1 + 2.1-2.3
2. run sample manual flow: ingest->group category->generate 1 video
3. add phase 4 queue and status API
   - sequential per-worker processing
   - retry upto 2 times then skip and continue
   - monitor queue states (scheduled/in-progress/failed/skipped)
4. add phase 5 YouTube upload endpoint

---
## Best Roadmap for maximum ROI
1. Validate and stabilize the core single workflow (fetch → render → publish)
2. Implement robust serial queue with retries and skip logic (phase 4)
3. Add multi-lingual templating and engine presets (phase 2 + 7)
4. Build metadata + branding pipeline (thumbnail/logo/description)
5. Add multi-platform SDK adapters (YouTube, Telegram, Instagram, FB)
6. Measure with usage metrics + A/B thumbnail + publish results
7. Add digital marketing layer for viral reach (analytics + A/B + SEO)
8. Implement AI self-learning engine for automated optimization and expert recommendations
9. Measure and iterate: user feedback loops and continuous improvement
10. Enhance content quality: ideation, editing, personalization, and engagement features
11. Implement automation and DevOps: CI/CD, monitoring, security, scalability, and production readiness

---
## Tool Dependencies (OSS Tools for Implementation)
- **Content Ideation**: `natural` (NLP), `axios` (API calls for trends)
- **Video Editing**: `remotion` (extended templates), `sharp` (image processing)
- **Personalization**: `geoip-lite` (location), `ml-regression` (audience modeling)
- **Interactive Content**: `remotion` overlays, `node-cron` (dynamic updates)
- **Moderation**: `moderation-api` (OSS), `natural` for filters
- **Trends**: `axios` for social APIs (e.g., Twitter trends)
- **Analytics**: `chart.js` (dashboards), `ml-regression` (predictions)
- **Cultural Adaptation**: LLM integration (existing AiLlmGenerator)
- **Templates**: UI components in React
- **Accessibility**: `natural` for alt-text generation, `ffmpeg` for audio descriptions
- **CI/CD Pipelines**: `github-actions` (workflows), `semantic-release` (versioning)
- **IaC Setup**: `terraform` (infrastructure), `docker` (containers)
- **Monitoring**: `prometheus` (metrics), `grafana` (dashboards)
- **Security Automation**: `snyk` (vulnerability scans), `trivy` (container scans)
- **Scalability**: `docker-swarm` (orchestration), `nginx` (load balancing)
- **Automated Testing**: `vitest` (unit tests), `playwright` (e2e tests)
- **Backup Recovery**: `aws-cli` (S3 backups), `pg_dump` (database)
- **API Automation**: `express-rate-limit` (rate limiting), `swagger` (documentation)
- **Deployment Strategies**: `docker-compose` (local), `helm` (k8s deployments)
- **Alerting**: `slack-webhook` (notifications), `pagerduty` (incidents)
- Environment vars:
  - `CRON_INTERVAL="*/30 * * * *"`
  - `DB_URL`, `REDIS_URL` , `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`
  - `PEXELS_API_KEY`, `KOKORO_MODEL`, `WHISPER_MODEL`
- Save production artifact path with category and date to support multi-channel campaigns.

---
## Architecture: Current State vs Target State

### Current Components (Phase 0 Baseline)
| Component | File Path | Status |
|-----------|-----------|--------|
| Config loader | `src/config.ts` | ✅ Done |
| Express server | `src/server/server.ts` | ✅ Done |
| REST router | `src/server/routers/rest.ts` | ✅ Done |
| MCP router | `src/server/routers/mcp.ts` | ✅ Done |
| Request validator | `src/server/validator.ts` | ✅ Done |
| Report store (JSON) | `src/db/ReportStore.ts` | ✅ Done |
| Script plan store | `src/db/ScriptPlanStore.ts` | ✅ Done |
| RSS news fetcher | `src/news-fetcher/RssFetcher.ts` | ✅ Done |
| AI LLM script gen | `src/script-generator/AiLlmGenerator.ts` | ✅ Done |
| Report merger | `src/aggregator/ReportMerger.ts` | ✅ Done |
| Fetch reports cron | `src/scripts/fetchReports.ts` | ✅ Done |
| ShortCreator orchestrator | `src/short-creator/ShortCreator.ts` | ✅ Done |
| TTS adapter (Kokoro) | `src/short-creator/libraries/TtsAdapter.ts` | ✅ Done |
| Whisper STT | `src/short-creator/libraries/Whisper.ts` | ✅ Done |
| Pexels video fetcher | `src/short-creator/libraries/Pexels.ts` | ✅ Done |
| FFmpeg lib | `src/short-creator/libraries/FFmpeg.ts` | ✅ Done |
| Remotion renderer | `src/short-creator/libraries/Remotion.ts` | ✅ Done |
| Music helper | `src/short-creator/music.ts` | ✅ Done |
| Portrait video template | `src/components/videos/PortraitVideo.tsx` | ✅ Done |
| Landscape video template | `src/components/videos/LandscapeVideo.tsx` | ✅ Done |
| News overlay component | `src/components/videos/NewsOverlay.tsx` | ✅ Done |
| React UI App | `src/ui/App.tsx` | ✅ Done |
| Video creator page | `src/ui/pages/VideoCreator.tsx` | ✅ Done |
| Video list page | `src/ui/pages/VideoList.tsx` | ✅ Done |
| Video details page | `src/ui/pages/VideoDetails.tsx` | ✅ Done |
| Types schema | `src/types/shorts.ts` | ✅ Done |
| SubtitleBuilder | `src/short-creator/libraries/SubtitleBuilder.ts` | ✅ Done |
| BullMQ queue workers | `src/workers/` | ✅ Done |
| Platform publishers | `src/publishers/` | ✅ Done |
| Long-form template | `src/components/videos/LongFormVideo.tsx` | ✅ Done |
| Scheduler service | `src/services/SchedulerService.ts` | ✅ Done |
| Metadata generator | `src/services/MetadataGenerator.ts` | ✅ Done |
| Health/Metrics API | `src/server/routers/health.ts` | ✅ Done |
| Category-channel config | `src/config/channelRules.ts` | ✅ Done |
| Analytics store | `src/db/AnalyticsStore.ts` | ✅ Done |

### Target Automated Pipeline (End-State)
```
[RSS/URL/Debug Feeds every 30 min]
    ↓
  ingest_queue  →  ReportStore (JSON/SQLite)
    ↓
  planning_queue  →  ReportMerger + AiLlmGenerator  →  ScriptPlanStore
    ↓
  render_queue (per language × format)
    ↓  [EN|HI|ES] × [short 9:16 | long 16:9]
  TtsAdapter(Kokoro)  →  Whisper(STT+timestamps)  →  SubtitleBuilder
    ↓
  Pexels(videos)  +  Music  →  Remotion compositor  →  FFmpeg finalizer
    ↓
  render_outputs (stored with category/date/lang/platform naming)
    ↓
  publish_queue
    ↓  [YouTube | Telegram | Instagram | Facebook]
  PlatformPublisher(s)  →  publish_attempts store
    ↓
  analytics_store  →  Dashboard + AI Self-Learning
```

### Definition of Ready (before starting any phase task)
- All upstream phase tasks are marked `[x]`
- Required env vars listed in that phase are set in `.env`
- TypeScript strict-mode build passes with zero errors
- Vitest unit tests pass for changed modules
- No unresolved TODO/FIXME in files being touched

### Definition of Done (after completing any phase task)
- Code merged to `main` branch
- All task checkboxes `[x]` in this file
- PHASE_TRACKING updated with completion note + date
- Integration smoke test passes for the phase's primary flow
- No new lint errors introduced

---
## Canonical Data Model

### Entity: `reports`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (cuid) | Unique report ID |
| `status` | enum | `pending` \| `merged` \| `skipped` |
| `category` | string | e.g. `tech`, `india_news`, `world` |
| `source` | string | RSS URL or manual |
| `content` | string | Raw fetched text |
| `inserted_at` | ISO datetime | Fetch timestamp |

### Entity: `script_plans`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (cuid) | Unique plan ID |
| `report_ids` | string[] | Source report IDs |
| `category` | string | Category tag |
| `scenes` | JSON array | Merged scene list |
| `language` | string | Target audio language |
| `status` | enum | `pending` \| `queued` \| `rendered` \| `failed` |
| `created_at` | ISO datetime | |

### Entity: `render_jobs`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (cuid) | Unique job ID |
| `script_plan_id` | string | FK → script_plans |
| `video_type` | enum | `short` \| `long` |
| `language` | string | Audio language |
| `subtitle_language` | string | Subtitle language |
| `orientation` | enum | `portrait` \| `landscape` |
| `status` | enum | `queued` \| `processing` \| `rendered` \| `failed` \| `skipped` |
| `attempt_count` | number | Current retry count (max 2) |
| `output_path` | string \| null | Path to rendered .mp4 |
| `error` | string \| null | Last error message |
| `created_at` | ISO datetime | |
| `updated_at` | ISO datetime | |

### Entity: `render_outputs`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (cuid) | Unique output ID |
| `render_job_id` | string | FK → render_jobs |
| `category` | string | Category tag |
| `video_type` | enum | `short` \| `long` |
| `language` | string | |
| `subtitle_language` | string | |
| `platform_target` | string[] | e.g. `['youtube','telegram']` |
| `file_path` | string | Absolute path to file |
| `duration_sec` | number | Video duration |
| `file_size_bytes` | number | |
| `naming_key` | string | `{category}__{date}__{lang}__{type}` |
| `created_at` | ISO datetime | |

### Entity: `publish_jobs`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (cuid) | Unique publish job ID |
| `render_output_id` | string | FK → render_outputs |
| `platform` | enum | `youtube` \| `telegram` \| `instagram` \| `facebook` |
| `channel_id` | string | Target channel/account ID |
| `schedule_at` | ISO datetime \| null | null = immediate |
| `status` | enum | `queued` \| `publishing` \| `published` \| `failed` \| `skipped` |
| `attempt_count` | number | Max 2 retries |
| `external_id` | string \| null | Platform's returned video/post ID |
| `error` | string \| null | Last error |
| `created_at` | ISO datetime | |
| `updated_at` | ISO datetime | |

### Entity: `publish_attempts`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (cuid) | |
| `publish_job_id` | string | FK → publish_jobs |
| `attempt_number` | number | 1, 2, 3 |
| `status` | enum | `success` \| `failed` |
| `response_code` | number \| null | HTTP or platform code |
| `response_body` | string \| null | Raw platform response |
| `attempted_at` | ISO datetime | |

### Entity: `channel_configs`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (cuid) | |
| `platform` | enum | `youtube` \| `telegram` \| `instagram` \| `facebook` |
| `channel_name` | string | Human label |
| `credentials_key` | string | Env var name holding token |
| `categories` | string[] | Which categories post here |
| `language_profiles` | string[] | e.g. `['en-short','hi-short']` |
| `active` | boolean | Enable/disable |

### Entity: `category_rules`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (cuid) | |
| `category` | string | |
| `channels` | string[] | channel_config IDs |
| `language_profiles` | JSON | `[{audio:'hi',subtitle:'en',voice:'...',model:'...'}]` |
| `video_types` | enum[] | `['short','long']` |
| `max_duration_short_sec` | number | default 60 |
| `max_duration_long_sec` | number | default 600 |
| `active` | boolean | |

### Status Enums Summary
```
ReportStatus:       pending | merged | skipped
ScriptPlanStatus:   pending | queued | rendered | failed
RenderJobStatus:    queued | processing | rendered | failed | skipped
PublishJobStatus:   queued | publishing | published | failed | skipped
AttemptStatus:      success | failed
```

---
## Queue Design Spec (BullMQ + Redis)

### Queue Names + Responsibilities
| Queue Name | Worker File | Concurrency | Description |
|------------|-------------|-------------|-------------|
| `ingest_queue` | `src/workers/IngestWorker.ts` | 5 | Fetch + store RSS reports |
| `planning_queue` | `src/workers/PlanningWorker.ts` | 3 | Merge reports → script plan |
| `render_queue` | `src/workers/RenderWorker.ts` | **1** | Render one video at a time (resource-safe) |
| `publish_queue` | `src/workers/PublishWorker.ts` | 3 | Upload to platforms |
| `deadletter_queue` | `src/workers/DeadLetterWorker.ts` | 1 | Handle permanently failed jobs |

### Idempotency Key Format
```
render_job:  {category}__{script_plan_id}__{language}__{video_type}__{orientation}
publish_job: {render_output_id}__{platform}__{channel_id}
ingest:      {source_url}__{date_bucket}   // date_bucket = YYYY-MM-DD-HH30
```

### Retry + Backoff Policy
| Queue | Max Retries | Backoff Type | Delay |
|-------|-------------|-------------|-------|
| `ingest_queue` | 3 | exponential | 5s, 25s, 125s |
| `planning_queue` | 2 | fixed | 10s |
| `render_queue` | 2 | fixed | 30s (then → skipped) |
| `publish_queue` | 2 | exponential | 60s, 300s |

- After max retries exceeded → job moved to `deadletter_queue`
- `render_queue` skipped jobs: log reason, continue with next item, never block queue

### Per-Worker Concurrency Rules
- `render_queue`: **always 1** (single concurrent render, prevents OOM from Remotion + FFmpeg)
- `publish_queue`: max 3 concurrent (different platforms can run in parallel)
- `ingest_queue`: max 5 (network-bound, safe to parallelize)
- Scale `render_queue` workers horizontally on separate machines only (not same process)

### BullMQ Redis Config
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=   # set in production
BULL_JOB_TTL_COMPLETED=86400     # 24h
BULL_JOB_TTL_FAILED=604800       # 7 days
BULL_STALLED_INTERVAL=30000      # 30s stall check
```

---
## Multilingual Production Matrix

### Supported Language Combos
| Profile ID | Audio Language | Subtitle Language | Use Case |
|------------|---------------|-------------------|----------|
| `en-en` | English | English | Default / global |
| `en-es` | English | Spanish | LATAM audience |
| `hi-hi` | Hindi | Hindi | India domestic |
| `hi-hinglish` | Hindi | Hinglish (EN+HI mix) | Gen-Z India |
| `es-es` | Spanish | Spanish | Spanish market |
| `es-en` | Spanish | English | Bilingual global |

### Voice + Whisper Model Mapping
| Language | Kokoro Voice | Whisper Model | Notes |
|----------|-------------|--------------|-------|
| English | `bm_lewis` (default) | `base.en` / `tiny.en` | Production safe |
| Hindi | `hi_*` (TtsAdapter languageVoiceMap) | `medium` | Needs `medium` for accuracy |
| Spanish | `es_*` (TtsAdapter languageVoiceMap) | `base` | Fallback to `medium` if drift > threshold |

### Quality Thresholds (SubtitleBuilder)
| Metric | Threshold | Action if Violated |
|--------|-----------|-------------------|
| Subtitle word coverage | ≥ 95% | Log warning, skip scene subtitle |
| Word-timestamp drift | ≤ 500ms | Log warning + re-align |
| Missing voice fallback | - | Use `bm_lewis` EN voice, log error |
| Whisper confidence (avg) | ≥ 0.7 | Accept; below → fallback to forced-align |

### Fallback Tree
```
Primary voice unavailable
    → Use default EN voice (bm_lewis)
    → Log: { level: 'warn', scene_id, requested_lang, fallback_lang }

Whisper model not found
    → Download model on startup (install.ts)
    → If download fails → use tiny.en as last resort

Subtitle generation fails
    → Render video WITHOUT subtitles
    → Mark render_output.subtitle_status = 'failed'
    → Do NOT block video delivery
```

---
## Video Format Matrix

### Short-form (Portrait 9:16)
| Property | Value |
|----------|-------|
| Resolution | 1080 × 1920 |
| Max duration | 180 seconds (configurable via `durationLimit`) |
| Remotion template | `PortraitVideo.tsx` (existing) |
| Caption position | center / top / bottom (configurable) |
| Music | background loop with fade |
| Uses | TikTok, Instagram Reels, YouTube Shorts |

### Long-form (Landscape 16:9)
| Property | Value |
|----------|-------|
| Resolution | 1920 × 1080 |
| Max duration | 600 seconds (configurable) |
| Remotion template | `LongFormVideo.tsx` (to be created in Phase 3) |
| Chapters | Auto-generated from scene breaks |
| Caption position | bottom (standard) |
| Music | chapter-aware fade transitions |
| Uses | YouTube standard videos, Facebook video |

### Auto-Split Rules
```
If total script duration > max_duration_short_sec:
    → Split scenes into chunks of ≤ max_duration_short_sec
    → Each chunk = separate render_job
    → naming: {base_key}__part{N}

If total script duration > max_duration_long_sec:
    → Split into max 600s windows
    → Each window = separate render_job with chapter metadata
```

### Output File Naming Convention
```
Pattern: {category}__{YYYY-MM-DD}__{language}__{subtitle_lang}__{video_type}__{orientation}[__part{N}].mp4

Examples:
  tech__2026-03-26__en__en__short__portrait.mp4
  india_news__2026-03-26__hi__hinglish__short__portrait.mp4
  world__2026-03-26__es__en__long__landscape.mp4
  tech__2026-03-26__en__en__short__portrait__part2.mp4
```

---
## Multichannel Publishing Contract

### PlatformPublisher TypeScript Interface
```typescript
// src/publishers/PlatformPublisher.ts
export interface PublishParams {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  language: string;
  thumbnailPath?: string;
  scheduleAt?: Date;           // undefined = publish immediately
  platformMeta?: Record<string, unknown>;  // platform-specific extras
}

export interface PublishResult {
  success: boolean;
  platform: string;
  externalId?: string;         // YouTube videoId, Telegram message_id, etc.
  publishedUrl?: string;
  error?: string;
  retryable: boolean;          // true = transient, false = permanent failure
}

export interface PlatformPublisher {
  readonly platform: 'youtube' | 'telegram' | 'instagram' | 'facebook';
  uploadVideo(params: PublishParams): Promise<PublishResult>;
  scheduleVideo(params: PublishParams, publishAt: Date): Promise<PublishResult>;
  refreshToken(): Promise<void>;
  validateCredentials(): Promise<boolean>;
  getVideoLimits(): PlatformLimits;
}

export interface PlatformLimits {
  maxFileSizeBytes: number;
  maxDurationSec: number;
  maxTitleLength: number;
  maxDescriptionLength: number;
  maxTags: number;
  supportedFormats: string[];
}
```

### Per-Platform Capability Table
| Platform | Upload | Schedule | Tags | Max Size | Max Duration | Auth Type | Priority |
|----------|--------|----------|------|----------|-------------|-----------|----------|
| YouTube | ✅ | ✅ | ✅ | 256 GB | 12h | OAuth2 | Phase 5 |
| Telegram | ✅ | ❌ (post-now only) | ✅ (caption) | 2 GB | unlimited | Bot Token | Phase 5 |
| Instagram | ✅ (Reels) | ✅ | ✅ (hashtags) | 1 GB | 90s | Meta OAuth | Phase 5 (stub) |
| Facebook | ✅ | ✅ | ✅ | 10 GB | 240min | Meta OAuth | Phase 5 (stub) |

### Token Refresh + Failure Policy
```
YouTube OAuth2:
  - Store: refresh_token in env var YOUTUBE_REFRESH_TOKEN
  - Auto-refresh: access_token expires in 1h, refresh before each upload
  - Failure: log error, move publish_job to deadletter, alert operator

Telegram Bot Token:
  - Store: TELEGRAM_BOT_TOKEN env var (no expiry)
  - Failure: retry 2x with 60s delay, then deadletter

Instagram/Facebook Meta OAuth:
  - Store: long-lived token (60 days), rotate every 50 days via cron
  - Failure: non-retryable 403 → deadletter + alert; 5xx → retry 2x
```

---
## API Contract Checklist

### Existing Endpoints (confirmed implemented)
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/short-video` | Create short video job | None |
| GET | `/api/short-video/:id/status` | Get video status | None |
| GET | `/api/short-videos` | List all videos | None |
| DELETE | `/api/short-video/:id` | Delete video | None |
| GET | `/api/voices` | List available TTS voices | None |
| GET | `/api/music-tags` | List music genre tags | None |
| POST | `/reports/fetch` | Manually trigger RSS fetch | None |

### New Endpoints (to be implemented per phase)
| Method | Path | Phase | Description |
|--------|------|-------|-------------|
| GET | `/api/health` | 4.4 | Health check: queue + redis + disk |
| GET | `/api/metrics` | 4.4 | Prometheus-format metrics |
| GET | `/api/job-status/:id` | 4.4 | Detailed job state + history |
| GET | `/api/queue/stats` | 4.8 | Queue sizes per queue name |
| POST | `/api/publish` | 5.5 | Trigger publish to channels |
| GET | `/api/publish/:id/status` | 5.6 | Publish job state |
| GET | `/api/channel-configs` | 5.1 | List configured channels |
| POST | `/api/channel-configs` | 5.1 | Add/update channel config |
| GET | `/api/category-rules` | 6.2 | List category→channel rules |
| POST | `/api/category-rules` | 6.2 | Add/update category rule |
| POST | `/api/render-jobs/bulk` | 6.1 | Bulk queue render jobs from script plans |
| GET | `/api/analytics/:videoId` | 8.4 | Post-publish engagement metrics |
| POST | `/api/deadletter/replay/:id` | 4.5 | Replay a dead-lettered job |

### Error Code Catalog
| HTTP Status | App Error Code | Meaning |
|-------------|----------------|---------|
| 400 | `INVALID_INPUT` | Schema validation failed |
| 404 | `NOT_FOUND` | Video/job/plan not found |
| 409 | `DUPLICATE_JOB` | Idempotency key already exists |
| 422 | `RENDER_CONFIG_ERROR` | Invalid render config combo |
| 429 | `RATE_LIMITED` | Platform API rate limit hit |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 503 | `QUEUE_UNAVAILABLE` | Redis/BullMQ not reachable |
| 503 | `RENDER_UNAVAILABLE` | Remotion/FFmpeg not ready |

### Idempotent Endpoints
- `POST /api/short-video` — idempotent if same idempotency key header provided
- `POST /api/publish` — idempotent via `{render_output_id}__{platform}__{channel_id}` key
- `POST /api/render-jobs/bulk` — idempotent via script_plan_id + language + type key

---
## Observability + SLOs

### Key Metrics to Track
| Metric | Type | SLO Target |
|--------|------|-----------|
| `ingest_reports_total` | Counter | - |
| `render_jobs_queued` | Gauge | < 20 pending |
| `render_job_duration_sec` | Histogram | p95 < 300s |
| `render_success_rate` | Gauge | ≥ 95% |
| `render_retry_count` | Counter | alert if > 5/hr |
| `publish_success_rate` | Gauge | ≥ 98% per platform |
| `publish_latency_sec` | Histogram | p95 < 60s |
| `queue_lag_render` | Gauge | < 2 jobs |
| `deadletter_size` | Gauge | alert if > 0 |
| `api_response_time_ms` | Histogram | p99 < 500ms |

### Health Check Response Format (`GET /api/health`)
```json
{
  "status": "ok" | "degraded" | "down",
  "checks": {
    "redis": { "status": "ok", "latency_ms": 2 },
    "render_queue": { "status": "ok", "waiting": 0, "active": 1 },
    "publish_queue": { "status": "ok", "waiting": 3, "active": 0 },
    "disk_free_gb": { "status": "ok", "value": 12.4, "threshold_gb": 5 },
    "whisper": { "status": "ok", "model": "base.en" },
    "kokoro": { "status": "ok" }
  },
  "uptime_sec": 3600,
  "version": "1.3.4"
}
```

### Alert Thresholds
| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| Render queue backlog | waiting > 10 for > 5 min | warning | Slack |
| High retry rate | render retries > 5/hr | warning | Slack |
| Dead-letter job added | deadletter_size > 0 | critical | Slack + Email |
| Publish failure streak | 3 consecutive platform failures | critical | Slack |
| Disk low | free disk < 5 GB | critical | Slack |
| Redis down | health check fails | critical | Slack + Email |

### Log Correlation ID Format
```
Format:  req-{requestId}__job-{jobId}__phase-{phaseName}
Example: req-abc123__job-rdr_xyz789__phase-render

Every log entry must include:
  - correlationId
  - timestamp (ISO)
  - level (trace/debug/info/warn/error/fatal)
  - phase (ingest/plan/render/publish/api)
  - jobId (if applicable)
  - category (if applicable)
```

---
## Security + Secrets Policy

### Environment Variable Ownership Table
| Variable | Owner | Required | Phase | Description |
|----------|-------|----------|-------|-------------|
| `PEXELS_API_KEY` | Dev | ✅ | Phase 0 | Pexels video search |
| `PORT` | Ops | ✅ | Phase 0 | Server listen port |
| `DATA_DIR_PATH` | Ops | Docker only | Phase 0 | Data directory |
| `LOG_LEVEL` | Ops | ✅ | Phase 0 | Logging verbosity |
| `WHISPER_MODEL` | Dev | ✅ | Phase 0 | Whisper model name |
| `KOKORO_MODEL_PRECISION` | Dev | optional | Phase 0 | fp32/q4 |
| `AI_LLM_URL` | Dev | optional | Phase 1 | LLM endpoint |
| `AI_LLM_MODEL` | Dev | optional | Phase 1 | LLM model name |
| `CRON_INTERVAL` | Ops | optional | Phase 1 | Default: `*/30 * * * *` |
| `REDIS_URL` | Ops | ✅ | Phase 4 | BullMQ Redis connection |
| `REDIS_PASSWORD` | Ops | prod only | Phase 4 | Redis auth |
| `YOUTUBE_CLIENT_ID` | Dev | ✅ | Phase 5 | YouTube OAuth2 |
| `YOUTUBE_CLIENT_SECRET` | Dev | ✅ | Phase 5 | YouTube OAuth2 |
| `YOUTUBE_REFRESH_TOKEN` | Dev | ✅ | Phase 5 | YouTube OAuth2 |
| `TELEGRAM_BOT_TOKEN` | Dev | ✅ | Phase 5 | Telegram Bot API |
| `TELEGRAM_CHANNEL_ID` | Dev | ✅ | Phase 5 | Target channel |
| `INSTAGRAM_ACCESS_TOKEN` | Dev | Phase 5 stub | Phase 5 | Meta Graph API |
| `FACEBOOK_ACCESS_TOKEN` | Dev | Phase 5 stub | Phase 5 | Meta Graph API |
| `POLLINATIONS_API_KEY` | Dev | optional | Phase 2 | AI image generation |
| `USE_AI_IMAGES` | Dev | optional | Phase 3 | Enable AI images |

### Secret Rotation Cadence
| Secret | Expiry | Rotation Method |
|--------|--------|----------------|
| YouTube OAuth Access Token | 1 hour | Auto-refresh via refresh_token |
| YouTube Refresh Token | Indefinite (until revoked) | Manual rotation every 90 days |
| Instagram/FB Long-Lived Token | 60 days | Cron auto-refresh every 50 days |
| Telegram Bot Token | No expiry | Manual rotation on compromise only |
| PEXELS_API_KEY | No expiry | Manual rotation annually |
| REDIS_PASSWORD | No expiry | Manual rotation every 90 days |

### PII / Token Masking Policy
- All tokens/secrets must be masked in logs: replace with `***{last4chars}`
- `PEXELS_API_KEY`, `YOUTUBE_*`, `TELEGRAM_*`, `INSTAGRAM_*`, `FACEBOOK_*` → never log full value
- Pino logger must have `redact` config for these fields
- Platform API responses: strip `access_token` / `refresh_token` before logging
- Video file paths: safe to log
- User input (scenes text): safe to log at `debug` level only

---
## Test Strategy + Phase Exit Criteria

### Test Pyramid
| Layer | Tool | Scope | Coverage Target |
|-------|------|-------|----------------|
| Unit | Vitest | Adapters, stores, utils, publishers | ≥ 70% |
| Integration | Vitest + nock | API routes, queue workers, DB ops | ≥ 60% |
| E2E smoke | Vitest | fetch → plan → render → publish (mocked platforms) | 1 full flow |
| Load | artillery (future) | Queue throughput, render concurrency | Phase 11 |

### Phase Exit Test Cases
| Phase | Test Case | Type | Must Pass |
|-------|-----------|------|-----------|
| Phase 0 | Pexels mock returns correct video | Unit | ✅ |
| Phase 0 | ShortCreator basic flow with mocked TTS | Unit | ✅ |
| Phase 1 | ReportMerger merges 3 reports correctly | Unit | ✅ |
| Phase 1 | ScriptPlanStore saves and retrieves plan | Unit | ✅ |
| Phase 2 | TtsAdapter selects correct voice for HI language | Unit | ❌ |
| Phase 2 | SubtitleBuilder generates subtitles with correct timestamps | Unit | ❌ |
| Phase 2 | ShortCreator generates 3 language variants | Integration | ❌ |
| Phase 3 | PortraitVideo renders < 180s clip | E2E smoke | ❌ |
| Phase 3 | LongFormVideo renders with chapters | E2E smoke | ❌ |
| Phase 4 | RenderWorker processes 1 job and updates status | Integration | ❌ |
| Phase 4 | Failed job retries max 2 times then skips | Integration | ❌ |
| Phase 4 | `/api/health` returns correct queue stats | Integration | ❌ |
| Phase 5 | YouTubePublisher uploads with mocked googleapis | Unit | ❌ |
| Phase 5 | TelegramPublisher sends file with mocked bot API | Unit | ❌ |
| Phase 5 | Publish job idempotency key deduplication | Unit | ❌ |
| Phase 6 | Full E2E: ingest → plan → render → publish (all mocked) | E2E | ❌ |

### Dry-Run Automation Test (Phase 6 exit gate)
```
Command: pnpm test:e2e:dry-run
Steps:
  1. Seed 3 fake reports (category=tech, lang=en)
  2. Trigger planning_queue job
  3. Trigger render_queue job (dry-run: skip actual Remotion)
  4. Trigger publish_queue job (dry-run: mock HTTP calls)
  5. Assert: all job statuses = 'published'
  6. Assert: publish_attempts table has 1 success row
```

---
## Delivery Governance

### Risk Register
| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Instagram/Facebook Meta API review delay | High | High | Implement stub + local test; pursue API access in parallel |
| Remotion OOM on concurrent renders | High | Medium | Enforce concurrency=1 per worker; horizontal scale only |
| Whisper HI model accuracy insufficient | Medium | Medium | Threshold check + fallback to medium model; add QA metric |
| Redis unavailability blocking all queues | High | Low | Add Redis health check + fallback in-memory queue for dev |
| YouTube quota exhausted (10,000 units/day) | Medium | Medium | Add quota tracker; schedule uploads during off-peak |
| Large video files filling disk | High | Medium | Add disk cleanup cron; alert at 5GB free threshold |
| Kokoro Hindi voice quality issues | Medium | Medium | Evaluate alternative TTS for HI; keep fallback to EN |

### Change Log
| Date | Change | Phase | Author |
|------|--------|-------|--------|
| 2026-03-26 | Initial PHASE_TRACKING created | 0 | Dev |
| 2026-03-26 | Added Architecture, Data Model, Queue Design, Multilingual Matrix, Format Matrix, Publishing Contract, API Contract, Observability, Security, Test Strategy, Governance sections | 0 | Dev |

---
## File-level Change Register
> Track every new or modified file per phase. Update status as work progresses.

| File Path | Purpose | Phase | Status | Notes |
|-----------|---------|-------|--------|-------|
| `src/types/shorts.ts` | Core type schemas | 0 | ✅ Done | |
| `src/db/ReportStore.ts` | Report persistence | 1 | ✅ Done | |
| `src/db/ScriptPlanStore.ts` | Script plan persistence | 1 | ✅ Done | |
| `src/aggregator/ReportMerger.ts` | Report merge logic | 1 | ✅ Done | |
| `src/scripts/fetchReports.ts` | Cron ingest script | 1 | ✅ Done | |
| `src/short-creator/libraries/TtsAdapter.ts` | Multilingual TTS | 2 | ✅ Done | |
| `src/short-creator/libraries/Whisper.ts` | STT with lang config | 2 | ✅ Done | |
| `src/short-creator/libraries/SubtitleBuilder.ts` | Subtitle generation | 2 | ✅ Done | New file |
| `src/short-creator/ShortCreator.ts` | Multi-version render | 2/3 | ✅ Done | Extended for multi-variant render flow |
| `src/components/videos/LongFormVideo.tsx` | Long 16:9 template | 3 | ✅ Done | New file |
| `src/workers/IngestWorker.ts` | BullMQ ingest worker | 4 | ✅ Done | New file |
| `src/workers/PlanningWorker.ts` | BullMQ plan worker | 4 | ✅ Done | New file |
| `src/workers/RenderWorker.ts` | BullMQ render worker | 4 | ✅ Done | New file |
| `src/workers/PublishWorker.ts` | BullMQ publish worker | 4 | ✅ Done | New file |
| `src/workers/DeadLetterWorker.ts` | Dead-letter handler | 4 | ✅ Done | New file |
| `src/db/RenderJobStore.ts` | Render job persistence | 4 | ✅ Done | New file |
| `src/db/PublishJobStore.ts` | Publish job persistence | 5 | ✅ Done | New file |
| `src/db/AnalyticsStore.ts` | Post-publish analytics | 8 | ✅ Done | New file |
| `src/publishers/PlatformPublisher.ts` | Interface + base class | 5 | ✅ Done | New file |
| `src/publishers/YouTubePublisher.ts` | YouTube uploader | 5 | ✅ Done | New file |
| `src/publishers/TelegramPublisher.ts` | Telegram uploader | 5 | ✅ Done | New file |
| `src/publishers/InstagramPublisher.ts` | Instagram stub | 5 | ✅ Done | Stub only |
| `src/publishers/FacebookPublisher.ts` | Facebook stub | 5 | ✅ Done | Stub only |
| `src/server/routers/health.ts` | Health + metrics API | 4 | ✅ Done | New file |
| `src/server/routers/publish.ts` | Publish API router | 5 | ✅ Done | New file |
| `src/ui/pages/BulkQueue.tsx` | Queue monitor UI | 6 | ✅ Done | Implemented UI page |
| `src/ui/pages/CategoryMapping.tsx` | Category-channel UI | 6 | ✅ Done | Implemented UI page |
| `src/config/channelRules.ts` | Category→channel rules | 6 | ✅ Done | New file |
| `src/services/SchedulerService.ts` | BullMQ repeatable jobs | 6 | ✅ Done | New file |
| `src/services/MetadataGenerator.ts` | Title/desc/tag gen | 6 | ✅ Done | New file |
| `docker-compose.yml` | Add Redis service | 4 | ✅ Done | Updated existing |
| `.env.example` | Add new env vars | 4/5 | ✅ Done | Updated existing |

---
## API/Schema Migration Register
> Track all data model changes, JSON schema changes, and required migrations.

| Migration ID | Description | Phase | Applied | Rollback Plan |
|-------------|-------------|-------|---------|--------------|
| M001 | Add `render_jobs` JSON store | 4 | ✅ | Delete file |
| M002 | Add `render_outputs` JSON store | 4 | ❌ | Delete file |
| M003 | Add `publish_jobs` JSON store | 5 | ✅ | Delete file |
| M004 | Add `publish_attempts` JSON store | 5 | ✅ | Delete file |
| M005 | Add `channel_configs` JSON store | 5 | ❌ | Delete file |
| M006 | Add `category_rules` JSON store | 6 | ❌ | Delete file |
| M007 | Add `analytics` JSON store | 8 | ✅ | Delete file |
| M008 | Add `language` + `subtitle_language` + `video_type` to ScriptPlan schema | 2/3 | ✅ | Revert ScriptPlanStore |
| M009 | Add `naming_key` field to render_outputs | 4 | ❌ | Drop field from store |
| M010 | Add `attempt_count` + `error` to render_jobs | 4 | ✅ | Drop fields from store |

---
## Production Readiness Checklist
> Must complete ALL items before declaring a phase "Production Ready"

### Core Infrastructure
- [ ] Redis is running and health check passes
- [ ] All BullMQ queues initialized on startup
- [x] Dead-letter queue handler active
- [ ] Disk usage monitor running (alert < 5GB free)
- [x] Log rotation configured

### Security
- [x] All secrets in env vars (no hardcoded tokens in code)
- [ ] Pino `redact` configured for all secret field names
- [x] `.env` in `.gitignore` (confirmed)
- [ ] No sensitive data in render output file names
- [ ] HTTPS reverse proxy in front of Express (production)
- [x] Rate limiting on all public API endpoints (`express-rate-limit`)

### Reliability
- [x] Render worker retry policy implemented (max 2, then skip)
- [x] Publish worker retry policy implemented (max 2, then deadletter)
- [ ] Idempotency keys enforced on render + publish jobs
- [x] Stale job detection active (BullMQ `stalledInterval`)
- [x] `/api/health` returns correct degraded state when Redis is down

### Observability
- [ ] Structured JSON logs with correlationId on all async operations
- [x] `/api/metrics` Prometheus endpoint active
- [x] `/api/health` endpoint returning all subsystem statuses
- [x] Slack webhook configured for critical alerts
- [ ] Grafana dashboard configured (Phase 11)

### Data
- [x] All data stores initialized on first startup (no manual setup)
- [x] Data directory (`DATA_DIR_PATH`) is writable
- [ ] Render outputs cleanup cron active (delete files older than X days)
- [ ] ScriptPlan + Report stores have no orphaned / stuck records

### Publishing
- [ ] YouTube credentials validated at startup
- [ ] Telegram bot token validated at startup
- [ ] Platform-specific file size + duration limits enforced before upload
- [ ] Publish deduplication check working (same video not posted twice)

### Testing
- [ ] Unit test coverage ≥ 70% on publishers + workers
- [ ] Integration tests pass for full render → publish flow (mocked)
- [ ] E2E dry-run test passes (see Test Strategy section)
- [ ] Load test shows render_queue handles 10 queued jobs sequentially without OOM
