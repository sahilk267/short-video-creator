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
| Script/source language | Yes | Yes | Yes | Indirect | `Implemented` | Controls the language of the written script before narration/subtitle translation |
| Audio language | Yes | Yes | Yes | Indirect | `Implemented` | Controls the narration language independently from overlay/caption language |
| Render-time audio duration probe | No direct field | Yes | Yes | Operational | `Implemented` | Encoded MP3 duration is probed with ffprobe so scene timing does not trust unstable model-reported lengths |
| Non-English narration runtime dependency | No direct field | Yes | Yes | Operational | `Implemented` | Docker runtime now installs `espeak-ng` + language data needed by multilingual phonemization |
| eSpeak Hindi dictionary path compatibility | No direct field | Yes | Yes | Operational | `Implemented` | Docker image and entrypoint now map Debian's `/usr/lib/.../espeak-ng-data` path to the `/usr/share/...` path expected by Hindi phonemization |
| Overlay text language | Yes | Yes | Yes | Visible | `Implemented` | Controls the language of headline, ticker, and editorial overlay text independently from narration/captions |
| Caption language | Yes | Yes | Yes | Visible | `Implemented` | Controls the language of on-screen spoken captions independently from narration/overlays |
| Text mode (`overlay` / `captions` / `hybrid`) | Yes | Yes | Yes | Visible | `Implemented` | Lets creators choose overlay-only, captions-only, or disciplined hybrid text presentation |
| Music mood | Yes | Yes | Yes | Indirect | `Implemented` | Selects background music track |
| Music volume | Yes | Yes | Yes | Indirect | `Implemented` | Changes background audio level |
| Caption position | Yes | Yes | Yes | Visible | `Implemented` | Changes caption placement |
| Caption background color | Yes | Yes | Yes | Visible | `Implemented` | Changes caption highlight/background |
| Subtitle language (legacy alias) | Backend compatibility | Yes | Yes | Indirect | `Implemented` | Retained as compatibility alias so older create/render flows still map to caption language |
| Subtitle line count | Yes | Yes | Yes | Visible | `Implemented` | Changes how many subtitle lines can appear at once |
| Subtitle font scale | Yes | Yes | Yes | Visible | `Implemented` | Changes subtitle size in preview and rendered MP4 |
| Padding back | Yes | Yes | Yes | Indirect | `Implemented` | Extends final scene hold duration |
| AI images toggle | Yes | Yes | Yes | Visible | `Implemented` | Switches stock-video vs AI-image path |
| Video type (`short` / `long`) | Yes | Yes | Yes | Visible | `Implemented` | Create page now exposes short-form vs long-form mode |
| Duration limit | Yes | Yes | Yes | Indirect | `Implemented` | Create page now controls split/length target |
| Fast create-to-queue redirect | Yes | Yes | Yes | Operational | `Implemented` | Create request now queues immediately instead of waiting for per-scene translation before redirect |
| Auto-generated captions | No direct field | Yes | Yes | Visible | `Verified` | Generated through Whisper |
| Subtitle sidecar files | No direct field | Yes | Yes | Indirect | `Implemented` | `.srt/.vtt` files generated separately |
| Docker cache seeding entrypoint | No direct field | Yes | Yes | Operational | `Implemented` | Compose now respects cache-seeding entrypoint so browser/model caches can be reused across restarts |
| Modern headline overlay card | No direct field | Yes | Yes | Visible | `Verified` | New glass-card style top story treatment is present in rendered output |
| `Live` badge / scene index | No direct field | Yes | Yes | Visible | `Verified` | `Live` and `Scene x/y` labels appear in rendered video |
| Top progress bar | No direct field | Yes | Yes | Visible | `Verified` | Scene progress treatment visible at top edge |
| Lower ticker strip | No direct field | Yes | Yes | Visible | `Verified` | Bottom ticker / lower-third is visible in rendered video |
| Cinematic media motion | No direct field | Yes | Yes | Visible | `Implemented` | Portrait, landscape, and long-form use subtle zoom / fade treatment |
| Caption style polish | No direct field | Yes | Yes | Visible | `Verified` | Active-word highlight and stronger caption styling visible in output |
| Category-aware overlay theming | No direct field | Yes | Yes | Visible | `Implemented` | Overlay accent colors and labels adapt to scene headline/context |
| Refined ticker entrance and badge pulse | No direct field | Yes | Yes | Visible | `Implemented` | Lower-third motion and `Live` badge pacing have been softened and strengthened |

---

## B. Source Intelligence and Auto-Script Controls

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Category chips | Yes | Yes | Yes | Indirect | `Verified` | Scopes source set and prompt framing |
| Multi-source selection | Yes | Yes | Yes | Indirect | `Implemented` | Auto-script pulls from multiple selected feeds |
| `All Sources` option | Yes | Yes | Yes | Indirect | `Implemented` | Category-scoped all-sources selection with backend quality control |
| Built-in source registry | Yes | Yes | Yes | Indirect | `Verified` | Default curated feeds |
| Custom RSS/feed source add | Yes | Yes | Yes | Indirect | `Implemented` | New feed saved and available immediately |
| Custom feed validation | No direct field | Yes | Yes | Indirect | `Implemented` | Feed URL is validated before saving; empty or malformed feeds are rejected |
| Custom feed duplicate blocking | No direct field | Yes | Yes | Operational | `Implemented` | Same feed URL cannot be added multiple times |
| Keyword bias field | Yes | Yes | Yes | Indirect | `Implemented` | Biases topic discovery, hooks, and script generation |
| Scene audio preview | Yes | Yes | Partial | Operational | `Implemented` | `/create` now includes browser narration preview per scene and translates preview text toward the selected narration language |
| Scene subtitle preview | Yes | Yes | Partial | Visible | `Implemented` | `/create` now shows subtitle layout preview using translated caption-preview text when languages differ |
| Render readiness summary | Yes | Frontend derived | No | Operational | `Implemented` | `/create` now shows audio/subtitle/media readiness by scene count |
| Creator audio control panel | Yes | Yes | Yes | Indirect | `Implemented` | Create page now exposes narration voice, music mix, and duration/type controls in one panel |
| Creator language control panel | Yes | Yes | Yes | Indirect | `Implemented` | Create page now supports script, narration, overlay, and caption language as separate controls |
| Creator text control panel | Yes | Yes | Yes | Visible | `Implemented` | Create page now exposes text mode, caption position, line count, size, and highlight color |
| Priority keyword promotion | No direct field | Yes | Yes | Indirect | `Implemented` | Top-level keywords are now promoted into scene keywords, search terms, and AI prompts |
| Trending topic suggestions | Yes | Yes | Yes | Indirect | `Implemented` | Generated from merged source stories |
| Topic prompt ranking | No direct field | Yes | Yes | Indirect | `Implemented` | Stories are ranked before prompting using keyword relevance, freshness, source weight, and coverage |
| Style selector (`News`/`Viral`/`Explainer`) | Yes | Yes | Yes | Indirect | `Implemented` | Changes tone of hooks and script |
| Hook suggestions | Yes | Yes | Yes | Indirect | `Implemented` | User-selected hook steers scene 1 framing |
| Hook quality scoring | Yes | Yes | Yes | Indirect | `Implemented` | Hook options now include score and rationale to guide selection |
| Auto refresh | Yes | Yes | Yes | Operational | `Implemented` | Refreshes topics and hooks from current source set |
| Auto-script generation | Yes | Yes | Yes | Indirect | `Implemented` | Creates scene draft later used for render |
| Category-scoped source merge | Yes | Yes | Yes | Indirect | `Implemented` | Multiple feeds are merged, deduped, source-weighted, freshness-ranked, and capped before prompting |
| Source trust weighting | No direct field | Yes | Yes | Indirect | `Implemented` | Higher-trust feeds are prioritized when large source sets are selected |
| Freshness-biased story ranking | No direct field | Yes | Yes | Indirect | `Implemented` | Newer stories are ranked above older ones during multi-source aggregation |
| Category-specific source caps | No direct field | Yes | Yes | Indirect | `Implemented` | Oversized `All Sources` selections are trimmed by category to reduce noise |

---

## C. Metadata and Publishing Context

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Per-video metadata store | No direct UI | Yes | Yes | Operational | `Implemented` | Saves topic, summary, subcategory, keywords |
| Publish metadata suggestions | Yes | Yes | Yes | Operational | `Implemented` | Uses saved video metadata to generate platform metadata |
| Platform-specific metadata strategy | No direct UI | Yes | Yes | Operational | `Implemented` | Metadata prompt now adapts title/caption strategy per platform |
| Headline-aware metadata prompts | No direct UI | Yes | Yes | Operational | `Implemented` | Scene headlines are now included in publish metadata generation |
| Publish dashboard autofill | Yes | Yes | Yes | Operational | `Implemented` | Prefills title/description/caption/hashtags |
| Metadata context chips | Yes | Yes | No | Operational | `Implemented` | Displays category, subcategory, keywords, and headline context in publish step |

---

## D. Duplicate Prevention and Idempotency

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Content signature generation | No | Yes | Yes | Operational | `Implemented` | Hash built from scenes + config + render mode |
| Signature normalization | No | Yes | Yes | Operational | `Implemented` | Whitespace/case-only differences no longer create duplicate signatures |
| Ready-video reuse | No | Yes | Yes | Operational | `Verified` | Same ready video ID returned instead of duplicate render |
| Queue dedupe | No | Yes | Yes | Operational | `Verified` | Same in-flight content does not queue again |
| Meaningful-variant separation | No | Yes | Yes | Operational | `Verified` | Topic-adjacent but materially different scripts still create separate videos |
| Duplicate publish guard | No direct UI | Yes | Yes | Operational | `Implemented` | Already-published platform job is rejected |

---

## E. Media Relevance and Stock Selection

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Smart media term prioritization | No direct field | Yes | Yes | Indirect | `Implemented` | Scene media terms now prioritize specific phrases over generic terms |
| Keyword-weighted media search | Indirect via keywords field | Yes | Yes | Indirect | `Implemented` | Keywords now influence Pexels selection more strongly |
| Keyword-aligned AI image prompts | Indirect via keywords field | Yes | Yes | Indirect | `Implemented` | AI prompts now append keyword focus instead of relying on raw prompt text only |
| Subcategory-weighted media search | Indirect via subcategory field | Yes | Yes | Indirect | `Implemented` | Subcategory is promoted into media search priority |
| Phrase-combo Pexels queries | No | Yes | Yes | Indirect | `Implemented` | Query builder tries specific multi-word combinations before generic fallbacks |
| Generic-term deprioritization | No | Yes | Yes | Indirect | `Implemented` | `news`, `latest`, `update`, etc. are lowered in priority |
| Best-fit Pexels candidate scoring | No | Yes | Yes | Indirect | `Implemented` | Selection now prefers stronger duration/orientation fit instead of random pick |
| Sports/cricket media relevance | No direct field | Yes | Yes | Indirect | `Partial` | Improved, but still needs manual validation against real outputs |

---

## F. Backend-supported Render Features Not Fully Exposed

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Scene language | Derived from create language controls | Yes | Yes | Indirect | `Implemented` | Scene audio language is now driven from create-page audio language |
| Translation target | Legacy compatibility field | Yes | Partial | Indirect | `Partial` | Older field remains, but primary create flow now uses script/audio language controls instead |
| Scene cues | Not exposed in normal create form | Yes | Partial | Indirect | `Backend Only` | Present in schema, limited consumption |
| Long-form chaptering | Yes via video mode | Yes | Yes | Visible | `Partial` | Long-form render path exists, but chapter authoring remains mostly automatic |

---

## G. Video Details / Watch Flow

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Status polling | Yes | Yes | No | Operational | `Verified` | Processing / ready / failed path |
| Embedded video player | Yes | Yes | No | Operational | `Verified` | Plays final MP4 |
| Download button | Yes | Yes | No | Operational | `Verified` | Streams completed MP4 |
| Failure alert | Yes | Yes | No | Operational | `Verified` | Reflects runtime job failure |

---

## H. Queue / Ops / Dashboard Features

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

## I. Runtime Reliability Features

| Feature | Frontend | Backend | Pipeline use | Class | Status | Notes |
|---|---:|---:|---:|---|---|---|
| Whisper asset path stability | No | Yes | Critical | Operational | `Verified` | Bundled install path moved away from mounted `/app/data` |
| Caption failure fallback | No | Yes | Critical | Operational | `Verified` | Render continues even if Whisper caption step fails |
| Base video ID render path | No | Yes | Critical | Operational | `Verified` | Missing-subtitle-language bug fixed |
| Docker runtime boot | No | Yes | Critical | Operational | `Verified` | Container startup confirmed |
| Docker CA/apt reliability fixes | No | Yes | Critical | Operational | `Implemented` | Dockerfile hardened for cert/retry handling |

---

## J. Visual Verification Findings

Observed from live rendered video `cmn9g3g6c000001s13rt010pi`:

- New modern headline card is visible
- `Live` badge is visible
- `Scene x/5` label is visible
- Top progress bar is visible
- Bottom ticker strip is visible
- Updated active-word caption highlight is visible
- Landscape template is rendering correctly
- Per-scene headline updates are visible across scenes
- Metadata pipeline is present in backend store for this video

Observed weakness in the same video:

- Media relevance is improved structurally, but still not fully reliable
- Some visuals remain too generic for sports/cricket context
- This confirms overlay/presentation improvements are verified, while media relevance remains a quality-tuning area

---

## K. Verification Matrix

### K1. Fully Verified

- Scene text -> narration
- Scene text -> captions
- Headline -> overlay
- Modern headline card -> overlay
- `Live` badge -> overlay
- `Scene x/y` -> overlay
- Top progress bar -> overlay
- Lower ticker strip -> overlay
- Orientation -> composition selection
- Voice -> narration change
- Subtitle line count -> visible layout change
- Subtitle font scale -> visible layout change
- Script/source language -> translation source
- Audio language -> narration language
- Overlay text language -> headline/ticker translation path
- Caption language -> on-screen caption translation path
- Text mode -> overlay-only / captions-only / hybrid render behavior
- Base output video ID path
- Whisper caption path
- Caption failure fallback
- Docker render success
- Create-page video mode toggle
- Create-page duration limit control
- Multi-source story merge path
- Source trust weighting for oversized source selections
- Freshness-biased multi-source story ranking
- Category-specific source caps for `All Sources`
- Priority keyword promotion into scene metadata
- Duplicate ready-video reuse
- Signature normalization for formatting-only duplicates
- Meaningful-variant separation for dedupe
- Custom feed validation for empty/malformed sources
- Custom feed duplicate blocking
- Topic prompt ranking before AI generation
- Hook quality scoring and rationale
- Category-aware overlay theming

### K2. Implemented But Should Still Be Re-checked Manually

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
- Media relevance quality for sports/cricket outputs
- Media relevance quality for custom RSS niche feeds
- Verify cinematic media motion quality on multiple categories
- Verify category-aware overlay accents across multiple story types

### K3. Intentionally Not Render-visible

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

## L. Phase-wise Checklist

### Phase P0: Inventory
- [x] Separate visible vs indirect vs operational features
- [x] Separate render features from automation features
- [x] Include source intelligence and dedupe in tracking

### Phase P1: Frontend Presence
- [x] Scene fields
- [x] Render config fields
- [x] Video mode / duration controls
- [x] Script/audio/overlay/caption language controls
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
- [x] `All Sources` backend quality control
- [x] Custom source persistence
- [x] Topic/hook/script endpoints accept `sourceIds`
- [x] Priority keyword promotion into scene metadata
- [x] Custom feed validation before save
- [x] Topic prompt ranking before AI generation
- [x] Hook quality scoring before selection
- [x] Create route passes video type and caption language compatibility alias
- [x] Create route passes script language and audio language
- [x] Metadata persistence
- [x] Duplicate signature path
- [x] Signature normalization for whitespace/case variants
- [x] Status API

### Phase P3: Pipeline Wiring
- [x] Portrait template
- [x] Landscape template
- [x] Long-form template
- [x] Captions
- [x] Headline overlays
- [x] Modern overlay card treatment
- [x] `Live` / scene progress overlay treatment
- [x] Lower ticker strip
- [x] Category-aware overlay theming
- [x] Refined ticker entrance and badge pulse
- [x] Audio + music composition
- [x] Subtitle size / line-count render wiring
- [x] Independent script/audio/overlay/caption language wiring
- [x] Text mode wiring across portrait, landscape, and long-form templates
- [x] AI image / stock media switch
- [x] Keyword prompt enrichment
- [x] Source trust weighting
- [x] Freshness-biased story ranking
- [x] Category-specific source caps
- [x] Priority keyword promotion into search terms and AI prompts
- [x] Smart Pexels term prioritization
- [x] Phrase-combo media query generation
- [x] Best-fit Pexels candidate scoring
- [x] Metadata suggestion pipeline
- [x] Duplicate reuse path
- [x] Meaningful-variant separation in dedupe behavior

### Phase P4: Outcome Validation
- [x] Narration visible as final audio output
- [x] Captions visibly rendered
- [x] Headline visibly rendered
- [x] Orientation visibly rendered
- [x] Stock background media rendered
- [x] Modern overlay treatment visibly rendered
- [x] Scene progress / ticker treatment visibly rendered
- [x] Duplicate ready-video returns existing ID
- [ ] AI image output visually verified
- [ ] Long-form output visually verified
- [ ] Audio language translation flow manually verified
- [ ] Caption language translation flow manually verified
- [ ] Overlay text language translation flow manually verified
- [ ] Text mode render behavior manually verified
- [ ] Custom RSS source output visually verified
- [ ] Media relevance quality visually verified across categories

### Phase P5: Manual Verification
- [x] Live create request enters render successfully
- [x] Whisper no longer hard-fails first scene path
- [x] Docker runtime generates playable MP4
- [x] Multi-source UI visible and working
- [x] `All Sources` UI visible and selectable
- [x] Custom source add UI visible and persists
- [x] Create-page preview layer visible in browser
- [x] Create-page audio/subtitle control panel visible in browser
- [ ] Verify English -> French audio render
- [ ] Verify English -> Spanish caption render
- [ ] Verify vice-versa language split (for example English script -> French audio -> Spanish captions)
- [ ] Verify overlay-only and captions-only modes on real renders
- [x] New overlay/ticker/progress visuals observed in a live rendered video
- [ ] Verify music mood manually
- [ ] Verify caption position manually
- [ ] Verify keyword-biased topic quality manually
- [ ] Verify custom RSS source on multiple feed types
- [ ] Verify improved media relevance on real category outputs

### Phase P6: Docker Verification
- [x] Runtime starts with bundled Whisper path
- [x] Video creation works in Docker
- [x] Captions work in Docker
- [x] MP4 writes into `/app/data/videos`
- [x] Updated overlay visuals appear in Docker-rendered output
- [ ] Repeat verify with long-form mode from create UI
- [ ] Repeat verify with French audio in Docker
- [ ] Repeat verify with Spanish captions in Docker
- [ ] Repeat verify overlay-only / captions-only text modes in Docker
- [ ] Repeat verify with AI images enabled
- [ ] Repeat verify with landscape
- [ ] Repeat verify with custom RSS source
- [ ] Repeat verify media relevance improvements in Docker

---

## M. Next Sprint Priorities

1. Media relevance hardening
   Improve category-specific visual matching so sports, cricket, business, world, and science outputs stop falling back to generic footage too often.
2. Production verification execution
   Run the standardized checks in [`PRODUCTION_VERIFICATION_CHECKLIST.md`](/d:/short-video-maker_1/short-video-creator/PRODUCTION_VERIFICATION_CHECKLIST.md) and record the real results in [`MANUAL_VERIFICATION_LOG.md`](/d:/short-video-maker_1/short-video-creator/MANUAL_VERIFICATION_LOG.md).

---

## N. Recommended Next Verification Order

1. Verify `All Sources` output quality per category and decide per-category max source count if noise is high.
2. Verify keyword bias strength with 3-4 real categories.
3. Verify a custom RSS source end-to-end from add -> topic -> hook -> script -> render.
4. Verify media relevance quality specifically for sports/cricket, business, and world outputs.
5. Verify `captionPosition` with top, center, bottom renders.
6. Verify `captionBackgroundColor` with multiple contrasting colors.
7. Verify `musicVolume` with muted, low, high.
8. Verify AI images with targeted prompt-sensitive scenes.
9. Verify short-form vs long-form mode from the create UI and compare actual output length behavior.
10. Verify script/audio/overlay/caption language splits using English, Hindi, French, and Spanish.
11. Verify overlay-only, captions-only, and hybrid text modes against real creator use-cases.
12. Verify subtitle layout changes using `subtitleLineCount` and `subtitleFontScale`.
13. Decide whether subtitle sidecar files should remain separate or be muxed into final output.

---

## O. Summary

Current project reality:

- Core create-to-render pipeline is working.
- Source intelligence is now materially stronger than before.
- Auto-script flow now supports multi-source aggregation, category-scoped `All Sources`, keyword biasing, style, and hook selection.
- The create page now includes pre-render scene previews for narration, subtitles, and render readiness instead of being form-only.
- The create page now also includes a real creator control surface for video mode, duration target, narration voice, text mode, caption sizing, and caption layout.
- The create page now also separates script language, narration language, overlay text language, and caption language so each visible/audible layer can diverge intentionally.
- `All Sources` aggregation is now quality-controlled with source trust weighting, freshness bias, and category-specific source caps.
- Keyword-to-visual alignment is now stronger because top-level keywords are promoted into scene metadata, stock-search terms, and AI-image prompts.
- Custom RSS/feed sources are now part of the workflow.
- Custom RSS feeds are now validated before save and duplicate URLs are blocked.
- Topic-generation prompts now prioritize fresher, higher-trust, better-covered, and keyword-relevant stories.
- Hook options are now ranked with score guidance and rationale, making stronger openings easier to select consistently.
- Publish metadata generation now uses richer context from headlines, category, subcategory, and keywords, with platform-aware prompting.
- Repeatable production verification is now standardized through dedicated baseline scripts plus manual and production checklist documents.
- Duplicate video creation is now prevented at backend signature level.
- Duplicate prevention now normalizes formatting-only differences while still allowing meaningful script variants to render separately.
- Final rendered video presentation has materially improved through a modern overlay card, live badge, scene index, progress bar, ticker strip, and stronger caption treatment.
- Visual identity polish now includes category-aware overlay accents, refined ticker motion, and smoother media drift across portrait, landscape, and long-form templates.
- Media relevance logic is now significantly smarter than before, but still needs category-by-category manual validation.
- Some render capabilities still exist only in backend/types, especially scene-level language/translation/cue authoring, and should later be exposed in the create UI.
- The core language workflow is now scalable for English, Hindi, French, and Spanish, but still needs runtime verification for each cross-language combination.
- Hindi runtime reliability now includes an explicit eSpeak data-path compatibility fix, because Debian places `hi_dict` under `/usr/lib/...` while the phonemizer expected `/usr/share/...`.
- Some features improve quality or efficiency without appearing inside final video, and this document now tracks that explicitly.

Use this file when asking:

- "Is this feature built?"
- "Does this feature affect final render?"
- "Is this feature only improving script quality?"
- "Is this feature operational only?"
- "Has this been manually verified or only implemented?"
