#!/usr/bin/env bash
# ============================================================
# AI Viral Content Empire – One-Command Setup Script
# ============================================================
# Usage:
#   chmod +x setup.sh && ./setup.sh
#
# This script:
#   1. Checks system requirements
#   2. Installs dependencies
#   3. Sets up environment variables
#   4. Initializes the data directory
#   5. Runs database migrations & seeders
#   6. Builds the project
#   7. Starts the server
# ============================================================

set -euo pipefail

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ── Helpers ──────────────────────────────────────────────────
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }
step()    { echo -e "\n${CYAN}${BOLD}▶ $*${NC}"; }

# ── Banner ────────────────────────────────────────────────────
echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║       AI Viral Content Empire – Setup v12.0          ║"
echo "║       60 Engines · 7 Platforms · Full SaaS           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── Step 1: System Requirements ──────────────────────────────
step "Checking system requirements..."

check_cmd() {
  if command -v "$1" &>/dev/null; then
    success "$1 found: $(command -v "$1")"
  else
    error "$1 is not installed. Please install it first."
    exit 1
  fi
}

check_cmd node
check_cmd npm

NODE_VERSION=$(node --version | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
  error "Node.js 20+ required. Found: v$NODE_VERSION"
  exit 1
fi
success "Node.js v$NODE_VERSION (>=20 required)"

# Check pnpm
if ! command -v pnpm &>/dev/null; then
  warn "pnpm not found, installing via corepack..."
  corepack enable && corepack prepare pnpm@latest --activate
fi
success "pnpm found: $(pnpm --version)"

# Check ffmpeg (optional but recommended)
if command -v ffmpeg &>/dev/null; then
  success "ffmpeg found: $(ffmpeg -version 2>&1 | head -1)"
else
  warn "ffmpeg not found. Some features may not work. Install: https://ffmpeg.org/download.html"
fi

# ── Step 2: Environment Setup ─────────────────────────────────
step "Setting up environment configuration..."

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    success "Created .env from .env.example"
    warn "Please edit .env and set your PEXELS_API_KEY before starting"
    echo ""
    echo -e "  ${YELLOW}Required: PEXELS_API_KEY${NC} — Get free key at https://www.pexels.com/api/key/"
    echo ""
  else
    error ".env.example not found. Cannot create .env"
    exit 1
  fi
else
  success ".env already exists"
fi

# Load .env
set -a
# shellcheck disable=SC1091
source .env 2>/dev/null || true
set +a

# Validate required env vars
if [ -z "${PEXELS_API_KEY:-}" ] || [ "${PEXELS_API_KEY}" = "your_pexels_api_key_here" ]; then
  warn "PEXELS_API_KEY is not set in .env"
  warn "The app will start but video background sourcing won't work"
  warn "Get your free key at: https://www.pexels.com/api/key/"
fi

# ── Step 3: Install Dependencies ──────────────────────────────
step "Installing dependencies..."
pnpm install --frozen-lockfile
success "Dependencies installed"

# ── Step 4: Initialize Data Directory ────────────────────────
step "Initializing data directory..."
DATA_DIR="${DATA_DIR_PATH:-$HOME/.ai-content-empire}"
mkdir -p "$DATA_DIR"/{videos,temp,logs,generated-images,filtered-images,watermarked}
mkdir -p "$DATA_DIR"/cache/{puppeteer,huggingface}
success "Data directory initialized: $DATA_DIR"

# ── Step 5: Run Database Migrations ──────────────────────────
step "Running database migrations..."
if [ -f "database/migrate.sh" ]; then
  bash database/migrate.sh
else
  node database/migrations/001_init.js
fi
success "Migrations complete"

# ── Step 6: Seed Default Data ─────────────────────────────────
step "Seeding default data..."
if [ -f "database/seed.sh" ]; then
  bash database/seed.sh
else
  node database/seeders/001_seed_defaults.js
fi
success "Seeding complete"

# ── Step 7: Build Project ─────────────────────────────────────
step "Building project (TypeScript + Vite)..."
pnpm run build
success "Build complete"

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════╗"
echo "║             ✅  Setup Complete!                   ║"
echo "╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Start the server:    ${CYAN}node dist/index.js${NC}"
echo -e "  Or with Docker:      ${CYAN}docker-compose up --build${NC}"
echo -e "  API Docs:            ${CYAN}http://localhost:${PORT:-3123}/api/docs${NC}"
echo -e "  Health Check:        ${CYAN}http://localhost:${PORT:-3123}/api/health${NC}"
echo -e "  Web UI:              ${CYAN}http://localhost:${PORT:-3123}${NC}"
echo ""

# ── Optional: Start Server ────────────────────────────────────
if [ "${1:-}" = "--start" ]; then
  step "Starting server..."
  node dist/index.js
fi
