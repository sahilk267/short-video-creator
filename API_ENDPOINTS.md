# Backend API Surface Analysis

Complete inventory of all backend endpoints organized by router, with methods, paths, purposes, and implementing files.

---

## 1. REST Router (`/api`)
**File:** [src/server/routers/rest.ts](src/server/routers/rest.ts)

### Video Management

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| POST | `/api/short-video` | Create a new short video from scenes and config | `APIRouter.setupRoutes()` - Validates input, adds to queue, returns videoId |
| GET | `/api/short-video/:videoId/status` | Get current status of a video (ready, processing, failed) | `APIRouter.setupRoutes()` - Queries ShortCreator for status |
| GET | `/api/short-video/:videoId` | Download/stream the rendered video file | `APIRouter.setupRoutes()` - Streams MP4 video with proper headers |
| GET | `/api/short-videos` | List all videos in the system | `APIRouter.setupRoutes()` - Returns all videos from ShortCreator |
| DELETE | `/api/short-video/:videoId` | Delete a video and its associated data | `APIRouter.setupRoutes()` - Removes video from ShortCreator |

### Music & Voice Resources

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| GET | `/api/music-tags` | List all available music tags/categories | `APIRouter.setupRoutes()` - Returns ShortCreator music inventory |
| GET | `/api/voices` | List all available voice options | `APIRouter.setupRoutes()` - Returns ShortCreator voices |
| GET | `/api/music/:fileName` | Stream audio file by name | `APIRouter.setupRoutes()` - Streams MP3/WAV from music directory |

### News & Reporting

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| GET | `/api/news-sources` | List all available RSS/news sources | `APIRouter.setupRoutes()` - Returns NEWS_SOURCES constant |
| GET | `/api/reports` | List all fetched news reports | `APIRouter.setupRoutes()` - Queries ReportStore |
| GET | `/api/reports/:reportId` | Get a specific news report by ID | `APIRouter.setupRoutes()` - ReportStore.get() |
| POST | `/api/reports/fetch` | Fetch news stories from an RSS source | `APIRouter.setupRoutes()` - RssFetcher fetches, ReportStore saves |
| POST | `/api/reports/merge` | Merge multiple reports into a script plan | `APIRouter.setupRoutes()` - ReportMerger consolidates, creates ScriptPlan |

### Script Generation

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| GET | `/api/script-plans` | List all generated script plans | `APIRouter.setupRoutes()` - ScriptPlanStore.list() |
| POST | `/api/auto-script` | Auto-generate video scenes from a news source | `APIRouter.setupRoutes()` - RssFetcher + AiLlmGenerator (calls Ollama) |

### File Serving

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| GET | `/api/tmp/:tmpFile` | Stream temporary generated files (MP3, WAV, MP4, images) | `APIRouter.setupRoutes()` - File system streaming with MIME types |

---

## 2. Health & Monitoring Router (`/api/health`)
**File:** [src/server/routers/health.ts](src/server/routers/health.ts)

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| GET | `/api/health` | Liveness check + system status (uptime, memory, Redis) | `HealthRouter.getHealth()` - Returns status, redis connection, memory metrics |
| GET | `/api/health/dashboard` | Aggregated ops snapshot for the system health dashboard | `HealthRouter.getDashboard()` - Combines queue, worker, database, Redis, system, error, and alert telemetry |
| GET | `/api/health/queue` | Get BullMQ queue statistics (active, waiting, completed, failed, delayed, paused) | `HealthRouter.getQueueStats()` - Queries render and publish queues |
| GET | `/api/health/queue/states` | Get database job states summary (render and publish jobs by status) | `HealthRouter.getQueueStates()` - RenderJobStore + PublishJobStore |
| GET | `/api/health/metrics` | Export Prometheus metrics (process uptime, heap, memory) | `HealthRouter.getMetrics()` - Text format 0.0.4 |

---

## 3. Publish Router (`/api/publish`)
**File:** [src/server/routers/publish.ts](src/server/routers/publish.ts)

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| POST | `/api/publish` | Enqueue a video for publishing to a platform (YouTube, Instagram, Facebook, Telegram) | `PublishRouter.createPublishJob()` - Validates payload, creates PublishJobStore record, enqueues to BullMQ |
| GET | `/api/publish` | List recent publish jobs (optionally filtered by status) | `PublishRouter.listPublishJobs()` - Query parameter: `?status=...` |
| GET | `/api/publish/:id` | Get a specific publish job status and attempt history | `PublishRouter.getPublishJob()` - Returns job details + attempts array |

**Supported Platforms:** `youtube`, `telegram`, `instagram`, `facebook`
**Validation:** PlatformLimits.validatePublishPayload()

---

## 4. Queue Router (`/api/queue`)
**File:** [src/server/routers/queue.ts](src/server/routers/queue.ts)

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| POST | `/api/queue/bulk` | Enqueue a render job with bulk scene input | `QueueRouter.bulkEnqueue()` - SchedulerService.enqueueRenderJob() |

**Request Body:** `{ sceneInput, orientation, category, videoType?, subtitleLanguage?, namingKey? }`

---

## 5. Tenant Router (`/api/tenants`)
**File:** [src/server/routers/tenants.ts](src/server/routers/tenants.ts)

### Tenant Management

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| GET | `/api/tenants` | List all tenants | `TenantRouter.list()` - TenantStore.list() |
| POST | `/api/tenants` | Create a new tenant workspace | `TenantRouter.create()` - TenantStore.create({ workspaceName, tier, apiKeys? }) |
| GET | `/api/tenants/:tenantId` | Get tenant details | `TenantRouter.get()` - TenantStore.get() |

### Tenant Configuration

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| POST | `/api/tenants/:tenantId/keys` | Update encrypted API keys (OpenAI, Pexels, etc.) | `TenantRouter.updateKeys()` - CryptoService encrypts, TenantStore saves |
| POST | `/api/tenants/:tenantId/engines` | Update engine configuration (AI, rendering engines) | `TenantRouter.updateEngines()` - TenantStore.updateEngineConfig() |
| POST | `/api/tenants/:tenantId/quotas` | Update tenant quotas (render limits, API limits) | `TenantRouter.updateQuotas()` - TenantStore.updateQuotas() |

### Billing & Monitoring

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| GET | `/api/tenants/:tenantId/billing` | Get tenant usage and billing for a month | `TenantRouter.getBilling()` - TenantUsageStore + TenantQuotaService.checkQuota() |
| POST | `/api/tenants/:tenantId/logs/:engine` | Write engine-specific logs (analytics, monitoring) | `TenantRouter.writeEngineLog()` - TenantLoggerService.log() |

**Query Parameters for Billing:** `?month=YYYY-MM` (defaults to current month)

---

## 6. Marketing Router (`/api/marketing`)
**File:** [src/server/routers/marketing.ts](src/server/routers/marketing.ts)

### Audience Targeting

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| POST | `/api/marketing/audience` | Create audience segment | `MarketingRouter.createAudienceTarget()` - AudienceStore.add() |
| GET | `/api/marketing/audience` | List all audience segments | `MarketingRouter.listAudienceTargets()` - AudienceStore.list() |

### SEO & Content Optimization

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| POST | `/api/marketing/seo/optimize` | Generate SEO recommendations (title, description, keywords, category) | `MarketingRouter.optimizeSeo()` - SeoOptimizerService.optimize() |

### A/B Testing

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| POST | `/api/marketing/ab/variants` | Create title/thumbnail variants for a video | `MarketingRouter.createVariant()` - ABVariantStore.create() |
| GET | `/api/marketing/ab/variants/:videoId` | List variants for a specific video | `MarketingRouter.listVariants()` - ABVariantStore.list() |
| POST | `/api/marketing/ab/assign/:videoId` | Randomly assign a variant to experiment | `MarketingRouter.assignVariant()` - ABVariantStore.assign() |

### Analytics

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| POST | `/api/marketing/analytics` | Record or update video analytics (views, likes, shares, comments) | `MarketingRouter.upsertAnalytics()` - AnalyticsStore.upsert() |
| GET | `/api/marketing/analytics/:videoId` | Get analytics for a video + viral score | `MarketingRouter.getAnalyticsByVideo()` - AnalyticsStore + ViralStrategyService.score() |
| GET | `/api/marketing/dashboard` | Marketing dashboard with KPIs, top audiences, recent analytics | `MarketingRouter.getDashboard()` - Aggregates all stores |

---

## 7. AI Router (`/api/ai`)
**File:** [src/server/routers/ai.ts](src/server/routers/ai.ts)

### Event Tracking & Training

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| POST | `/api/ai/events` | Record a training event (job outcome, phase, latency) | `AiRouter.addEvent()` - AiLearningStore.addEvent() |
| GET | `/api/ai/events` | List recent AI training events (default limit: 200) | `AiRouter.listEvents()` - Query param: `?limit=N` |
| POST | `/api/ai/train` | Manually trigger model training | `AiRouter.train()` - AiTrainingService.runTrainingNow() |

### Model Management

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| GET | `/api/ai/model` | Get current model state + health evaluation | `AiRouter.getModel()` - AiLearningStore + AiMonitoringService.evaluateModelHealth() |
| POST | `/api/ai/suggest` | Get AI suggestion (prediction or fallback) based on model | `AiRouter.suggest()` - AiPredictionService.predict() or fallback |

### Dashboard

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| GET | `/api/ai/dashboard` | AI monitoring dashboard with success rate, failures, avg latency, recent failures | `AiRouter.dashboard()` - Aggregates events, model, and monitoring data |

---

## 8. Content Router (`/api/content`)
**File:** [src/server/routers/content.ts](src/server/routers/content.ts)

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| POST | `/api/content/ideation` | Generate content ideas based on category + trends | `ContentRouter.ideation()` - ContentEnhancementService.ideate() |
| POST | `/api/content/editing-primitives` | Get editing recommendations (transitions, effects) | `ContentRouter.editing()` - ContentEnhancementService.editingPrimitives(intensity) |
| POST | `/api/content/personalize` | Personalize content based on user preferences | `ContentRouter.personalize()` - ContentEnhancementService.personalize() |
| POST | `/api/content/interactive` | Add interactive overlays to script | `ContentRouter.interactive()` - ContentEnhancementService.addInteractiveOverlay() |
| POST | `/api/content/moderate` | Content moderation (check for inappropriate text) | `ContentRouter.moderate()` - ContentEnhancementService.moderate(text) |
| POST | `/api/content/trend-optimize` | Optimize tags based on live trends | `ContentRouter.trendOptimize()` - ContentEnhancementService.optimizeByTrends() |
| POST | `/api/content/accessibility` | Generate accessibility features (captions, descriptions) | `ContentRouter.accessibility()` - ContentEnhancementService.accessibility(script) |

---

## 9. MCP (Model Context Protocol) Router (`/mcp`)
**File:** [src/server/routers/mcp.ts](src/server/routers/mcp.ts)

### Server-Sent Events (SSE) Connection

| Method | Endpoint | Purpose | Implementation |
|--------|----------|---------|-----------------|
| GET | `/mcp/sse` | Establish SSE transport for MCP client | `MCPRouter.setupRoutes()` - SSEServerTransport initialization |
| POST | `/mcp/messages` | Handle MCP messages from client | `MCPRouter.setupRoutes()` - SSEServerTransport.handlePostMessage() |

### MCP Tools

| Tool Name | Input | Output | Purpose |
|-----------|-------|--------|---------|
| `get-video-status` | `{ videoId: string }` | Status string | Query video processing status via MCP |
| `create-short-video` | `{ scenes: sceneInput[], config: renderConfig }` | Video ID | Create video via MCP interface |

---

## 10. Server Integration
**File:** [src/server/server.ts](src/server/server.ts)

### Router Registration

All routers are registered in the Express application with the following mount paths:

```
/api              → APIRouter (rest.ts) - Main video creation & management
/mcp              → MCPRouter (mcp.ts) - Model Context Protocol
/api/health       → HealthRouter (health.ts) - Health & metrics
/api/publish      → PublishRouter (publish.ts) - Publishing pipeline
/api/queue        → QueueRouter (queue.ts) - Job enqueueing
/api/tenants      → TenantRouter (tenants.ts) - Multi-tenant management
/api/marketing    → MarketingRouter (marketing.ts) - Analytics & SEO
/api/ai           → AiRouter (ai.ts) - ML model training & prediction
/api/content      → ContentRouter (content.ts) - Content enhancement
```

### Middleware

- **Rate Limiting:** `apiRateLimiter` applies to all `/api/*` routes
- **Static Files:** `/static/*` served from `./static` directory
- **SPA Fallback:** All unmapped routes serve React app (`/dist/ui/index.html`)

---

## Data Models & Stores

| Store | File | Purpose |
|-------|------|---------|
| ReportStore | `src/db/ReportStore.ts` | Persists fetched news reports |
| ScriptPlanStore | `src/db/ScriptPlanStore.ts` | Persists merged script plans |
| PublishJobStore | `src/db/PublishJobStore.ts` | Persists publish job records |
| RenderJobStore | `src/db/RenderJobStore.ts` | Persists render job records |
| TenantStore | `src/db/TenantStore.ts` | Persists tenant configurations |
| TenantUsageStore | `src/db/TenantUsageStore.ts` | Persists monthly usage metrics |
| AudienceStore | `src/db/AudienceStore.ts` | Persists audience segments |
| ABVariantStore | `src/db/ABVariantStore.ts` | Persists A/B test variants |
| AnalyticsStore | `src/db/AnalyticsStore.ts` | Persists video performance metrics |
| AiLearningStore | `src/db/AiLearningStore.ts` | Persists AI events & model state |

---

## Key Services

| Service | File | Purpose | Used By |
|---------|------|---------|---------|
| ShortCreator | `src/short-creator/ShortCreator.ts` | Core video creation orchestration | REST, MCP routers |
| SchedulerService | `src/services/SchedulerService.ts` | Job enqueueing & scheduling | Queue router |
| TenantQuotaService | `src/services/TenantQuotaService.ts` | Multi-tenant quota enforcement | Tenant router |
| SeoOptimizerService | `src/services/SeoOptimizerService.ts` | SEO recommendation engine | Marketing router |
| ViralStrategyService | `src/services/ViralStrategyService.ts` | Viral score calculation | Marketing router |
| AiPredictionService | `src/services/AiPredictionService.ts` | ML model predictions | AI router |
| AiTrainingService | `src/services/AiTrainingService.ts` | Model training orchestration | AI router |
| AiMonitoringService | `src/services/AiMonitoringService.ts` | Model health evaluation | AI router |
| ContentEnhancementService | `src/services/ContentEnhancementService.ts` | Content ideation & optimization | Content router |
| CryptoService | `src/services/CryptoService.ts` | Encryption for API keys | Tenant router |
| RssFetcher | `src/news-fetcher/RssFetcher.ts` | News source ingestion | REST router |
| AiLlmGenerator | `src/script-generator/AiLlmGenerator.ts` | LLM-based script generation | REST router |

---

## Authentication & Authorization

- **Rate Limiting:** Applied to all `/api/*` routes via `apiRateLimiter`
- **Default Behavior:** No auth middleware visible in routers (likely handled at proxy/gateway level)
- **Tenant Isolation:** Tenant ID can be passed in request body or headers for multi-tenant scenarios

---

## Response Formats

### Standard Success Response
```json
{
  "status": "ok",
  "data": { /* response payload */ }
}
```

### Standard Error Response
```json
{
  "error": "Error message",
  "details": { /* optional error details */ }
}
```

### Status Codes
- **201:** Created (POST successful)
- **200:** OK (GET/POST successful)
- **400:** Bad Request (validation error)
- **404:** Not Found (resource doesn't exist)
- **409:** Conflict (duplicate/already published)
- **500:** Server Error
- **503:** Service Unavailable (health check degraded)

---

## Endpoint Statistics

| Category | Count |
|----------|-------|
| REST Endpoints | 16 |
| Health Endpoints | 4 |
| Publish Endpoints | 3 |
| Queue Endpoints | 1 |
| Tenant Endpoints | 8 |
| Marketing Endpoints | 9 |
| AI Endpoints | 6 |
| Content Endpoints | 7 |
| MCP Endpoints | 2 |
| **Total REST Endpoints** | **56** |
| **MCP Tools** | **2** |

