# Production Verification Checklist

## Purpose
This is the release-style verification checklist for the full short-video pipeline.

Use it when we want confidence that the current build is production-ready across:
- create
- auto-script
- render
- dedupe
- publish
- custom RSS sources
- Docker runtime

This checklist is stricter than [`MANUAL_VERIFICATION_CHECKLIST.md`](/d:/short-video-maker_1/short-video-creator/MANUAL_VERIFICATION_CHECKLIST.md). It is intended for milestone validation, not quick UI smoke tests.

---

## 1. Automated Gate

Run in this order:

1. `npm run verify:baseline`
2. `npm run verify:production`

Pass criteria:
- [ ] Typecheck passes
- [ ] Vitest suite passes
- [ ] Build passes

If any automated gate fails, stop here and fix before continuing.

---

## 2. Environment Gate

- [ ] Confirm `.env` / runtime config is present
- [ ] Confirm AI model endpoint is reachable
- [ ] Confirm Pexels key is configured if stock media is expected
- [ ] Confirm Docker containers are healthy if testing Docker flow
- [ ] Confirm output directories are writable

Docker commands:
- [ ] `docker compose build short-creator`
- [ ] `docker compose up -d short-creator`
- [ ] `docker compose logs short-creator --tail 100`

---

## 3. Create and Auto-script Gate

### Scenario A: Multi-source topic generation
- [ ] Open `/create`
- [ ] Select a category
- [ ] Select 2-4 sources
- [ ] Add keyword bias
- [ ] Run `Auto`
- [ ] Confirm trending topics load
- [ ] Confirm hook options load
- [ ] Confirm hook score/rationale is visible

Pass criteria:
- [ ] No crash
- [ ] Topic quality looks category-relevant
- [ ] Hook options look distinct
- [ ] Keywords appear to influence topic/hook quality

### Scenario B: `All Sources`
- [ ] Select `All Sources`
- [ ] Run `Auto`
- [ ] Confirm results return successfully
- [ ] Confirm noise level is still acceptable

Pass criteria:
- [ ] No empty results
- [ ] No obvious category drift
- [ ] No major performance stall

### Scenario C: Custom RSS source
- [ ] Add a valid custom source
- [ ] Confirm it persists
- [ ] Generate topics from it
- [ ] Try invalid source and confirm readable failure
- [ ] Try duplicate feed and confirm duplicate blocking

Pass criteria:
- [ ] Validation works
- [ ] Source persists
- [ ] Source is usable end-to-end

---

## 4. Render Gate

### Scenario A: Standard short render
- [ ] Generate a script
- [ ] Create a video
- [ ] Track `/video/:videoId`
- [ ] Confirm final state is `ready`
- [ ] Confirm MP4 plays correctly

Pass criteria:
- [ ] No failed render
- [ ] Audio present
- [ ] Captions present
- [ ] Headline overlay visible
- [ ] `Live` badge visible
- [ ] Scene progress visible
- [ ] Lower ticker visible

### Scenario B: Visual quality spot-check
- [ ] Check scene 1 opening
- [ ] Check hook strength in first line
- [ ] Check media relevance
- [ ] Check ticker pacing
- [ ] Check overlay theme/accent appropriateness

Pass criteria:
- [ ] Opening feels strong
- [ ] Media is not obviously generic for the category
- [ ] Overlay styling feels consistent

### Scenario C: Variant render checks
- [ ] Landscape render
- [ ] AI image render
- [ ] Different caption positions
- [ ] Different caption highlight color

Pass criteria:
- [ ] No layout break
- [ ] No unreadable captions
- [ ] No render crash in variant mode

---

## 5. Dedupe Gate

### Scenario A: Exact duplicate
- [ ] Submit identical content twice
- [ ] Confirm same `videoId` is reused

### Scenario B: Formatting-only difference
- [ ] Change spacing/case only
- [ ] Confirm same `videoId` is reused

### Scenario C: Meaningful variant
- [ ] Change hook/topic/scene content materially
- [ ] Confirm new `videoId` is created

Pass criteria:
- [ ] Exact duplicates do not re-render
- [ ] Real variants still produce new renders

---

## 6. Publish Gate

### Scenario A: Metadata autofill
- [ ] Open `/publish`
- [ ] Select one rendered video
- [ ] Select platform(s)
- [ ] Confirm metadata autofill succeeds
- [ ] Confirm context chips show category/subcategory/keywords/headlines

Pass criteria:
- [ ] Suggested metadata is populated
- [ ] Titles are platform-appropriate
- [ ] Description/caption uses the right context
- [ ] Tags/hashtags are not empty

### Scenario B: Publish job
- [ ] Submit publish job
- [ ] Confirm job appears in tracker
- [ ] Confirm duplicate publish guard works on retry

Pass criteria:
- [ ] Publish enqueue works
- [ ] Duplicate published asset is blocked

---

## 7. Docker Gate

- [ ] Latest UI is visible after rebuild
- [ ] Auto-script still works in Docker
- [ ] Render still works in Docker
- [ ] Output MP4 exists in `/app/data/videos`
- [ ] No obvious container boot/runtime errors

Pass criteria:
- [ ] Docker behavior matches local verified behavior

---

## 8. Sign-off Summary

Record final decision:
- [ ] Ready for release
- [ ] Ready with known limitations
- [ ] Not ready

Required summary fields:
- Date:
- Build verified:
- Docker verified:
- Flows passed:
- Known issues:
- Next follow-up:
