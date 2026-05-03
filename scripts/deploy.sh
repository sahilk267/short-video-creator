#!/usr/bin/env bash
# ============================================================
# Production Deployment Script
# ============================================================
# Usage:
#   ./scripts/deploy.sh [--env production|staging]
#
# Supports:
#   - Local/VPS deployment
#   - PM2 process management
#   - Systemd service
# ============================================================

set -euo pipefail

ENV="${1:-production}"
APP_NAME="ai-content-empire"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'; BOLD='\033[1m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }
step()    { echo -e "\n${BLUE}${BOLD}▶ $*${NC}"; }

echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════╗"
echo "║   AI Content Empire – Deploy v12.0   ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"
echo "  Environment: $ENV"
echo "  App directory: $APP_DIR"
echo "  Timestamp: $TIMESTAMP"

cd "$APP_DIR"

# ── Check .env ────────────────────────────────────────────────
step "Checking environment..."
if [ ! -f ".env" ]; then
  error ".env file not found! Copy .env.example and configure it."
  exit 1
fi

# Load .env for PEXELS check
set -a; source .env 2>/dev/null || true; set +a

if [ -z "${PEXELS_API_KEY:-}" ] || [ "${PEXELS_API_KEY}" = "your_pexels_api_key_here" ]; then
  error "PEXELS_API_KEY is not configured in .env"
  exit 1
fi
success "Environment configured"

# ── Install dependencies ──────────────────────────────────────
step "Installing production dependencies..."
pnpm install --frozen-lockfile --prod
success "Dependencies installed"

# ── Run migrations ────────────────────────────────────────────
step "Running database migrations..."
bash database/migrate.sh
success "Migrations complete"

# ── Build ─────────────────────────────────────────────────────
step "Building project..."
pnpm run build
success "Build complete"

# ── Start/Restart with PM2 ────────────────────────────────────
step "Starting application..."
if command -v pm2 &>/dev/null; then
  info "Using PM2 for process management"
  if pm2 list | grep -q "$APP_NAME"; then
    pm2 restart "$APP_NAME" --update-env
    success "PM2 process restarted"
  else
    pm2 start dist/index.js --name "$APP_NAME" \
      --max-memory-restart 4G \
      --restart-delay 3000 \
      --max-restarts 10
    pm2 save
    success "PM2 process started and saved"
  fi
elif command -v systemctl &>/dev/null && systemctl is-active --quiet "$APP_NAME" 2>/dev/null; then
  info "Using systemd for process management"
  systemctl restart "$APP_NAME"
  success "Systemd service restarted"
else
  warn "Neither PM2 nor systemd found. Starting directly (not recommended for production)."
  warn "Install PM2: npm install -g pm2"
  nohup node dist/index.js > "${DATA_DIR_PATH:-/tmp}"/logs/app.log 2>&1 &
  success "Application started (PID: $!)"
fi

# ── Health check ──────────────────────────────────────────────
step "Running health check..."
sleep 3
PORT="${PORT:-3123}"
if curl -sf "http://localhost:${PORT}/api/health" > /dev/null 2>&1; then
  success "Health check passed: http://localhost:${PORT}/api/health"
else
  warn "Health check failed — app may still be starting up"
fi

echo ""
echo -e "${GREEN}${BOLD}✅ Deployment Complete!${NC}"
echo ""
echo -e "  API Docs:    ${BLUE}http://localhost:${PORT}/api/docs${NC}"
echo -e "  Health:      ${BLUE}http://localhost:${PORT}/api/health${NC}"
echo -e "  Logs:        ${BLUE}pm2 logs $APP_NAME${NC}"
echo ""
