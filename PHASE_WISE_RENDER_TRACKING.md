# Phase-wise Render Tracking

## Purpose
This document tracks all video-related features phase by phase so it is always clear whether a feature is:

- present in frontend
- wired in backend
- reflected in final rendered video
- verified manually
- verified in Docker/runtime

This avoids the common confusion between:

- "feature exists in UI"
- "feature exists in backend"
- "feature actually appears in the final video"

---

## Status Legend

| Status | Meaning |
|---|---|
| `Not Started` | Feature not implemented |
| `UI Only` | Visible in frontend, not wired end-to-end |
| `Backend Only` | Supported in types/backend but not exposed in create UI |
| `Partial` | Wired but not fully reflected or not fully verified |
| `Implemented` | End-to-end wiring exists |
| `Verified` | Confirmed in live/manual flow |

---

## Phase Model

| Phase | Definition |
|---|---|
| `P0` | Inventory and classification |
| `P1` | Frontend field/control exists |
| `P2` | API/backend receives and uses it |
| `P3` | Render pipeline consumes it |
| `P4` | Final video visibly reflects it, or intentionally does not |
| `P5` | Manual verification completed |
| `P6` | Docker/runtime verification completed |

---

## Source Files

Primary code paths used for this tracking:

- [`src/ui/pages/VideoCreator.tsx`](/d:/short-video-maker_1/short-video-creator/src/ui/pages/VideoCreator.tsx)
- [`src/ui/components/video-creator/VideoConfigPanel.tsx`](/d:/short-video-maker_1/short-video-creator/src/ui/components/video-creator/VideoConfigPanel.tsx)
- [`src/ui/components/video-creator/SceneEditorList.tsx`](/d:/short-video-maker_1/short-video-creator/src/ui/components/video-creator/SceneEditorList.tsx)
- [`src/short-creator/ShortCreator.ts`](/d:/short-video-maker_1/short-video-creator/src/short-creator/ShortCreator.ts)
- [`src/short-creator/libraries/Whisper.ts`](/d:/short-video-maker_1/short-video-creator/src/short-creator/libraries/Whisper.ts)
- [`src/short-creator/libraries/Pexels.ts`](/d:/short-video-maker_1/short-video-creator/src/short-creator/libraries/Pexels.ts)
- [`src/short-creator/libraries/Remotion.ts`](/d:/short-video-maker_1/short-video-creator/src/short-creator/libraries/Remotion.ts)
- [`src/components/root/Root.tsx`](/d:/short-video-maker_1/short-video-creator/src/components/root/Root.tsx)
- [`src/components/videos/PortraitVideo.tsx`](/d:/short-video-maker_1/short-video-creator/src/components/videos/PortraitVideo.tsx)
- [`src/components/videos/LandscapeVideo.tsx`](/d:/short-video-maker_1/short-video-creator/src/components/videos/LandscapeVideo.tsx)
- [`src/components/videos/LongFormVideo.tsx`](/d:/short-video-maker_1/short-video-creator/src/components/videos/LongFormVideo.tsx)
- [`src/types/shorts.ts`](/d:/short-video-maker_1/short-video-creator/src/types/shorts.ts)
- [`main-tiny.Dockerfile`](/d:/short-video-maker_1/short-video-creator/main-tiny.Dockerfile)

---

## A. Core Create-to-Render Features

| Feature | Frontend | Backend | Render pipeline | Visible in final video | Current status | Notes |
|---|---:|---:|---:|---:|---|---|
| Scene text | Yes | Yes | Yes | Yes | `Verified` | Drives TTS narration and captions |
| Headline | Yes | Yes | Yes | Yes | `Verified` | Used in top banner / chapter label |
| Search terms | Yes | Yes | Yes | No | `Verified` | Selects stock media; not shown as text |
| Visual prompt | Yes | Yes | Yes | Indirect | `Partial` | Used only when AI images are enabled |
| Orientation | Yes | Yes | Yes | Yes | `Verified` | Selects portrait vs landscape composition |
| Voice | Yes | Yes | Yes | Indirect | `Verified` | Affects narration, not an on-screen element |
| Music mood | Yes | Yes | Yes | Indirect | `Implemented` | Selects background track |
| Music volume | Yes | Yes | Yes | Indirect | `Implemented` | Affects background music level |
| Caption position | Yes | Yes | Yes | Yes | `Implemented` | Changes caption placement |
| Caption background color | Yes | Yes | Yes | Yes | `Implemented` | Changes active caption highlight |
| Padding back | Yes | Yes | Yes | Indirect | `Implemented` | Extends ending hold duration |
| AI images toggle | Yes | Yes | Yes | Yes | `Implemented` | Switches AI image vs stock video path |
| Auto-generated captions | No direct field | Yes | Yes | Yes | `Verified` | Generated through Whisper |
| Subtitle sidecar files (`.srt/.vtt`) | No direct field | Yes | Yes | No direct embed | `Implemented` | Files are created; final MP4 uses on-screen captions, not hard subtitle muxing |

---

## B. Backend-supported Render Features Not Fully Exposed in Create UI

| Feature | Frontend | Backend | Render pipeline | Visible in final video | Current status | Notes |
|---|---:|---:|---:|---:|---|---|
| Video type (`short` / `long`) | No direct create-page control | Yes | Yes | Yes | `Backend Only` | Long-form composition exists but create page does not expose it |
| Duration limit | No direct create-page control | Yes | Yes | Indirect | `Backend Only` | Controls auto-splitting logic |
| Scene language | Not exposed in normal create form | Yes | Yes | Indirect | `Backend Only` | Used for TTS/Whisper language path |
| Translation target | Not exposed in normal create form | Yes | Partial | Indirect | `Backend Only` | Supported in types/TTS adapter path |
| Scene cues | Not exposed in normal create form | Yes | Partial | Partial | `Backend Only` | Present in schema, limited consumption |
| Long-form chaptering | No direct create-page control | Yes | Yes | Yes | `Partial` | Exists in `LongFormVideo`, but not normal create flow |

---

## C. Auto-Script Features

| Feature | Frontend | Backend | Render pipeline | Visible in final video | Current status | Notes |
|---|---:|---:|---:|---:|---|---|
| Category selection | Yes | Yes | No | No | `Implemented` | Filters source/script generation only |
| News source selection | Yes | Yes | No | No | `Implemented` | Used only for script generation |
| Auto-script generation | Yes | Yes | Indirect | Indirect | `Implemented` | Produces scenes that later render |
| AI LLM integration | Yes | Yes | Indirect | Indirect | `Implemented` | Affects generated text, not direct visual layer |
| Quick summary panel | Yes | No | No | No | `UI Only` | Summary display only |

---

## D. Video Details / Watch Flow

| Feature | Frontend | Backend | Render pipeline | Visible in final video | Current status | Notes |
|---|---:|---:|---:|---:|---|---|
| Status polling | Yes | Yes | No | No | `Verified` | Processing / ready / failed |
| Embedded video player | Yes | Yes | No | No | `Verified` | Plays final MP4 |
| Download button | Yes | Yes | No | No | `Verified` | Streams completed MP4 |
| Failure alert | Yes | Yes | No | No | `Verified` | Runtime status only |

---

## E. Queue / Publish / Operations Features

These are integrated features, but they do not directly appear inside the rendered MP4.

| Feature group | Frontend | Backend | Affects final video asset | Current status | Notes |
|---|---:|---:|---:|---|---|
| Bulk queue | Yes | Yes | Indirect | `Implemented` | Controls job scheduling, not video visuals |
| Scheduler | Yes | Yes | Indirect | `Implemented` | Controls when videos are created/published |
| Publish dashboard | Yes | Yes | No | `Implemented` | Distribution layer only |
| Analytics dashboard | Yes | Yes | No | `Implemented` | Reporting only |
| A/B testing | Yes | Yes | No | `Implemented` | Title/thumbnail performance, not render layer |
| AI monitoring | Yes | Yes | No | `Implemented` | Observability only |
| Health dashboard | Yes | Yes | No | `Implemented` | Ops visibility only |
| Tenant console | Yes | Yes | No | `Implemented` | Platform/tenant management only |
| Content tools | Yes | Yes | Partial | `Partial` | Depends on which tool output is actually fed into scene data |

---

## F. Runtime Reliability Features

| Feature | Frontend | Backend | Render impact | Current status | Notes |
|---|---:|---:|---:|---|---|
| Whisper asset path stability | No | Yes | Critical | `Verified` | Fixed by moving install path away from mounted `/app/data` in `main-tiny.Dockerfile` |
| Caption failure fallback | No | Yes | Critical | `Verified` | Render continues even if caption generation fails |
| Base video ID render path | No | Yes | Critical | `Verified` | Fixed missing-subtitle-language bug so requested ID is rendered |
| Docker runtime boot | No | Yes | Critical | `Verified` | Clean startup now uses bundled Whisper path |

---

## G. Verification Matrix

### G1. Fully Verified Render Features

- Scene text -> narration
- Scene text -> captions
- Headline -> overlay
- Orientation -> portrait/landscape composition
- Voice -> narration change
- Whisper transcription path
- Caption generation
- Video details status path
- Base output video ID generation

### G2. Implemented But Should Still Be Manually Re-checked

- Music mood variation across multiple renders
- Music volume level differences
- Caption position across portrait and landscape
- Caption background color on all templates
- AI images flow with `useAiImages = true`
- Long-form render path
- Duration-limit auto-splitting
- Scene cues and B-roll mix behavior

### G3. Present But Not Render-visible By Design

- Category picker
- News source picker
- Quick summary panel
- Queue dashboards
- Publish dashboards
- Analytics dashboards
- A/B testing dashboards
- Health dashboards
- Tenant dashboards

---

## H. Phase-wise Execution Checklist

### Phase P0: Inventory
- [x] Identify all create-flow fields
- [x] Identify backend-only render fields
- [x] Identify non-render integrated features
- [x] Separate visible vs indirect vs non-render features

### Phase P1: Frontend Presence
- [x] Scene fields
- [x] Config fields
- [x] Auto-script controls
- [x] Video watch/download flow
- [x] Queue/publish/analytics ops pages

### Phase P2: Backend Wiring
- [x] Create video request schema
- [x] ShortCreator scene processing
- [x] TTS / Whisper / Pexels / Remotion integration
- [x] Status API
- [x] Temporary media serving

### Phase P3: Render Wiring
- [x] Portrait template
- [x] Landscape template
- [x] Long-form template
- [x] Captions
- [x] Headline overlays
- [x] Audio + music composition
- [x] AI image / stock media path

### Phase P4: Visible Output Validation
- [x] Narration visible as final audio output
- [x] Captions visibly rendered
- [x] Headline visibly rendered
- [x] Orientation visibly rendered
- [x] Background media visibly rendered
- [ ] AI image output visually verified
- [ ] Long-form output visually verified
- [ ] Cue-driven render visibly verified

### Phase P5: Manual Verification
- [x] Live create request successfully enters render
- [x] Video no longer fails on first-scene Whisper issue
- [x] Docker runtime generates playable MP4
- [ ] Verify music mood differences manually
- [ ] Verify caption position top / center / bottom manually
- [ ] Verify AI image prompt quality manually
- [ ] Verify long-form manual flow

### Phase P6: Docker Verification
- [x] Runtime starts with bundled Whisper path
- [x] Video creation works in Docker
- [x] Captions work in Docker
- [x] MP4 is written into `/app/data/videos`
- [ ] Repeat verify with AI images enabled
- [ ] Repeat verify with landscape
- [ ] Repeat verify with long-form

---

## I. Recommended Next Verification Order

1. Verify `captionPosition` with top, center, bottom renders.
2. Verify `captionBackgroundColor` with 2-3 distinct colors.
3. Verify `musicVolume` with muted, low, high.
4. Verify `AI images` with prompt-sensitive scenes.
5. Expose and verify `videoType` in create UI.
6. Expose and verify `durationLimit` in create UI.
7. Decide whether subtitle sidecar files should also be muxed into final output or remain separate assets.
8. Decide whether `scene.cues` should be promoted to the frontend create flow.

---

## J. Summary

Current reality of the project:

- Core create-to-render pipeline is wired.
- Most user-facing render controls are working.
- Some important render capabilities exist only in backend/types and are not exposed in the create page.
- Several integrated dashboards are real features, but they are not part of the final video visuals.
- Docker/runtime stability issues around Whisper were a root cause of false "video failed" cases and have now been addressed.

Use this file as the source of truth when asking:

- "Is this feature built?"
- "Is this feature rendered?"
- "Is this feature only UI?"
- "Has this feature been verified in Docker?"
