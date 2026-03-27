# Phase-wise Render Tracking

## Purpose
This document is the current source of truth for the full create-to-render pipeline.

It now tracks more than visual render controls. It also tracks:

- source selection and source intelligence
- auto-script quality controls
- keyword biasing
- custom source management
- duplicate prevention
- publish metadata context
- runtime reliability

This prevents confusion between:

- "feature exists in UI"
- "feature is wired end-to-end"
- "feature improves script quality only"
- "feature is visible inside final MP4"
- "feature is operational only"

---

## Status Legend

| Status | Meaning |
|---|---|
| `Not Started` | Not implemented |
| `UI Only` | Visible in frontend, not wired end-to-end |
| `Backend Only` | Present in types/backend but not exposed where needed |
| `Partial` | Implemented, but incomplete or not fully verified |
| `Implemented` | End-to-end wiring exists |
| `Verified` | Confirmed via manual/runtime flow |

---

## Phase Model

| Phase | Definition |
|---|---|
| `P0` | Inventory and classification |
| `P1` | Frontend control exists |
| `P2` | API/backend accepts and uses it |
| `P3` | Render/script/source pipeline consumes it |
| `P4` | Outcome is visible in final video or intentionally indirect |
| `P5` | Manual verification completed |
| `P6` | Docker/runtime verification completed |

---

## Classification Model

| Class | Meaning |
|---|---|
| `Visible` | Directly appears in final video |
| `Indirect` | Changes source/script/audio/media selection but is not itself visible |
| `Operational` | Supports workflow, queueing, publishing, or observability only |

---

## Source Files

Primary code paths reflected in this tracking:

- [`src/ui/pages/VideoCreator.tsx`](/d:/short-video-maker_1/short-video-creator/src/ui/pages/VideoCreator.tsx)
- [`src/ui/components/video-creator/AutoScriptPanel.tsx`](/d:/short-video-maker_1/short-video-creator/src/ui/components/video-creator/AutoScriptPanel.tsx)
- [`src/ui/components/video-creator/SceneEditorList.tsx`](/d:/short-video-maker_1/short-video-creator/src/ui/components/video-creator/SceneEditorList.tsx)
- [`src/ui/components/video-creator/VideoConfigPanel.tsx`](/d:/short-video-maker_1/short-video-creator/src/ui/components/video-creator/VideoConfigPanel.tsx)
- [`src/news-fetcher/RssFetcher.ts`](/d:/short-video-maker_1/short-video-creator/src/news-fetcher/RssFetcher.ts)
- [`src/db/CustomNewsSourceStore.ts`](/d:/short-video-maker_1/short-video-creator/src/db/CustomNewsSourceStore.ts)
- [`src/db/VideoMetadataStore.ts`](/d:/short-video-maker_1/short-video-creator/src/db/VideoMetadataStore.ts)
- [`src/script-generator/AiLlmGenerator.ts`](/d:/short-video-maker_1/short-video-creator/src/script-generator/AiLlmGenerator.ts)
- [`src/server/routers/rest.ts`](/d:/short-video-maker_1/short-video-creator/src/server/routers/rest.ts)
- [`src/server/routers/publish.ts`](/d:/short-video-maker_1/short-video-creator/src/server/routers/publish.ts)
- [`src/short-creator/ShortCreator.ts`](/d:/short-video-maker_1/short-video-creator/src/short-creator/ShortCreator.ts)
- [`src/components/videos/PortraitVideo.tsx`](/d:/short-video-maker_1/short-video-creator/src/components/videos/PortraitVideo.tsx)
- [`src/components/videos/LandscapeVideo.tsx`](/d:/short-video-maker_1/short-video-creator/src/components/videos/LandscapeVideo.tsx)
- [`src/components/videos/LongFormVideo.tsx`](/d:/short-video-maker_1/short-video-creator/src/components/videos/LongFormVideo.tsx)
- [`src/types/shorts.ts`](/d:/short-video-maker_1/short-video-creator/src/types/shorts.ts)
- [`main-tiny.Dockerfile`](/d:/short-video-maker_1/short-video-creator/main-tiny.Dockerfile)

---

## A. Core Create-to-Render Features

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Scene text | Yes | Yes | Yes | Visible | `Verified` | Drives narration and captions |
| Headline | Yes | Yes | Yes | Visible | `Verified` | Used in overlay/banner |
| Search terms | Yes | Yes | Yes | Indirect | `Verified` | Controls stock media selection |
| Visual prompt | Yes | Yes | Yes | Indirect | `Partial` | Only matters when AI images are enabled |
| Subcategory | Yes | Yes | Yes | Indirect | `Implemented` | Used in media search, metadata, and prompt enrichment |
| Scene keywords | Yes | Yes | Yes | Indirect | `Implemented` | Used in media search, metadata, and prompt enrichment |
| Orientation | Yes | Yes | Yes | Visible | `Verified` | Portrait vs landscape composition |
| Voice | Yes | Yes | Yes | Indirect | `Verified` | Changes narration voice |
| Music mood | Yes | Yes | Yes | Indirect | `Implemented` | Selects background music track |
| Music volume | Yes | Yes | Yes | Indirect | `Implemented` | Changes background audio level |
| Caption position | Yes | Yes | Yes | Visible | `Implemented` | Changes caption placement |
| Caption background color | Yes | Yes | Yes | Visible | `Implemented` | Changes caption highlight/background |
| Padding back | Yes | Yes | Yes | Indirect | `Implemented` | Extends final scene hold duration |
| AI images toggle | Yes | Yes | Yes | Visible | `Implemented` | Switches stock-video vs AI-image path |
| Auto-generated captions | No direct field | Yes | Yes | Visible | `Verified` | Generated through Whisper |
| Subtitle sidecar files | No direct field | Yes | Yes | Indirect | `Implemented` | `.srt/.vtt` files generated separately |

---

## B. Source Intelligence and Auto-Script Controls

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Category chips | Yes | Yes | Yes | Indirect | `Verified` | Scopes source set and prompt framing |
| Multi-source selection | Yes | Yes | Yes | Indirect | `Implemented` | Auto-script pulls from multiple selected feeds |
| `All Sources` option | Yes | Yes | Yes | Indirect | `Implemented` | Category-scoped all-sources selection |
| Built-in source registry | Yes | Yes | Yes | Indirect | `Verified` | Default curated feeds |
| Custom RSS/feed source add | Yes | Yes | Yes | Indirect | `Implemented` | New feed saved and available immediately |
| Keyword bias field | Yes | Yes | Yes | Indirect | `Implemented` | Biases topic discovery, hooks, and script generation |
| Trending topic suggestions | Yes | Yes | Yes | Indirect | `Implemented` | Generated from merged source stories |
| Style selector (`News`/`Viral`/`Explainer`) | Yes | Yes | Yes | Indirect | `Implemented` | Changes tone of hooks and script |
| Hook suggestions | Yes | Yes | Yes | Indirect | `Implemented` | User-selected hook steers scene 1 framing |
| Auto refresh | Yes | Yes | Yes | Operational | `Implemented` | Refreshes topics and hooks from current source set |
| Auto-script generation | Yes | Yes | Yes | Indirect | `Implemented` | Creates scene draft later used for render |

---

## C. Metadata and Publishing Context

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Per-video metadata store | No direct UI | Yes | Yes | Operational | `Implemented` | Saves topic, summary, subcategory, keywords |
| Publish metadata suggestions | Yes | Yes | Yes | Operational | `Implemented` | Uses saved video metadata to generate platform metadata |
| Publish dashboard autofill | Yes | Yes | Yes | Operational | `Implemented` | Prefills title/description/caption/hashtags |
| Metadata context chips | Yes | Yes | No | Operational | `Implemented` | Displays category, subcategory, keywords in publish step |

---

## D. Duplicate Prevention and Idempotency

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Content signature generation | No | Yes | Yes | Operational | `Implemented` | Hash built from scenes + config + render mode |
| Ready-video reuse | No | Yes | Yes | Operational | `Implemented` | Same ready video ID returned instead of duplicate render |
| Queue dedupe | No | Yes | Yes | Operational | `Implemented` | Same in-flight content does not queue again |
| Duplicate publish guard | No direct UI | Yes | Yes | Operational | `Implemented` | Already-published platform job is rejected |

---

## E. Backend-supported Render Features Not Fully Exposed

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Video type (`short` / `long`) | No direct create-page control | Yes | Yes | Visible | `Backend Only` | Long-form exists but not exposed in normal create UI |
| Duration limit | No direct create-page control | Yes | Yes | Indirect | `Backend Only` | Controls auto-splitting logic |
| Scene language | Not exposed in normal create form | Yes | Yes | Indirect | `Backend Only` | Used for TTS/Whisper language selection |
| Translation target | Not exposed in normal create form | Yes | Partial | Indirect | `Backend Only` | Present in types/TTS path |
| Scene cues | Not exposed in normal create form | Yes | Partial | Indirect | `Backend Only` | Present in schema, limited consumption |
| Long-form chaptering | No direct create-page control | Yes | Yes | Visible | `Partial` | Exists in long-form template, not standard create path |

---

## F. Video Details / Watch Flow

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Status polling | Yes | Yes | No | Operational | `Verified` | Processing / ready / failed path |
| Embedded video player | Yes | Yes | No | Operational | `Verified` | Plays final MP4 |
| Download button | Yes | Yes | No | Operational | `Verified` | Streams completed MP4 |
| Failure alert | Yes | Yes | No | Operational | `Verified` | Reflects runtime job failure |

---

## G. Queue / Ops / Dashboard Features

These are integrated but not part of final MP4 visuals.

| Feature group | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Bulk queue | Yes | Yes | Yes | Operational | `Implemented` | Job scheduling layer |
| Scheduler | Yes | Yes | Yes | Operational | `Implemented` | Controls when jobs run |
| Publish dashboard | Yes | Yes | Yes | Operational | `Implemented` | Distribution layer only |
| Analytics dashboard | Yes | Yes | No | Operational | `Implemented` | Reporting only |
| A/B testing | Yes | Yes | No | Operational | `Implemented` | Performance testing, not render layer |
| AI monitoring | Yes | Yes | No | Operational | `Implemented` | Observability |
| Health dashboard | Yes | Yes | No | Operational | `Implemented` | Runtime visibility |
| Tenant console | Yes | Yes | No | Operational | `Implemented` | Management layer |
| Content tools | Yes | Yes | Partial | Operational | `Partial` | Depends on whether output is fed into scene data |

---

## H. Runtime Reliability Features

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Whisper asset path stability | No | Yes | Critical | Operational | `Verified` | Bundled install path moved away from mounted `/app/data` |
| Caption failure fallback | No | Yes | Critical | Operational | `Verified` | Render continues even if Whisper caption step fails |
| Base video ID render path | No | Yes | Critical | Operational | `Verified` | Missing-subtitle-language bug fixed |
| Docker runtime boot | No | Yes | Critical | Operational | `Verified` | Container startup confirmed |
| Docker CA/apt reliability fixes | No | Yes | Critical | Operational | `Implemented` | Dockerfile hardened for cert/retry handling |

---

## I. Verification Matrix

### I1. Fully Verified

- Scene text -> narration
- Scene text -> captions
- Headline -> overlay
- Orientation -> composition selection
- Voice -> narration change
- Base output video ID path
- Whisper caption path
- Caption failure fallback
- Docker render success
- Multi-source story merge path
- Duplicate ready-video reuse

### I2. Implemented But Should Still Be Re-checked Manually

- Music mood differences across multiple renders
- Music volume differences
- Caption position top / center / bottom
- Caption background color variants
- AI image flow with prompt-sensitive scenes
- Long-form render path
- Duration-limit auto-splitting
- Custom RSS source quality on real-world feeds
- `All Sources` quality vs noise for each category
- Keyword-biased topic quality for different categories

### I3. Intentionally Not Render-visible

- Category chips
- Source selection
- `All Sources`
- Keyword bias field
- Trending topic selection
- Style selector
- Hook selection
- Quick summary panel
- Queue dashboards
- Publish dashboards
- Analytics dashboards
- Health dashboards
- Tenant dashboards

---

## J. Phase-wise Checklist

### Phase P0: Inventory
- [x] Separate visible vs indirect vs operational features
- [x] Separate render features from automation features
- [x] Include source intelligence and dedupe in tracking

### Phase P1: Frontend Presence
- [x] Scene fields
- [x] Render config fields
- [x] Multi-source controls
- [x] `All Sources`
- [x] Keyword bias field
- [x] Trending topics
- [x] Style selector
- [x] Hook selector
- [x] Add custom source modal
- [x] Video watch/download flow

### Phase P2: Backend Wiring
- [x] Create video request schema
- [x] TTS / Whisper / Pexels / Remotion integration
- [x] Multi-source RSS merge
- [x] Custom source persistence
- [x] Topic/hook/script endpoints accept `sourceIds`
- [x] Metadata persistence
- [x] Duplicate signature path
- [x] Status API

### Phase P3: Pipeline Wiring
- [x] Portrait template
- [x] Landscape template
- [x] Long-form template
- [x] Captions
- [x] Headline overlays
- [x] Audio + music composition
- [x] AI image / stock media switch
- [x] Keyword prompt enrichment
- [x] Metadata suggestion pipeline
- [x] Duplicate reuse path

### Phase P4: Outcome Validation
- [x] Narration visible as final audio output
- [x] Captions visibly rendered
- [x] Headline visibly rendered
- [x] Orientation visibly rendered
- [x] Stock background media rendered
- [x] Duplicate ready-video returns existing ID
- [ ] AI image output visually verified
- [ ] Long-form output visually verified
- [ ] Custom RSS source output visually verified

### Phase P5: Manual Verification
- [x] Live create request enters render successfully
- [x] Whisper no longer hard-fails first scene path
- [x] Docker runtime generates playable MP4
- [x] Multi-source UI visible and working
- [x] `All Sources` UI visible and selectable
- [x] Custom source add UI visible and persists
- [ ] Verify music mood manually
- [ ] Verify caption position manually
- [ ] Verify keyword-biased topic quality manually
- [ ] Verify custom RSS source on multiple feed types

### Phase P6: Docker Verification
- [x] Runtime starts with bundled Whisper path
- [x] Video creation works in Docker
- [x] Captions work in Docker
- [x] MP4 writes into `/app/data/videos`
- [ ] Repeat verify with AI images enabled
- [ ] Repeat verify with landscape
- [ ] Repeat verify with long-form
- [ ] Repeat verify with custom RSS source

---

## K. Recommended Next Verification Order

1. Verify `All Sources` output quality per category and decide per-category max source count if noise is high.
2. Verify keyword bias strength with 3-4 real categories.
3. Verify a custom RSS source end-to-end from add -> topic -> hook -> script -> render.
4. Verify `captionPosition` with top, center, bottom renders.
5. Verify `captionBackgroundColor` with multiple contrasting colors.
6. Verify `musicVolume` with muted, low, high.
7. Verify AI images with targeted prompt-sensitive scenes.
8. Expose and verify `videoType` in create UI.
9. Expose and verify `durationLimit` in create UI.
10. Decide whether subtitle sidecar files should remain separate or be muxed into final output.

---

## L. Summary

Current project reality:

- Core create-to-render pipeline is working.
- Source intelligence is now materially stronger than before.
- Auto-script flow now supports multi-source aggregation, category-scoped `All Sources`, keyword biasing, style, and hook selection.
- Custom RSS/feed sources are now part of the workflow.
- Duplicate video creation is now prevented at backend signature level.
- Some render capabilities still exist only in backend/types and should later be exposed in the create UI.
- Some features improve quality or efficiency without appearing inside final video, and this document now tracks that explicitly.

Use this file when asking:

- "Is this feature built?"
- "Does this feature affect final render?"
- "Is this feature only improving script quality?"
- "Is this feature operational only?"
- "Has this been manually verified or only implemented?"
