# Short Video Maker

## Overview
An automated short-form video creation tool for TikTok, Instagram Reels, and YouTube Shorts. Uses Kokoro TTS, Whisper.cpp for captions, Pexels for background videos, Remotion for video rendering, and FFmpeg for audio processing. Supports MCP (Model Context Protocol) and REST API.

## Architecture
- **Backend**: Express.js server (port 5000) with MCP protocol support
- **Frontend**: React + Vite UI built to `dist/ui`, served statically by the backend
- **Language**: TypeScript (both frontend and backend)
- **Build**: `tsc` for backend, `vite build` for frontend → `dist/`
- **Package Manager**: pnpm

## Key Technologies
- **TTS**: Kokoro.js (ONNX model)
- **STT/Captions**: Whisper.cpp via `@remotion/install-whisper-cpp`
- **Video Composition**: Remotion
- **Background Videos**: Pexels API
- **Audio**: FFmpeg via `@ffmpeg-installer/ffmpeg`
- **Queue**: BullMQ (optional, requires Redis)
- **Styling**: Tailwind CSS + Material UI

## Project Structure
```
src/
  index.ts              # Backend entry point
  config.ts             # Configuration class (reads env vars)
  server/server.ts      # Express server setup
  ui/                   # React frontend (Vite)
    services/apiClient.ts  # API client (uses relative URLs)
  short-creator/        # Core video creation logic
  workers/              # BullMQ workers (render, publish, deadletter)
  services/             # Scheduler, analytics, etc.
  components/           # Remotion video components
  agents/               # Agent loop for script generation
  feedback/             # Script quality feedback
  memory/               # Pattern memory service
dist/                   # Built output
  index.js              # Compiled backend
  ui/                   # Built frontend
static/
  music/                # Background music files (MP3)
data/                   # Runtime data (videos, logs, temp)
```

## Environment Variables
- `PEXELS_API_KEY` — required, free key from pexels.com/api/key
- `PORT=5000` — server port
- `LOG_LEVEL=info` — pino log level
- `DEV=true` — development mode
- `REDIS_ENABLED=false` — disable Redis/BullMQ by default
- `SKIP_RUNTIME_INSTALL=true` — skip Kokoro/Whisper install on startup

## Important Setup Notes
- **Installation flag**: The app checks `~/.ai-agents-az-video-generator/installation-successful` to skip the test render on startup. This file must exist for fast startup.
- **API URLs**: The frontend uses relative URLs (empty baseURL) so it works through Replit's proxy.
- **pnpm build scripts**: Package `onlyBuiltDependencies` configured in package.json to allow esbuild, ffmpeg, onnxruntime, etc.
- **TypeScript fixes**: Fixed type errors in `agents/agent-loop.service.ts`, `memory/memory.service.ts`, `video/beat-sync.service.ts`.

## Workflow
- **Command**: `node dist/index.js`
- **Port**: 5000 (webview)
- **Build before run**: `pnpm run build` (tsc + vite build)

## Development
```bash
pnpm install          # Install dependencies
pnpm run build        # Full build (tsc + vite)
pnpm run ui:build     # Frontend only
node dist/index.js    # Start server
```
