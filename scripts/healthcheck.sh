#!/usr/bin/env bash
# ============================================================
# Health Check Script
# ============================================================
# Returns exit code 0 if healthy, 1 if unhealthy.
# Used by Docker HEALTHCHECK and external monitoring.
#
# Usage:
#   ./scripts/healthcheck.sh [--verbose]
# ============================================================

PORT="${PORT:-3123}"
HOST="${APP_HOST:-localhost}"
BASE_URL="http://${HOST}:${PORT}"
VERBOSE="${1:-}"
TIMEOUT=10

check() {
  local name="$1"
  local url="$2"
  local response
  local http_code

  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "000")

  if [ "$http_code" = "200" ]; then
    [ "$VERBOSE" = "--verbose" ] && echo "✅ $name: OK (HTTP $http_code)"
    return 0
  else
    [ "$VERBOSE" = "--verbose" ] && echo "❌ $name: FAIL (HTTP $http_code)"
    return 1
  fi
}

FAILED=0

# ── Core health endpoint ──────────────────────────────────────
check "API Health" "$BASE_URL/api/health" || FAILED=1

# ── Frontend ──────────────────────────────────────────────────
check "Web UI" "$BASE_URL/" || FAILED=1

# ── API Docs ──────────────────────────────────────────────────
check "API Docs" "$BASE_URL/api/docs" || FAILED=1

# ── Video Library API ─────────────────────────────────────────
check "Video Library API" "$BASE_URL/api/videolibrary" || FAILED=1

# ── Schedule API ──────────────────────────────────────────────
check "Schedule API" "$BASE_URL/api/schedule" || FAILED=1

if [ "$VERBOSE" = "--verbose" ]; then
  echo ""
  if [ "$FAILED" -eq 0 ]; then
    echo "🟢 All health checks passed"
  else
    echo "🔴 Some health checks failed"
  fi
fi

exit "$FAILED"
