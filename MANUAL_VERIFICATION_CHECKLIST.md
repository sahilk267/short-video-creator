# Manual Verification Checklist

## Purpose
This checklist is the browser-facing verification layer for the current pipeline.

Use it after meaningful changes to:
- auto-script flow
- render pipeline
- publish flow
- dedupe logic
- custom source handling

Automated checks catch regressions in code paths. This checklist confirms the real UI and runtime behavior still make sense.

---

## Required Automated Baseline First

Run these before any manual pass:
- [ ] `npm run verify:baseline`
- [ ] If release candidate or Docker change: `npm run verify:production`

Record the result in [`MANUAL_VERIFICATION_LOG.md`](/d:/short-video-maker_1/short-video-creator/MANUAL_VERIFICATION_LOG.md).

---

## A. Core Create Flow

### 1. Video List
- [ ] Open `/`
- [ ] Confirm page loads without crash
- [ ] Confirm existing videos list appears or empty state appears
- [ ] Confirm "Create New Video" action opens `/create`

### 2. Create Page Load
- [ ] Open `/create`
- [ ] Confirm scene editor renders
- [ ] Confirm video config panel renders
- [ ] Confirm auto-script section renders without layout break
- [ ] Confirm quick summary updates when inputs change

### 3. Multi-source Auto-script
- [ ] Select a category
- [ ] Select 2 or more sources
- [ ] Confirm `All Sources` option works
- [ ] Confirm keyword field accepts comma-separated values
- [ ] Click `Auto`
- [ ] Confirm trending topics load
- [ ] Confirm hook options load
- [ ] Confirm hook score/rationale is visible

### 4. Custom RSS Source
- [ ] Add a valid custom RSS/feed source
- [ ] Confirm it appears in the source list immediately
- [ ] Confirm it can be selected
- [ ] Try adding the same feed again and confirm validation blocks it
- [ ] Try an invalid feed URL and confirm readable error handling

### 5. Script Generation
- [ ] Generate script after selecting source/topic/style/hook
- [ ] Confirm scenes populate
- [ ] Confirm scene headline, keywords, subcategory, and search terms are filled
- [ ] Confirm keyword bias seems reflected in generated scene content

---

## B. Render Verification

### 6. Create Video
- [ ] Submit generated scenes
- [ ] Confirm navigation to `/video/:videoId`
- [ ] Confirm `processing` state appears first
- [ ] Confirm final status reaches `ready`

### 7. Final Video Output
- [ ] Confirm video plays
- [ ] Confirm captions are visible
- [ ] Confirm headline overlay is visible
- [ ] Confirm `Live` badge and `Scene x/y` labels are visible
- [ ] Confirm top progress bar is visible
- [ ] Confirm lower ticker strip is visible
- [ ] Confirm updated visual identity looks intentional

### 8. Render Quality Checks
- [ ] Confirm hook strength is reflected in scene 1 opening
- [ ] Confirm chosen topic is reflected across scenes
- [ ] Confirm stock media feels relevant for the category
- [ ] Confirm keyword bias seems reflected in visuals
- [ ] Confirm no obvious duplicate render was created for identical content

### 9. Variant Controls
- [ ] Re-test with `captionPosition = top`
- [ ] Re-test with `captionPosition = center`
- [ ] Re-test with `captionPosition = bottom`
- [ ] Re-test with a different `captionBackgroundColor`
- [ ] Re-test with `orientation = landscape`
- [ ] Re-test with `AI images = on`

---

## C. Publish Verification

### 10. Publish Dashboard Load
- [ ] Open `/publish`
- [ ] Confirm stepper renders correctly
- [ ] Confirm video selection works
- [ ] Confirm platform selection works

### 11. Metadata Autofill
- [ ] Select exactly one rendered video
- [ ] Select one or more platforms
- [ ] Confirm metadata autofill runs
- [ ] Confirm metadata context chips appear
- [ ] Confirm category/subcategory/keywords/headlines appear in context
- [ ] Confirm platform metadata looks plausible for selected platform

### 12. Publish Submission
- [ ] Fill/confirm required metadata
- [ ] Submit a publish job
- [ ] Confirm job appears in publish status tracking
- [ ] Confirm duplicate publish guard works if same asset/platform already published

---

## D. Operational Verification

### 13. Dedupe and Reliability
- [ ] Re-submit the exact same video content and confirm existing `videoId` is reused
- [ ] Re-submit a meaningfully changed version and confirm a new `videoId` is created
- [ ] Confirm video details page handles failed state cleanly if a job fails

### 14. Docker-specific Pass
- [ ] Rebuild image if code changed: `docker compose build short-creator`
- [ ] Restart app: `docker compose up -d short-creator`
- [ ] Confirm updated UI is visible
- [ ] Confirm rendered MP4 writes to `/app/data/videos`
- [ ] Confirm latest verified flow still works in Docker, not just local tests

---

## E. Cross-cutting UI Checks

- [ ] Top navigation works across main routes
- [ ] Lazy-loaded pages open correctly after navigation
- [ ] Loading states are readable
- [ ] Error states are readable
- [ ] Empty states are readable
- [ ] Layout works on a narrower viewport

---

## Verification Notes

- Use [`PRODUCTION_VERIFICATION_CHECKLIST.md`](/d:/short-video-maker_1/short-video-creator/PRODUCTION_VERIFICATION_CHECKLIST.md) for release-style end-to-end verification.
- Use [`MANUAL_VERIFICATION_LOG.md`](/d:/short-video-maker_1/short-video-creator/MANUAL_VERIFICATION_LOG.md) to record actual results.
