# Client Profiles & Multi-Account Publishing

The platform supports a **multi-profile, multi-client account model**: a single user can create
any number of profiles (one per client / niche / genre), and each profile can hold multiple
platform accounts (YouTube, Telegram, Instagram, Facebook, LinkedIn, X). Publishing is routed
by **content category** to the matching profiles automatically.

## Concept

```
1 User
 └─ Profile (client / niche)  — e.g. "TechBrand", "Fitness Coach", "News Network"
     ├─ genres: [Technology, Science]      ← categories that route to this profile
     └─ Accounts:
         ├─ YouTube    (OAuth2 refresh token)       status: active
         ├─ Telegram   (botToken + channelId)       status: active
         └─ Instagram  (accessToken + businessId)   status: needs-reauth
```

When a video is created with category `Technology` and platform `youtube`, the publish router
resolves **every active YouTube account whose profile lists `Technology`** (or `General`) and
publishes to each of them.

## Data Model

- `ProfileRecord` — `{ id, name, description, genres[], accountIds[], createdAt, updatedAt }`
- `ProfileAccountRecord` — `{ id, profileId, provider, label, externalId?, displayName?,
  avatarUrl?, status, lastError?, credentials{}, createdAt, updatedAt }`

> **`credentials` are encrypted at rest** (AES-256-GCM via `CryptoService`) using
> `TENANT_KEYS_SECRET`. The secret must be set — the service refuses to start without a
> strong value (no placeholders allowed).

Storage: `profiles.json` and `profileAccounts.json` under `DATA_DIR_PATH`.

## REST API

### Profiles

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/profiles` | List all profiles with their account summaries |
| POST | `/api/profiles` | Create profile `{ name, description?, genres? }` |
| GET | `/api/profiles/:id` | Get one profile |
| PATCH | `/api/profiles/:id` | Update `{ name?, description?, genres? }` |
| DELETE | `/api/profiles/:id` | Delete profile + all its accounts |
| POST | `/api/profiles/resolve` | `{ category, platform }` → matching active accounts (auto-routing) |

### Accounts (per profile)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/profiles/:id/accounts` | List accounts for a profile |
| POST | `/api/profiles/:id/accounts` | Add account manually `{ provider, label, credentials, externalId?, displayName? }` |
| DELETE | `/api/profiles/:id/accounts/:accountId` | Remove an account |
| POST | `/api/profiles/:id/accounts/:accountId/refresh` | Token refresh info stub |

### OAuth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/oauth/:provider/connect` | `{ profileId, redirectUri?, clientId? }` → `{ authorizationUrl, state }` |
| GET | `/api/oauth/:provider/callback` | Provider redirect target; exchanges code, creates the account, redirects to `/oauth/success` |

**Supported now:** YouTube (`youtube.upload` + `youtube.readonly`, offline access, refresh token
stored encrypted, channel metadata captured). Telegram/Instagram/Facebook/LinkedIn/X currently
return a helpful hint and recommend **manual credential entry** — the account model already
supports them; web-OAuth flows can be added per provider in `src/services/OAuthProvider.ts`.

> The OAuth `state` is a random value kept in memory for 15 minutes and validated on callback.

## Credential keys per provider (manual entry)

| Provider | Credential keys |
|----------|-----------------|
| `youtube` | `clientId`, `clientSecret`, `refreshToken` |
| `telegram` | `botToken`, `channelId` |
| `instagram` | `accessToken`, `businessAccountId` |
| `facebook` | `accessToken`, `pageId` |
| `linkedin` | `accessToken`, `personUrn` |
| `x` | `bearerToken`, `apiKey`, `apiSecret`, `accessToken`, `accessSecret` |

## Publishing to a specific account

`POST /api/publish` accepts an optional **`accountId`** in the payload. When set, the
`PublishWorker` decrypts that account's credentials and builds the publisher with
`createPublisherForAccount(platform, config, credentials)` — falling back to global env
credentials for any missing key. Without `accountId`, publishing uses the global env
credentials as before.

This makes `youtube`, `telegram`, `instagram`, `facebook`, `linkedin`, and `x` all available
for per-account publishing.

## Files

- `src/types/profiles.ts` — data model types
- `src/db/ProfileStore.ts` / `src/db/ProfileAccountStore.ts` — JSON storage
- `src/services/ProfileService.ts` — business logic + credential encryption
- `src/services/OAuthProvider.ts` — auth URL building / code exchange / provider hints
- `src/server/routers/profiles.ts` — `ProfilesRouter` (`/api/profiles`) + `OAuthRouter` (`/api/oauth`)
- `src/publishers/PublisherFactory.ts` — `createPublisherForAccount` credential mapping
- `src/ui/pages/ProfilesPage.tsx` / `OAuthSuccessPage.tsx` — UI
