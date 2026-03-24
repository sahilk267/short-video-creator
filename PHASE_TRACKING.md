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
- [ ] 0.4 Add unit tests on `PexelsAPI`, `ShortCreator` basic current behavior

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
- [ ] 2.4 Implement: English audio + Spanish subtitle, Hindi audio + Hinglish, Spanish audio + English
- [ ] 2.5 Add `src/short-creator/libraries/SubtitleBuilder.ts`
- [ ] 2.6 Update `ShortCreator.createShort` to generate 3 output versions

---
## Phase 3: Long-form + Short-form video rendering
- [ ] 3.1 Add `videoType` and `durationLimit` to render config
- [ ] 3.2 `Remotion` templates: short 9:16 and long 16:9 with chapters
- [ ] 3.3 Auto-splitting long script into multiple files (if > 180 sec for short, etc.)
- [ ] 3.4 Add `scene.cues` to support timestamps and optional B-roll mixing

---
## Phase 4: Queue + persistence + monitoring
- [ ] 4.1 Replace in-memory queue with BullMQ + Redis
- [ ] 4.2 Job states: queued, processing, ready, failed
- [ ] 4.3 Add DB persistence for video metadata and job history
- [ ] 4.4 Monitoring API: `/api/job-status`, `/api/health`, `/api/metrics`
- [ ] 4.5 Alerts/logging, dead-letter queue
- [ ] 4.6 Sequential processing: one video at a time per worker (next video starts only after current is finished)
- [ ] 4.7 Retry policy: if a video fails, retry up to 2 times, then mark as skipped and continue with next
- [ ] 4.8 Keep queue state visible: scheduled vs in-progress vs failed vs skipped
- [ ] 4.9 Horizontal scaling: multiple workers for concurrent processing

---
## Phase 5: Multichannel Publishing
- [ ] 5.1 Add generic `PlatformPublisher` interface
- [ ] 5.2 Implement `YouTubePublisher` (Data API OAuth2)
- [ ] 5.3 Implement `TelegramPublisher` (Bot API upload)
- [ ] 5.4 Stub `InstagramPublisher`/`FacebookPublisher` for later
- [ ] 5.5 Add endpoint `POST /api/publish` with `videoId`, `channels`, `schedule` (immediate or delayed)
- [ ] 5.6 Store and track publish outcomes in DB
- [ ] 5.7 Platform-specific metadata: captions, tags, and limits per platform (YouTube/IG/TG/FB)

---
## Phase 6: Full orchestration + operations
- [ ] 6.1 Add schedule service using `agenda` or `bull repeatable jobs`
- [ ] 6.2 Add UI pages for bulk queue + category channel mapping
- [ ] 6.3 Add metadata generation (title, description, tags, hashtags)
- [ ] 6.4 Add in-flight guard for duplicate category-slot
- [ ] 6.5 Add tests: end-to-end scenario of fetch→render→publish
- [ ] 6.6 CI/CD pipeline: automated tests, linting, and deployment

---
## Phase 7: SaaS + multi-tenant + channel engines
- [ ] 7.1 Tenant model: `tenantId`, `workspaceName`, `tier`, `apiKeys`
- [ ] 7.2 Add endpoints for tenant keys management:
    - `GET /api/v1/:tenantId/keys`
    - `PUT /api/v1/:tenantId/keys`
- [ ] 7.3 Add per-tenant platform engine config:
    - `engineId`, `platform`, `orientationPreset`, `maxDuration`, `categoryRules`
- [ ] 7.4 Add per-tenant rate-limits and quotas
- [ ] 7.5 Add engine isolations & separate logs for channels (YouTube/IG/Telegram) so platform-specific pipelines can optimize
- [ ] 7.6 Add secure storage for OAuth tokens / API keys (encrypted DB field)
- [ ] 7.7 Per-tenant billing: cost tracking and usage limits
- [ ] 7.7 Add engine depth study report before implementation: (OSS tool choices, per-platform transformations, tuner strategy)
- [ ] 7.8 Confirm all components remain open-source/free before code implementation

---
## Phase 8: Digital Marketing + Viral Optimization
- [ ] 8.1 Audience targeting: location + category-based insights
- [ ] 8.2 SEO optimization: auto-titles, hashtags, keyword density
- [ ] 8.3 A/B testing: thumbnail/title variants + CTR tracking
- [ ] 8.4 Engagement analytics: views, likes, shares post-publish
- [ ] 8.5 Viral strategies: trend analysis, cross-posting, CTA overlays
- [ ] 8.6 Dashboard: performance reports + optimization suggestions

---
## Phase 9: AI Self-Learning Engine
- [ ] 9.1 Data collection: log all jobs, results, failures
- [ ] 9.2 ML model setup: TensorFlow.js for predictions (viral score, optimizations)
- [ ] 9.3 Training pipeline: periodic retrain on historical data
- [ ] 9.4 Integration: real-time suggestions in queue/render
- [ ] 9.5 Dashboard: AI recommendations + performance tracking
- [ ] 9.6 Monitoring: model accuracy, bias checks, fallback logic

---
## Phase 10: Content Quality & Engagement Enhancements
- [ ] 10.1 Advanced content ideation & scripting: AI-powered trend analysis and user preference-based ideas
- [ ] 10.2 Video editing & post-production features: transitions, effects, music sync, text animations
- [ ] 10.3 Content personalization & segmentation: audience targeting (age, location, interests)
- [ ] 10.4 Interactive & dynamic content: CTA overlays, polls, engagement prompts
- [ ] 10.5 Content moderation & compliance: copyright checks, hate speech filters
- [ ] 10.6 Real-time trend integration: live trends from social media APIs
- [ ] 10.7 Content analytics & optimization: performance heatmaps, script A/B testing
- [ ] 10.8 Multilingual & cultural adaptation: idioms, slang, cultural nuances
- [ ] 10.9 User-generated content templates: customizable templates for creators
- [ ] 10.10 Accessibility features: alt-text, extended captions, audio descriptions

---
## Phase 11: Automation & DevOps Infrastructure
- [ ] 11.1 CI/CD pipelines: automated build, test, deploy with GitHub Actions
- [ ] 11.2 Infrastructure as Code: Terraform/Docker Compose for consistent environments
- [ ] 11.3 Monitoring & observability: Prometheus + Grafana for metrics, Loki for logs
- [ ] 11.4 Security automation: SAST/DAST scans, secret rotation with Vault
- [ ] 11.5 Scalability automation: auto-scaling workers, load balancers
- [ ] 11.6 Automated testing: unit/integration/e2e with Vitest and Playwright
- [ ] 11.7 Backup & disaster recovery: automated DB/file backups to S3
- [ ] 11.8 API automation: versioning, rate limiting, auto-docs with Swagger
- [ ] 11.9 Deployment strategies: blue-green deployments, feature flags
- [ ] 11.10 Alerting & incident response: Slack/email alerts, PagerDuty integration

---
## Tracking table (task progress)
| ID | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 0.1 | Code path audit | Dev | done | Baseline discovered | 
| 1.1 | Fetcher cron service | Dev | open | Add RSS and manual API | 
| 1.2 | DB for reports | Dev | open | Choose SQLite for POC | 
| 2.1 | Multi-language scene type | Dev | open | include `language` + `subtitleLanguage` | 
| 2.4 | 3-version render | Dev | open | EN->ES, HI->Hinglish, ES->EN | 
| 4.1 | BullMQ queue | Dev | open | 1 worker process | 
| 5.2 | YouTube adapter | Dev | open | Requires Google OAuth | 
| 8.1 | Audience targeting | Dev | open | Location + category insights | 
| 8.2 | SEO optimization | Dev | open | Auto-titles, hashtags | 
| 8.3 | A/B testing | Dev | open | Thumbnail/title variants | 
| 8.4 | Engagement analytics | Dev | open | Post-publish metrics | 
| 8.5 | Viral strategies | Dev | open | Trends, cross-posting | 
| 8.6 | Marketing dashboard | Dev | open | Performance reports | 
| 9.1 | Data collection | Dev | open | Log jobs and results | 
| 9.2 | ML model setup | Dev | open | TensorFlow.js predictions | 
| 9.3 | Training pipeline | Dev | open | Periodic retrain | 
| 9.4 | AI integration | Dev | open | Real-time suggestions | 
| 9.5 | AI dashboard | Dev | open | Recommendations | 
| 9.6 | Model monitoring | Dev | open | Accuracy and bias checks | 
| 10.1 | Content ideation | Dev | open | AI trend analysis | 
| 10.2 | Video editing | Dev | open | Transitions and effects | 
| 10.3 | Personalization | Dev | open | Audience targeting | 
| 10.4 | Interactive content | Dev | open | CTA overlays | 
| 10.5 | Moderation | Dev | open | Copyright checks | 
| 10.6 | Trend integration | Dev | open | Live social trends | 
| 10.7 | Content analytics | Dev | open | Performance heatmaps | 
| 10.8 | Cultural adaptation | Dev | open | Idioms and slang | 
| 10.9 | Content templates | Dev | open | User customizable | 
| 10.10 | Accessibility | Dev | open | Alt-text and descriptions | 
| 11.1 | CI/CD pipelines | Dev | open | GitHub Actions | 
| 11.2 | IaC setup | Dev | open | Terraform/Docker | 
| 11.3 | Monitoring | Dev | open | Prometheus/Grafana | 
| 11.4 | Security automation | Dev | open | Scans and secrets | 
| 11.5 | Scalability | Dev | open | Auto-scaling workers | 
| 11.6 | Automated testing | Dev | open | Vitest/Playwright | 
| 11.7 | Backup recovery | Dev | open | S3 backups | 
| 11.8 | API automation | Dev | open | Versioning/rate limiting | 
| 11.9 | Deployment strategies | Dev | open | Blue-green/feature flags | 
| 11.10 | Alerting | Dev | open | Slack/PagerDuty | 
| 4.9 | Horizontal scaling | Dev | open | Multiple workers | 
| 5.7 | Platform metadata | Dev | open | Captions/tags per platform | 
| 6.6 | CI/CD pipeline | Dev | open | Automated deploy | 
| 7.7 | Billing tracking | Dev | open | Per-tenant costs | 

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
