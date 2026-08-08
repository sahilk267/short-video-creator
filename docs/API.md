# API Reference – AI Viral Content Empire v12.0

> **Interactive Docs:** Visit `/api/docs` when the server is running for live Swagger UI.
> **Raw Spec:** `GET /api/docs.json`

## Base URL

```
http://localhost:3123
```

## Rate Limiting

All `/api/*` endpoints are rate-limited to **120 requests per minute** per IP.

Response headers:
- `RateLimit-Limit: 120`
- `RateLimit-Remaining: 119`
- `RateLimit-Reset: 1234567890`

Rate limit exceeded: `HTTP 429 Too Many Requests`

---

## Endpoints

### Health

#### `GET /api/health`
System health check.

**Response:**
```json
{
  "status": "ok",
  "version": "12.0.0",
  "uptime": 3600,
  "memory": { "used": 512, "total": 4096 },
  "services": { "redis": "connected", "pexels": "ok" }
}
```

---

### Videos — Core Creation

#### `GET /api/shorts`
List all render jobs.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | all | `pending\|rendering\|done\|failed` |
| `limit` | integer | 50 | Results per page |
| `offset` | integer | 0 | Pagination offset |

#### `POST /api/shorts`
Create and queue a new short video.

**Request body:**
```json
{
  "scenes": [
    {
      "text": "Narration text for this scene",
      "searchTerms": ["technology", "AI", "future"]
    }
  ],
  "music": { "genre": "ambient", "mood": "inspiring" },
  "voice": "af_heart"
}
```

**Response:**
```json
{
  "id": "clx1234abc",
  "status": "pending"
}
```

#### `GET /api/shorts/:id`
Get video details and render status.

#### `DELETE /api/shorts/:id`
Delete a video and its files.

---

### Video Library

#### `GET /api/videolibrary`
List library videos with filtering.

**Query params:** `status`, `platform`, `category`, `limit`, `offset`

#### `POST /api/videolibrary`
Add a video record to the library.

#### `GET /api/videolibrary/stats`
Library statistics breakdown by status, platform, category.

#### `GET /api/videolibrary/tags`
All tags sorted by usage count.

#### `GET /api/videolibrary/search?q=:query`
Full-text search across title, description, tags.

#### `GET /api/videolibrary/:id`
Get single library record.

#### `PATCH /api/videolibrary/:id`
Update library record fields.

#### `DELETE /api/videolibrary/:id`
Delete library record.

#### `PATCH /api/videolibrary/:id/metrics`
Update engagement metrics.

```json
{ "views": 15000, "likes": 1200, "comments": 89, "shares": 340 }
```

---

### Schedule

#### `GET /api/schedule`
List schedules.

#### `POST /api/schedule`
Create a persistent schedule.

```json
{
  "name": "Daily Tech Content",
  "platforms": ["youtube", "instagram"],
  "categories": ["Technology"],
  "languages": ["en"],
  "cronExpression": "0 9 * * *",
  "engines": {
    "enableHashtagOptimization": true,
    "enableCommentCTA": true,
    "enableViralElements": true
  },
  "quality": {
    "targetLUFS": -14,
    "visualQualityTier": "premium"
  }
}
```

#### `GET /api/schedule/stats`
Schedule statistics (active count, runs today, success rate).

#### `PATCH /api/schedule/:id/status`
Update schedule status.
```json
{ "status": "paused" }
```

#### `POST /api/schedule/:id/run`
Trigger a manual schedule run.

#### `GET /api/schedule/:id`
Get schedule details.

#### `PATCH /api/schedule/:id`
Update schedule settings.

#### `DELETE /api/schedule/:id`
Delete schedule.

---

### Publishing

#### `POST /api/publish`
Publish a video to a platform.

```json
{
  "renderOutputPath": "/path/to/video.mp4",
  "platform": "youtube",
  "channelId": "channel_handle_or_id",
  "accountId": "optional_profile_account_id",
  "title": "My Viral Video",
  "description": "Watch this amazing content!",
  "tags": ["viral", "AI", "tech"],
  "category": "Technology"
}
```

**Optional `accountId`:** when provided, publishes using that profile account's stored (encrypted) credentials instead of the global env credentials.

---

### Client Profiles (Multi-Account)

Manage client profiles and their per-platform accounts. Credentials are encrypted at rest (AES-256-GCM via `TENANT_KEYS_SECRET`). See [`docs/CLIENT_PROFILES.md`](CLIENT_PROFILES.md) for details.

#### `GET /api/profiles`
List all profiles with their account summaries.

#### `POST /api/profiles`
Create a profile.

```json
{
  "name": "TechBrand Client",
  "description": "Technology content for TechBrand",
  "genres": ["Technology", "Science"]
}
```

#### `GET /api/profiles/:id`
Get one profile with its accounts.

#### `PATCH /api/profiles/:id`
Update `name`, `description`, or `genres`.

#### `DELETE /api/profiles/:id`
Delete a profile and all its accounts.

#### `POST /api/profiles/resolve`
Auto-routing: which accounts should receive a video for a category + platform.

```json
{ "category": "Technology", "platform": "youtube" }
```

Response: array of matching `ProfileAccountSummary` objects (active accounts on profiles whose `genres` include the category).

#### `GET /api/profiles/:id/accounts`
List accounts for a profile.

#### `POST /api/profiles/:id/accounts`
Add a platform account manually.

```json
{
  "provider": "telegram",
  "label": "TechBrand Telegram channel",
  "credentials": { "botToken": "...", "channelId": "@techbrand" },
  "displayName": "TechBrand"
}
```

Credential keys per provider: `youtube` → `clientId, clientSecret, refreshToken`; `telegram` → `botToken, channelId`; `instagram` → `accessToken, businessAccountId`; `facebook` → `accessToken, pageId`; `linkedin` → `accessToken, personUrn`; `x` → `bearerToken, apiKey, apiSecret, accessToken, accessSecret`.

#### `DELETE /api/profiles/:id/accounts/:accountId`
Remove an account.

#### `POST /api/profiles/:id/accounts/:accountId/refresh`
Token refresh info (stub; auto-refresh happens on next publish).

#### `POST /api/oauth/:provider/connect`
Start an OAuth connect flow.

```json
{ "profileId": "<profileId>", "redirectUri": "optional_custom_base" }
```

Response: `{ authorizationUrl, state, provider }`. Only YouTube is currently supported (`webOAuthSupported: true`); other providers return a hint to add credentials manually.

#### `GET /api/oauth/:provider/callback`
OAuth provider redirect target. Exchanges the code, creates the account, then redirects the browser to `/oauth/success?status=...`.

---

### Trends

#### `GET /api/trends`
Get trending topics by category.

**Query params:** `category`, `region`, `limit`

#### `GET /api/trends/viral`
Viral radar — top opportunities scored by viral potential.

---

### Image Generation

#### `POST /api/image/generate`
Generate an image using AI.

```json
{
  "type": "quote_card | thumbnail | banner | social",
  "title": "Your text here",
  "category": "Technology",
  "platform": "instagram_square | youtube_thumbnail | linkedin_banner",
  "style": "modern | minimal | bold | cinematic"
}
```

#### `GET /api/image/filters`
List 20 built-in filter presets.

**Query params:** `platform`

#### `POST /api/image/filters/css`
Build CSS filter string from preset.

```json
{
  "filter": "cinema | fade | punch | chrome | ...",
  "intensity": 90,
  "brightness": 90,
  "contrast": 130,
  "saturation": 80
}
```

---

### Content Tools

#### `POST /api/translate`
Translate content to another language.

```json
{
  "text": "Hello world",
  "targetLanguage": "es",
  "sourceLanguage": "en"
}
```

#### `GET /api/recycle`
Get content recycling suggestions from the library.

#### `POST /api/watermark`
Apply watermark to a video.

```json
{
  "videoId": "clx1234abc",
  "watermark": "@YourBrand",
  "position": "bottom-right | bottom-left | top-right | top-left | center"
}
```

#### `POST /api/shadowban`
Check shadowban risk for hashtags.

```json
{
  "hashtags": ["#trending", "#viral", "#fyp"],
  "platform": "instagram | tiktok"
}
```

---

### AI Engines

#### `POST /api/humanized`
Humanize AI-generated content.

#### `POST /api/thumbnail`
Generate thumbnail for a video.

#### `POST /api/quality`
Score content quality (virality, engagement, retention potential).

#### `POST /api/engagement`
Predict engagement metrics for content.

#### `POST /api/emotional`
Emotional resonance analysis.

#### `POST /api/attention`
Attention curve optimization.

#### `POST /api/audio`
Audio enhancement suggestions.

#### `POST /api/visual`
Visual style recommendations.

#### `POST /api/editing`
Auto-editing suggestions.

---

### Strategy & Hooks

#### `GET /api/hooks`
Hook template library.

**Query params:** `category`, `platform`, `minEffectiveness`

#### `POST /api/strategy/hashtags`
Optimize hashtag set for platform.

#### `POST /api/strategy/cta`
Generate call-to-action copy.

#### `POST /api/marketing`
Generate marketing copy variants.

---

### Analytics

#### `GET /api/analytics`
Performance analytics dashboard data.

**Query params:** `period` (`7d|30d|90d|all`)

#### `GET /api/ab-testing`
List A/B test variants.

#### `POST /api/ab-testing`
Create new A/B test.

#### `PATCH /api/ab-testing/:id/winner`
Record A/B test winner.

---

### System

#### `GET /api/tenants`
List tenants (admin).

#### `POST /api/tenants`
Create tenant.

#### `GET /api/costs`
Cost tracking summary.

#### `GET /api/webhooks`
List configured webhooks.

#### `POST /api/webhooks`
Register a new webhook.

#### `GET /api/branding`
Get branding configuration.

#### `POST /api/branding`
Update branding theme.

#### `GET /api/queue`
Queue status and job counts.

---

## Error Responses

All errors follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

| HTTP Code | Description |
|-----------|-------------|
| 400 | Bad Request — validation error |
| 401 | Unauthorized — invalid API key |
| 404 | Not Found |
| 429 | Too Many Requests — rate limited |
| 500 | Internal Server Error |

---

## Interactive API Documentation

The live Swagger UI is available at:

```
http://localhost:3123/api/docs
```

Raw OpenAPI JSON spec:

```
http://localhost:3123/api/docs.json
```
