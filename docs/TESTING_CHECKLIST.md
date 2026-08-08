# Page-by-Page Manual Testing Checklist

All **44 UI pages** grouped by sidebar section. For each page: what to click, which backend it exercises, and what "pass" looks like.

Server: `http://localhost:3123` · API docs: `/api/docs` · Start with a clean profile in Client Profiles when testing publishing.

---

## AI Pipeline

### 1. `/auto-mode` — Auto Mode
- [ ] Select topic/platform/tone → run
- [ ] Verify pipeline job created (`/api/pipeline/run` internally)
- [ ] Results appear with variation cards + scores

### 2. `/compare` — Pipeline Compare
- [ ] Run same topic across 2+ platforms in parallel
- [ ] Live status poll (`/api/pipeline/compare`, `/api/pipeline/comparisons/:id`)
- [ ] Side-by-side comparison rows update to "completed"

---

## Content Creation

### 3. `/create` — Create Video
- [ ] Generate script (`/api/script-plans`, `/api/auto-script`)
- [ ] Choose voice (`/api/voices`) + music mood (`/api/music-tags`) + background
- [ ] Render → status polling (`/api/short-video/:id/status`)
- [ ] No duplicate control sections (regression from commit ad14481)

### 4. `/` — Video Library
- [ ] List loads (`GET /api/short-videos`)
- [ ] Delete works (`DELETE /api/short-video/:id`)

### 5. `/video/:videoId` — Video Details
- [ ] Video plays from `/api/short-video/:videoId`
- [ ] Status polls every 5s and updates

### 6. `/trends` — Trend Dashboard
- [ ] Category filter → trending topics (`/api/trends`, `/api/trends/viral`)

### 7. `/hooks` — Hook Library
- [ ] List + best hooks (`GET /api/hooks`, `/api/hooks/best`)
- [ ] Generate new hook (`POST /api/hooks/generate`) — uses OpenRouter LLM
- [ ] Track/delete hooks

### 8. `/image-generator` — Image Generator
- [ ] Generate quote card / thumbnail / announcement (`POST /api/image/generate`)
- [ ] Preview from `/api/image/file/:fileName`

### 9. `/image-filters` — Image Filters
- [ ] Platform filter list (`GET /api/image/filters?platform=`)
- [ ] Generate CSS (`POST /api/image/filters/css`) + preview

### 10. `/video-library` — Video Library DB
- [ ] CRUD videos (`/api/videolibrary/*`), stats, tags

---

## Publishing & Growth

### 11. `/publish` — Publish
- [ ] Create publish job (`POST /api/publish`) with `renderOutputPath`, `platform`, `channelId`, `title`
- [ ] Optional `accountId` → publishes as that profile account (use Client Profiles first)
- [ ] Metadata suggestions (`POST /api/publish/metadata-suggestions`) — one of: `youtube, telegram, instagram, facebook, linkedin, x`
- [ ] Job status + attempts (`GET /api/publish/:id`), duplicate detection → 409

### 12. `/profiles` — Client Profiles **(NEW)**
- [ ] Create profile with genres (invalid genre filtered out)
- [ ] Add account manually per provider — credentials must NEVER appear in response
- [ ] Connect YouTube → opens Google OAuth in new tab (`POST /api/oauth/youtube/connect`)
- [ ] Auto-Route Resolver → pick category+platform, matches correct accounts (`POST /api/profiles/resolve`)
- [ ] Delete account / profile (cascade)
- [ ] Restart server → profiles + accounts persist, credentials still decrypt on publish

### 13. `/oauth/success` — OAuth Result **(NEW)**
- [ ] After YouTube connect → shows "Account Connected" + account chip
- [ ] Cancel/error → shows "Connection Failed" with reason
- [ ] "Back to Profiles" navigates correctly

### 14. `/scheduler` — Scheduler (Queue)
- [ ] Queue states (`GET /api/health/queue`)
- [ ] Schedule form → bulk enqueue (`POST /api/queue/bulk`)
- [ ] Upcoming jobs (`GET /api/schedule/upcoming?hours=24`)

### 15. `/schedule-manager` — Schedule Manager
- [ ] CRUD schedules (`/api/schedule/*`), stats, toggle status

### 16. `/queue` — Bulk Queue
- [ ] Batch create jobs (`POST /api/queue/bulk`) → render queue

### 17. `/strategy` — Strategy Center
- [ ] Platform strategy (`/api/strategy/platform/:platform`), optimal time
- [ ] Content buckets + next topic
- [ ] Series CRUD + next episode

### 18. `/recycle` — Content Recycle
- [ ] Candidates/stats (`GET /api/recycle/candidates`, `/stats`)
- [ ] Recycle + dedupe checks

---

## Analytics & AI

### 19. `/analytics` — Analytics
- [ ] Date range → KPIs/charts (`GET /api/marketing/dashboard?start&end`)

### 20. `/ab-testing` — A/B Tests
- [ ] Create variants (`/api/abtesting/*`), assign to video, view results

### 21. `/ai` — AI Monitor
- [ ] Dashboard, model info (`/api/ai/dashboard`, `/api/ai/model`)
- [ ] Events feed, train/suggest actions

### 22. `/costs` — Cost Tracker
- [ ] Records + totals (`/api/costs/*`)

---

## AI Engines (Phase 7–8)

### 23–32. Engine pages — each is a single "generate/analyze" call
- [ ] 23 `/humanized` — Humanized Content (`POST /api/humanized/humanize`)
- [ ] 24 `/thumbnail` — Thumbnail Generator (`POST /api/thumbnail/generate`)
- [ ] 25 `/editing` — Expert Editing (`/api/editing/plan`, `/effects`)
- [ ] 26 `/visual` — Visual Enhancement (`POST /api/visual/enhance`)
- [ ] 27 `/audio` — Audio Quality (`POST /api/audio/process`)
- [ ] 28 `/emotional` — Emotional Resonance (`/api/emotional/score`)
- [ ] 29 `/attention` — Attention Optimizer (`POST /api/attention/optimize`)
- [ ] 30 `/quality` — Quality Scoring (`POST /api/quality/score`)
- [ ] 31 `/engagement` — Engagement Prediction (`/api/engagement/predict`)
- [ ] 32 `/account` — Account Manager (`/api/account/*`)

Each: enter input → submit → **verify meaningful output appears, no console errors**.

---

## Content Tools

### 33. `/translate` — Translation Engine
- [ ] Language list (`GET /api/translate/languages`), single + batch translate

### 34. `/comment-cta` — Comment CTA
- [ ] Generate CTA (`/api/strategy/cta/generate`) per platform

### 35. `/series` — Series Builder
- [ ] Series CRUD + episode progression (`/api/strategy/series/*`)

### 36. `/watermark` — Watermark Engine
- [ ] Generate FFmpeg filter (`POST /api/watermark/filter`), copy, save default

### 37. `/shadowban` — Shadowban Detection
- [ ] Analyze account, best time, hashtags (`/api/shadowban/*`)

---

## Engines / System

### 38. `/engines-dashboard` — All Engines Dashboard
- [ ] Each tab calls its engine endpoint and renders results (`/api/system/*`, `/api/engines/*`, `/api/abtesting/*`, `/api/approval/*`, `/api/system/content-buckets`)

### 39. `/webhooks` — Notifications
- [ ] CRUD webhooks, test send, logs (`/api/webhooks/*`)

### 40. `/branding` — White-Label Branding
- [ ] Theme CRUD + CSS preview (`/api/branding/*`)

### 41. `/content-tools` — Content Tools Dashboard
- [ ] Navigation hub → each sub-tool loads its engine

### 42. `/mappings` — Category Mapping
- [ ] Platform category mappings load/save

### 43. `/health` — Health
- [ ] Dashboard + metrics + queue states (`/api/health/*`)

### 44. `/tenants` — Tenants
- [ ] CRUD tenants, API keys, billing, quotas, logs (`/api/tenants/*`)

---

## Global Checks (run last)

- [ ] No browser console errors on any page
- [ ] `GET /api/health` returns 200
- [ ] API docs at `/api/docs` render all routers
- [ ] After a restart: profiles, accounts, credentials survive and publish still works
- [ ] Without `TENANT_KEYS_SECRET`: server boots fine, profile API returns clear error (not a crash)
