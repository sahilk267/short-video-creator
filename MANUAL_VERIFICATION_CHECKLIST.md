# Manual Verification Checklist

## Purpose
This checklist is for quick browser-based verification of important app flows.

Use it after meaningful frontend changes so we can confirm:
- routes open correctly
- major actions still work
- loading/error states look correct
- old features were not disturbed

---

## Current Status
- Checklist prepared
- Manual browser pass not yet completed

---

## Core Routes To Verify

### 1. Video List
- [ ] Open `/`
- [ ] Confirm page loads without crash
- [ ] Confirm existing videos list appears or empty state appears
- [ ] Confirm "Create New Video" button works

### 2. Video Creator
- [ ] Open `/create`
- [ ] Confirm page loads without crash
- [ ] Confirm scene editor renders
- [ ] Confirm config panel renders
- [ ] Confirm auto-script section renders
- [ ] Confirm create action form is usable

### 3. Video Details
- [ ] Open `/video/:videoId` using a valid existing id
- [ ] Confirm status section renders
- [ ] Confirm loading state works
- [ ] Confirm ready/processing/failed state is sensible

### 4. Bulk Queue
- [ ] Open `/queue`
- [ ] Confirm page loads without crash
- [ ] Confirm queue state section renders
- [ ] Confirm refresh action works
- [ ] Confirm queue submit action works

### 5. Category Mapping
- [ ] Open `/mappings`
- [ ] Confirm page loads without crash
- [ ] Confirm existing mappings render or empty state appears
- [ ] Confirm save mapping action works

### 6. Publish Dashboard
- [ ] Open `/publish`
- [ ] Confirm stepper loads correctly
- [ ] Confirm video/platform selection works
- [ ] Confirm metadata/schedule UI renders

### 7. Analytics Dashboard
- [ ] Open `/analytics`
- [ ] Confirm KPI and chart sections render
- [ ] Confirm date filter works
- [ ] Confirm empty/error/loading states look correct

### 8. Scheduler Dashboard
- [ ] Open `/scheduler`
- [ ] Confirm queue health renders
- [ ] Confirm auto-refresh controls render
- [ ] Confirm empty state looks correct when no jobs exist

### 9. A/B Testing Dashboard
- [ ] Open `/ab-testing`
- [ ] Confirm page loads without crash
- [ ] Confirm table/cards/forms render correctly

### 10. AI Dashboard
- [ ] Open `/ai`
- [ ] Confirm auto-refresh controls render
- [ ] Confirm telemetry/summary cards render
- [ ] Confirm empty state looks correct when no data exists

### 11. Health Dashboard
- [ ] Open `/health`
- [ ] Confirm queue cards render
- [ ] Confirm worker, database, Redis, system sections render
- [ ] Confirm alerts and slow-requests sections render
- [ ] Confirm refresh controls work

### 12. Tenant Console
- [ ] Open `/tenants`
- [ ] Confirm tenant list/details render
- [ ] Confirm no crash on initial load

### 13. Content Tools
- [ ] Open `/content-tools`
- [ ] Confirm page loads without crash
- [ ] Confirm tools/forms render correctly

---

## Cross-Cutting Checks
- [ ] Top navigation works across main routes
- [ ] Lazy-loaded pages open correctly after navigation
- [ ] Hover/focus prefetch does not cause visible issues
- [ ] Error state UI is readable
- [ ] Empty state UI is readable
- [ ] Layout works on a narrower viewport

---

## Verification Notes
- Full automated verification is already passing
- Current automated status:
  - `pnpm test -- --runInBand` passed
  - `pnpm exec tsc -p tsconfig.build.json --noEmit` passed
  - `pnpm run build` passed

Manual verification is the final confidence layer for real UI usage.
