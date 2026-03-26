# Frontend React UI Codebase Inventory

## Overview
Complete architectural analysis of all React pages, components, and user-facing features in the Short Video Creator application. This document maps each UI page to its backend API dependencies, user interactions, and data flows.

---

## 1. Routing Structure

**Entry Point:** [src/ui/App.tsx](src/ui/App.tsx)
**Layout:** [src/ui/components/Layout.tsx](src/ui/components/Layout.tsx)
**Framework:** React Router v6

| Route Path | Page Component | Purpose |
|----------|--------|---------|
| `/` | VideoList | Home - browse all created videos |
| `/create` | VideoCreator | Narrative interface for creating new videos |
| `/video/:videoId` | VideoDetails | Watch, monitor, and download created videos |
| `/queue` | BulkQueue | Manage batch render jobs and queue states |
| `/mappings` | CategoryMapping | Configure channel-to-category mappings |

---

## 2. Layout Component

**File:** [src/ui/components/Layout.tsx](src/ui/components/Layout.tsx)

### Purpose
Shared wrapper for all pages providing navigation, theming, and branding.

### Features
- **Navigation Bar:** Logo (VideoIcon), home link, "Create Video" button
- **Theme:** Material-UI light theme (primary: #1976d2, secondary: #f50057)
- **Typography:** Roboto font family
- **Layout:** Flexbox with header, content area (flexGrow), and footer

### User Actions
- Click logo to return home
- Click "Create Video" button to navigate to /create
- Footer displays copyright year

### Backend API Calls
None (purely presentational)

---

## 3. Page: VideoList

**File:** [src/ui/pages/VideoList.tsx](src/ui/pages/VideoList.tsx)
**Route:** `/`
**Purpose:** Home page - display all created videos with status and management options

### Data Display
| Field | Source | Type | Display Logic |
|-------|--------|------|--------|
| Video ID | `/api/short-videos` | string | Truncated to first 8 chars: "Video XXXXXXXX..." |
| Status | `/api/short-videos` | enum: ready \| processing \| failed \| unknown | Color-coded: green (ready), blue (processing), red (failed), gray (unknown) |
| Video Count | `/api/short-videos` | array.length | Conditional rendering - empty state vs. list |

### User Actions
1. **Create New Video** → Navigate to `/create`
2. **View Video** → Click list item → Navigate to `/video/:videoId`
3. **Play Video** → Click play icon (appears only if status === 'ready') → Navigate to `/video/:videoId`
4. **Delete Video** → Click delete icon → Confirm delete → Remove from list

### Backend API Calls

| Method | Endpoint | Trigger | Purpose | On Success | On Error |
|--------|----------|---------|---------|-----------|----------|
| GET | `/api/short-videos` | Component mount, after delete | Fetch all videos | Update state with videos list, hide loading spinner | Show error alert, hide spinner |
| DELETE | `/api/short-video/:videoId` | Delete icon click | Delete a video | Refetch video list | Show error toast |

### UI States
- **Loading:** CircularProgress spinner, centered
- **Error:** Alert with message
- **Empty:** Paper card with message and "Create Your First Video" button
- **Populated:** Material List with dividers, hover effects, secondary actions

### Missing Connections
- No filtering by status
- No pagination (loads all videos at once)
- No search/sort functionality
- No video metadata display (creation date, duration, etc.)

---

## 4. Page: VideoCreator

**File:** [src/ui/pages/VideoCreator.tsx](src/ui/pages/VideoCreator.tsx)
**Route:** `/create`
**Purpose:** Comprehensive video creation wizard with AI-powered auto-scripting

### Form Structure

#### Scenes Section (Repeatable)
| Field | Type | Required | Options | Purpose |
|-------|------|----------|---------|---------|
| Text | TextField | Yes | Free text | Main narrative content for scene |
| Search Terms | TextField | No | Comma-separated | Keywords for image/video search |
| Headline | TextField | No | Free text | Scene title (optional, used in overlays) |
| Visual Prompt | TextField | No | Free text | AI image generation guidance |

### Configuration Section
| Field | Type | Default | Options | Purpose |
|-------|------|---------|---------|---------|
| Padding Back | Number | 1500 | 0-10000 (ms) | Post-video silence duration |
| Music Mood | Select | chill | [MusicMoodEnum values] | Selects music track category |
| Caption Position | Select | bottom | top \| center \| bottom | Where captions appear |
| Caption BG Color | TextField | blue | CSS color values | Caption background color |
| Voice | Select | af_heart | [VoiceEnum values from API] | Narration voice |
| Orientation | Select | portrait | portrait \| landscape | Video aspect ratio |
| Music Volume | Select | high | [MusicVolumeEnum values] | Background music level |

### Data Sources
| Data | Endpoint | Fetched On | Usage |
|------|----------|-----------|-------|
| Voices | `/api/voices` | Component mount | Populate voice dropdown |
| Music Tags | `/api/music-tags` | Component mount | Populate music mood dropdown |
| News Sources | `/api/news-sources` | Component mount | Populate source dropdown (auto-script) |

### User Actions

#### Manual Scene Creation
1. **Add Scene** → Click "+" button → New scene form appended
2. **Remove Scene** → Click "X" button on scene → Remove from array (disabled if only 1 scene)
3. **Edit Scene** → Modify any field → Update state
4. **Submit** → Click "Create Video" button → POST to `/api/short-video`

#### Auto-Scripting (AI with Ollama)
1. **Select News Source** → Choose from dropdown
2. **Select Category** → Predefined: "World" (shown in code)
3. **Click "Auto-Script"** → POST `/api/auto-script` with sourceId
4. **Response Processing:** 
   - Receive scenes array with: text, searchTerms, headline, visualPrompt
   - Parse searchTerms array → join with ", "
   - Populate all scene fields
5. **Edit Generated Script** → User can now modify

### Backend API Calls

| Method | Endpoint | Trigger | Payload | On Success | On Error |
|--------|----------|---------|---------|-----------|----------|
| GET | `/api/voices` | Component mount | - | setVoices() | Error alert: "Failed to load voices" |
| GET | `/api/music-tags` | Component mount | - | setMusicTags() | Error alert: "Failed to load music options" |
| GET | `/api/news-sources` | Component mount | - | setSources() | Error alert: "Failed to load voices and music options" |
| POST | `/api/auto-script` | "Auto-Script" button click | `{ sourceId: string }` | Parse scenes, populate form | Error alert with message + raw AI output if available |
| POST | `/api/short-video` | "Create Video" button click | `{ scenes: SceneInput[], config: RenderConfig }` | Navigate to `/video/:videoId` | Error alert: "Failed to create video" |

### SceneInput Format (API Payload)
```typescript
{
  text: string;           // Main scene text (required)
  headline?: string;      // Scene title (optional)
  visualPrompt?: string;  // Image prompt (optional)
  searchTerms: string[];  // Keywords split, trimmed, filtered (required array, can be empty)
}
```

### RenderConfig Format
```typescript
{
  paddingBack: number;                    // ms of silence after video
  music: MusicMoodEnum;                   // Music category
  captionPosition: CaptionPositionEnum;   // top|center|bottom
  captionBackgroundColor: string;         // CSS color
  voice: VoiceEnum;                       // Voice selection
  orientation: OrientationEnum;           // portrait|landscape
  musicVolume: MusicVolumeEnum;           // Volume level
}
```

### UI States
- **Loading Options:** CircularProgress, disabled form
- **Auto-Script Loading:** Button shows "Generating..." (autoLoading state)
- **Form Submission:** Button shows "Creating..." (loading state)
- **Error:** Red Alert box with error message + raw AI output (if available)
- **Success:** User redirected to `/video/:videoId`

### Data Validation
- Form submission parses searchTerms by comma splitting, trims whitespace, filters empty strings
- Headlines and visual prompts are trimmed or undefined if empty
- No client-side validation on text length

### Missing Connections
- No preview of generated script before submission
- No voice/music preview
- No validation of scene count (allows 1+ scenes)
- No progress indicator during video creation
- Auto-script error shows raw JSON output (debugging feature?)

---

## 5. Page: VideoDetails

**File:** [src/ui/pages/VideoDetails.tsx](src/ui/pages/VideoDetails.tsx)
**Route:** `/video/:videoId`
**Purpose:** Watch and manage a specific video, monitor processing status

### Data Display

| Field | Source | Polling | Display |
|-------|--------|---------|---------|
| Video ID | URL params | - | Full ID displayed in card |
| Status | `/api/short-video/:videoId/status` | Every 5 seconds | Determines content rendering |
| Video File | `/api/short-video/:videoId` | - | Embedded <video> element (controls, autoPlay) |

### User Actions
1. **Go Back** → Click "Back to videos" button → Navigate to `/`
2. **Download** → Click "Download Video" button (shown only if status === 'ready') → Browser download via anchor tag
3. **Monitor Progress** → Page auto-refreshes status every 5 seconds while processing

### Backend API Calls

| Method | Endpoint | Trigger | Purpose | On Success | On Error |
|--------|----------|---------|---------|-----------|----------|
| GET | `/api/short-video/:videoId/status` | Component mount + interval (5s) | Poll video status | Update status state, clear interval if done | Show error alert, clear interval |
| GET | `/api/short-video/:videoId` | Download link click | Stream video file | Trigger browser download | N/A (browser handles) |

### Status States & UI Rendering

| Status | UI Rendering | Auto-Poll? | Actions Available |
|--------|--------------|-----------|-------------------|
| `processing` | Loading spinner + "Your video is being created..." message | ✓ Yes (5s interval) | None |
| `ready` | Video player (controls, autoPlay), download button | ✗ No (interval cleared) | Download, Watch, Back |
| `failed` | Red alert: "Video processing failed. Please try again..." | ✗ No (interval cleared) | Back to list |
| `unknown` | Blue alert: "Unknown video status. Please refresh..." | ✗ No (interval cleared) | Back to list |

### Video Player Details
- **Format:** HTML5 `<video>` element
- **Controls:** Built-in browser controls (play, pause, volume, fullscreen, progress bar)
- **Autoplay:** Enabled
- **Styling:** 56.25% aspect ratio padding (16:9 cinematic), absolute positioning
- **Background:** Black (#000)

### Performance Optimizations
- Uses `useRef` to track component mount state (prevents state updates after unmount)
- Clears interval on unmount
- Clears interval when status changes to non-processing states

### Missing Connections
- No video metadata display (render time, file size, creator info)
- No sharing options
- No publish-to-platform button
- No editing capabilities
- No error details (if failed, no reason shown)
- No progress percentage during rendering

---

## 6. Page: BulkQueue

**File:** [src/ui/pages/BulkQueue.tsx](src/ui/pages/BulkQueue.tsx)
**Route:** `/queue`
**Purpose:** Enqueue batch render jobs and monitor queue health

### Form Fields

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| Category | TextField | World | Video category for batch |
| Orientation | Select | portrait | portrait \| landscape |
| Language | TextField | en | Language code (e.g., "en", "es") |

### Queue Status Display

| Data | Source | Polling | Display |
|------|--------|---------|---------|
| Queue States | `/api/health/queue/states` | Manual ("Refresh States" button) | Key-value pairs: `status: count` |

### User Actions
1. **Set Category** → Type in Category field → Updates state
2. **Set Orientation** → Select from dropdown → Updates state
3. **Set Language** → Type in Language field → Updates state
4. **Enqueue Render Job** → Click button → POST `/api/queue/bulk` → Show success/error alert
5. **Refresh States** → Click "Refresh States" button → Refetch queue states

### Backend API Calls

| Method | Endpoint | Trigger | Payload | On Success | On Error |
|--------|----------|---------|---------|-----------|----------|
| POST | `/api/queue/bulk` | "Queue Render Job" button click | `{ sceneInput, orientation, category, videoType: "short", subtitleLanguage }` | Alert: "Queued render job: {renderJobId}", refresh queue states | Alert: "Failed to enqueue render job" |
| GET | `/api/health/queue/states` | Component mount + "Refresh States" button click | - | Update queueStates state | Alert: "Failed to load queue states" |

### SceneInput for Bulk Queue
```typescript
{
  text: "Auto queued item for {category}",        // Hardcoded template
  searchTerms: [category, "news"],                 // Category + "news" keyword
  language: language                               // User's language input
}
```

### UI States
- **Loading Queue States:** CircularProgress (size={20})
- **Submitting Job:** Button shows "Queueing..." (disabled)
- **Empty Queue:** "No queue state data yet." message
- **Populated Queue:** Typography rows: `status: count`

### Missing Connections
- No real-time queue updates (manual refresh only)
- Queue items are not automatically created; input is minimal
- No visualization of queue history or bottlenecks
- No pause/resume/cancel job capabilities
- No per-job status tracking

---

## 7. Page: CategoryMapping

**File:** [src/ui/pages/CategoryMapping.tsx](src/ui/pages/CategoryMapping.tsx)
**Route:** `/mappings`
**Purpose:** Configure which news categories map to which publishing channels

### Form Fields

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| Category | TextField | World | News category (e.g., "Tech", "World") |
| Platform | TextField | youtube | Publishing platform: youtube, telegram, instagram, facebook |
| Channel ID | TextField | "" | Platform-specific channel identifier |

### Existing Mappings Display
- **Source:** `/api/channel-configs`
- **Display:** Typography list: `{category} -> {platform} ({channelId})`

### User Actions
1. **Set Category** → Type category name → Updates state
2. **Set Platform** → Type platform name → Updates state
3. **Set Channel ID** → Type channel ID → Updates state
4. **Save Mapping** → Click "Save Mapping" button → POST to `/api/channel-configs`
5. **View Mappings** → Automatically loaded on mount, displays as text list

### Backend API Calls

| Method | Endpoint | Trigger | Payload | On Success | On Error |
|--------|----------|---------|---------|-----------|----------|
| GET | `/api/channel-configs` | Component mount + after save | - | Update mappings state | No error display (silent fail, setMappings([])) |
| POST | `/api/channel-configs` | "Save Mapping" button click | `{ category, platform, channelId }` | Clear input fields, refetch mappings | Alert: "{error from API}" |

### UI States
- **Loading:** No loading state shown (silent until loaded)
- **No Mappings:** "No mappings yet." message
- **Has Mappings:** List of Typography elements

### Data Structure
```typescript
interface MappingRecord {
  id: string;
  category: string;
  platform: string;
  channelId: string;
}
```

### Missing Connections
- No validation of platform names (accepts any string)
- No dropdown for platform selection (freetext)
- No edit existing mappings capability (create-only)
- No delete mappings capability
- GET error is silently ignored

---

## 8. Video Component: PortraitVideo

**File:** [src/components/videos/PortraitVideo.tsx](src/components/videos/PortraitVideo.tsx)
**Dimensions:** 1080x1920 (9:16 mobile vertical)
**FPS:** 25
**Framework:** Remotion (video composition library)

### Data Input (from shortVideoSchema)
```typescript
{
  scenes: {
    captions: Array<{ text, startMs, endMs }>
    video?: string                  // Video URL
    imageUrl?: string               // Fallback image URL
    audio: { url, duration }        // Scene audio
  }[],
  config: {
    captionPosition: "top"|"center"|"bottom"
    captionBackgroundColor: string   // CSS color
    paddingBack?: number             // End silence (ms)
    musicVolume: "mute"|"low"|"medium"|"high"
  },
  music: {
    url: string   // Audio stream URL
    start: number // Start time (seconds)
    end: number   // End time (seconds)
  }
}
```

### Rendering Logic
1. **Background Music** → Audio element loops across duration
2. **Per-Scene Sequences:**
   - Video or image as background
   - Captions overlaid with timing
   - Audio track for narration
3. **Caption Pages** → Split captions by line length (20 chars) and line count (1 line)
4. **Caption Styling:**
   - Background color (configurable)
   - Centered or top/bottom positioned
   - Bold, large font (black text with white outline)

### Features
- Auto-scaling of zoom on images (1x to 1.1x over duration)
- NewsOverlay component (headline, ticker)
- Music volume control
- Padding silence at end

### Missing Connections
- No dynamic text sizing based on caption length
- No scene transitions or effects
- No fade-in/fade-out

---

## 9. Video Component: LandscapeVideo

**File:** [src/components/videos/LandscapeVideo.tsx](src/components/videos/LandscapeVideo.tsx)
**Dimensions:** 1920x1080 (16:9 landscape)
**FPS:** 25
**Framework:** Remotion

### Rendering Logic
- Similar to PortraitVideo but optimized for landscape
- Caption line max length: 30 chars (vs 20 for portrait)
- Line count: 1 line
- Caption positioning: top/center/bottom
- NewsOverlay component integration

### Features
- Scenes map to visual B-roll + audio
- Music loops with configurable volume
- Bottom captions with timing
- Image zoom-in effect (1x to 1.1x)

---

## 10. Video Component: LongFormVideo

**File:** [src/components/videos/LongFormVideo.tsx](src/components/videos/LongFormVideo.tsx)
**Dimensions:** 1920x1080 (16:9 landscape)
**FPS:** 25
**Framework:** Remotion
**Purpose:** YouTube-style long-form content (10+ minutes) with chapters

### Data Input
- Same shortVideoSchema as other video types
- Scene headlines become chapter labels

### Rendering Logic
1. **Dark Theme Background:** Black (#0a0a0a)
2. **Per-Scene Chapter:**
   - Chapter label (top-left) with fade animations
   - Scene media (video or image) centered
   - Gradient overlay (dark at bottom for readability)
3. **Bottom Captions:**
   - Line max length: 32 chars (wider for long-form)
   - Line count: 2 lines per caption block
   - Time-aligned with caption pages
4. **Background Music** → Loops across entire duration

### Features
- Chapter numbering with optional headlines
- Fade-in/fade-out of chapter labels
- Gradient overlay for text readability
- 2-line caption support (vs 1 for shorts)
- Dark theme optimized for long viewing

### Missing Connections
- No chapter markers/timestamps saved
- No dynamic chapter duration calculation

---

## 11. Component: NewsOverlay

**File:** [src/components/videos/NewsOverlay.tsx](src/components/videos/NewsOverlay.tsx)
**Framework:** Remotion
**Purpose:** Render news-style breaking news banner + ticker tape

### Features
1. **Top Breaking News Banner**
   - Red background (#cc0000)
   - White border-left
   - "Breaking News" label
   - Headline text in white box below label
   - Slide-in animation (0-15 frames)

2. **Bottom Ticker Tape**
   - Black background with red top border
   - "LATEST" label on left (red bg)
   - Scrolling text animation (infinite loop)
   - Text repeats 3 times for seamless loop

### Props
```typescript
interface NewsOverlayProps {
  headline?: string;    // Breaking news headline
  tickerText?: string;  // Bottom ticker text (defaults to headline)
}
```

### Animations
- Banner: opacity fade (0→1 over 15 frames) + translateX slide-in
- Ticker: continuous horizontal scroll based on frame count

### Missing Connections
- No dynamic text sizing
- Ticker repeats same text 3x (could benefit from multiple stories)

---

## 12. Component: Test (TestVideo)

**File:** [src/components/videos/Test.tsx](src/components/videos/Test.tsx)
**Purpose:** Simple test composition

**Renders:** "Hello" + "World" text staggered

**Status:** Test/demo component, not used in production

---

## 13. Root Component (Remotion)

**File:** [src/components/root/Root.tsx](src/components/root/Root.tsx)
**Purpose:** Remotion composition registry

### Registered Compositions
| Component | ID | Dimensions | Purpose |
|-----------|--|-----------|----|
| PortraitVideo | ShortVideo | 1080x1920, 25fps | Mobile vertical shorts |
| LandscapeVideo | LandscapeVideo | 1920x1080, 25fps | Horizontal shorts |
| LongFormVideo | LongFormVideo | 1920x1080, 25fps | YouTube long-form |
| TestVideo | TestVideo | (test) | Demo/test |

### Default Props
- Sample music: "Aurora on the Boulevard - National Sweetheart.mp3" (local via `/api/music/`)
- Sample scene with captions, video, and audio
- Config with blue caption background, bottom positioning

### calculateMetadata Function
- Converts duration (ms) to frame count: `(durationMs / 1000) * 25 fps`

---

## 14. Shared Types

**File:** [src/components/types.ts](src/components/types.ts)

```typescript
enum AvailableComponentsEnum {
  PortraitVideo = "ShortVideo",
  LandscapeVideo = "LandscapeVideo",
  LongFormVideo = "LongFormVideo",
}

type OrientationConfig = {
  width: number;
  height: number;
  component: AvailableComponentsEnum;
};
```

---

## 15. Shared Utils

**File:** [src/components/utils.ts](src/components/utils.ts)

### Key Functions

#### shortVideoSchema (Zod)
- Validates entire video composition structure
- Schemas for scenes, config, music
- Used to type-check Remotion props

#### createCaptionPages()
Splits captions into pages by:
- **Line max length**: 20-32 chars
- **Line count**: 1-2 lines per page
- **Max time gap**: 1000-1200ms

**Returns:** Array of caption pages with startMs/endMs timing

#### calculateVolume()
- Converts MusicVolumeEnum to numeric volume level
- Returns [volume, isMuted] tuple

---

## Frontend-Backend Integration Summary

### API Endpoints Called by Frontend

| Endpoint | Pages Using | Frequency | Purpose |
|----------|-----------|-----------|---------|
| `/api/short-videos` | VideoList | Mount, after delete | Fetch video list |
| `/api/short-video/:videoId/status` | VideoDetails | Mount, every 5s | Poll video status |
| `/api/short-video/:videoId` | VideoDetails | Download click | Stream video |
| `/api/short-video` | VideoCreator | Form submit | Create video |
| `/api/voices` | VideoCreator | Mount | Populate voice dropdown |
| `/api/music-tags` | VideoCreator | Mount | Populate music dropdown |
| `/api/news-sources` | VideoCreator | Mount | Populate source dropdown |
| `/api/auto-script` | VideoCreator | Auto-script button | Generate scenes from RSS |
| `/api/short-video/:videoId` (DELETE) | VideoList | Delete click | Remove video |
| `/api/health/queue/states` | BulkQueue | Mount, refresh button | Check queue status |
| `/api/queue/bulk` | BulkQueue | Enqueue button | Submit batch render job |
| `/api/channel-configs` | CategoryMapping | Mount, after save | List/save channel mappings |

---

## Missing Feature Connections

### Features Referenced in Code but Not Fully Implemented in UI

| Feature | Code Reference | Current UI Support | Missing |
|---------|---------------|-------------------|----|
| Publishing to Platforms | PublishRouter, PlatformPublisher classes | None | Publish page, job tracking |
| Content Analytics | AnalyticsStore, ViralStrategyService | None | Analytics dashboard, video metrics |
| A/B Testing | ABVariantStore in API | None | Variant creation, assignment UI |
| SEO Optimization | SeoOptimizerService | None | SEO recommendation page |
| AI Training | AiLearningStore, AiTrainingService | None | Model monitoring dashboard |
| Tenant Management | TenantRouter | None | Multi-tenant admin panel |
| Audience Targeting | AudienceStore | None | Audience segment creation UI |
| Content Moderation | ContentEnhancementService.moderate() | None | Moderation interface |

---

## Data Flow Diagram

```
VideoList (Home)
  ├─ GET /api/short-videos
  ├─ DELETE /api/short-video/:id (on user delete)
  ├─ Navigate to VideoCreator
  └─ Navigate to VideoDetails/:id

VideoCreator (Create)
  ├─ GET /api/voices (mount)
  ├─ GET /api/music-tags (mount)
  ├─ GET /api/news-sources (mount)
  ├─ POST /api/auto-script (optional, for AI generation)
  └─ POST /api/short-video (form submit)
      └─ Navigate to VideoDetails/:videoId

VideoDetails (Watch)
  ├─ GET /api/short-video/:id/status (poll every 5s)
  ├─ GET /api/short-video/:id (on download click)
  └─ Navigate back to VideoList

BulkQueue (Batch Jobs)
  ├─ GET /api/health/queue/states (mount + refresh)
  └─ POST /api/queue/bulk (enqueue button)

CategoryMapping (Channel Config)
  ├─ GET /api/channel-configs (mount)
  └─ POST /api/channel-configs (save mapping)
```

---

## Statistics

| Metric | Count |
|--------|-------|
| **Pages** | 5 |
| **Components** | 8 (4 video types + Layout + NewsOverlay + Root + Test) |
| **Backend Endpoints Called** | 14 |
| **Unique API Routers** | 6 (rest, health, queue, tenants, content, ai) |
| **Form Pages** | 3 (VideoCreator, BulkQueue, CategoryMapping) |
| **Polling Pages** | 1 (VideoDetails) |
| **Data Display Pages** | 2 (VideoList, CategoryMapping) |
| **Supported Video Formats** | 3 (Portrait 9:16, Landscape 16:9, LongForm 16:9) |

---

## Accessibility & Performance Notes

### Performance
- **VideoList:** All videos loaded at once (no pagination) - could be slow with 1000+ videos
- **VideoDetails:** Polling interval of 5 seconds - appropriate for status checks
- **VideoCreator:** All dropdown options loaded at mount - good (no lazy loading)
- **Remotion Videos:** Pre-computing frame counts based on audio duration - efficient

### Accessibility Issues
- Color-only status indication (red/blue/green) - add text labels
- Truncated video IDs (first 8 chars) - tooltip could show full ID
- No ARIA labels on custom components
- Button loading states use text ("Queueing...") which is good

### Security Considerations
- Video URLs are public (GET `/api/short-video/:videoId`)
- No authentication/authorization visible in UI code
- File download uses direct anchor tag (no token validation)

---

## Recommendations

### Priority 1: Complete Missing Pages
1. **Publish Manager** - Track publish jobs to YouTube/Instagram/TikTok
2. **Analytics Dashboard** - View video performance metrics, viral score
3. **Settings/Admin** - Manage API keys, quotas (for tenants)

### Priority 2: Enhance Existing Pages
1. **VideoCreator:** Add voice/music preview buttons
2. **VideoDetails:** Show render progress %, file size, processing time
3. **VideoList:** Add search, filter by status, pagination, creation date column
4. **BulkQueue:** Real-time queue updates (WebSocket), job cancellation

### Priority 3: UX Improvements
1. Add loading skeletons instead of plain spinners
2. Add "Copy ID" buttons for sharing
3. Add batch operations (delete multiple, download all)
4. Add dark mode support
5. Add keyboard shortcuts (Cmd+K to create, Del to delete)

### Priority 4: Missing Features
1. Video editor (trim, reorder scenes, adjust timing)
2. Template library (pre-built scene structures)
3. Collaboration/sharing (share videos with team members)
4. Scheduling (post videos at specific times)
5. Export analytics (CSV, PDF reports)

---

## File Path Summary

### React Pages
- [src/ui/pages/VideoList.tsx](src/ui/pages/VideoList.tsx)
- [src/ui/pages/VideoCreator.tsx](src/ui/pages/VideoCreator.tsx)
- [src/ui/pages/VideoDetails.tsx](src/ui/pages/VideoDetails.tsx)
- [src/ui/pages/BulkQueue.tsx](src/ui/pages/BulkQueue.tsx)
- [src/ui/pages/CategoryMapping.tsx](src/ui/pages/CategoryMapping.tsx)

### React Components
- [src/ui/components/Layout.tsx](src/ui/components/Layout.tsx)
- [src/components/videos/PortraitVideo.tsx](src/components/videos/PortraitVideo.tsx)
- [src/components/videos/LandscapeVideo.tsx](src/components/videos/LandscapeVideo.tsx)
- [src/components/videos/LongFormVideo.tsx](src/components/videos/LongFormVideo.tsx)
- [src/components/videos/NewsOverlay.tsx](src/components/videos/NewsOverlay.tsx)
- [src/components/videos/Test.tsx](src/components/videos/Test.tsx)
- [src/components/root/Root.tsx](src/components/root/Root.tsx)

### App & Routing
- [src/ui/App.tsx](src/ui/App.tsx)
- [src/ui/index.tsx](src/ui/index.tsx)

### Shared
- [src/components/types.ts](src/components/types.ts)
- [src/components/utils.ts](src/components/utils.ts)
- [src/config/channelRules.ts](src/config/channelRules.ts)
