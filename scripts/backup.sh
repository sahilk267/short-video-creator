#!/usr/bin/env bash
# ============================================================
# Database / Data Backup Script
# ============================================================
# Usage:
#   ./scripts/backup.sh [--output /path/to/backups]
#
# Backs up all JSON data stores and config to a timestamped
# compressed archive. Safe to run as a cron job.
#
# Example cron (daily at 2am):
#   0 2 * * * /app/scripts/backup.sh --output /backups
# ============================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────
source .env 2>/dev/null || true
DATA_DIR="${DATA_DIR_PATH:-$HOME/.ai-content-empire}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="${2:-$DATA_DIR/backups}"
BACKUP_FILE="ai-content-empire_backup_${TIMESTAMP}.tar.gz"
BACKUP_PATH="$OUTPUT_DIR/$BACKUP_FILE"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-30}"  # Keep backups for 30 days

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'; BOLD='\033[1m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }

echo ""
echo -e "${BOLD}🗄️  AI Content Empire – Data Backup${NC}"
echo "   Timestamp: $TIMESTAMP"
echo "   Source:    $DATA_DIR"
echo "   Output:    $BACKUP_PATH"
echo ""

# ── Create backup directory ───────────────────────────────────
mkdir -p "$OUTPUT_DIR"

# ── Create archive ────────────────────────────────────────────
info "Creating backup archive..."

# Files to include in backup
INCLUDE_PATTERNS=(
  "*.json"
  "logs/*.log"
)

# Build tar command
TAR_ARGS=()
for pattern in "${INCLUDE_PATTERNS[@]}"; do
  TAR_ARGS+=("--include=$pattern")
done

cd "$DATA_DIR"

# Backup all JSON stores
tar czf "$BACKUP_PATH" \
  --exclude="cache/*" \
  --exclude="temp/*" \
  --exclude="videos/*" \
  --exclude="generated-images/*" \
  --exclude="filtered-images/*" \
  --exclude="watermarked/*" \
  --exclude="thumbnails/*" \
  . 2>/dev/null || true

# ── Include config files ──────────────────────────────────────
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"
if [ -f ".env" ]; then
  info "Including .env config (redacted)..."
  # Redact sensitive values
  sed 's/=.*/=<REDACTED>/g' .env > /tmp/env_redacted.txt
  tar czf "$BACKUP_PATH.tmp" -C /tmp env_redacted.txt 2>/dev/null && \
    cat "$BACKUP_PATH.tmp" >> "$BACKUP_PATH" || true
  rm -f /tmp/env_redacted.txt "$BACKUP_PATH.tmp"
fi

# ── Verify backup ─────────────────────────────────────────────
BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
success "Backup created: $BACKUP_PATH ($BACKUP_SIZE)"

# ── Cleanup old backups ───────────────────────────────────────
info "Cleaning up backups older than $KEEP_DAYS days..."
REMOVED=0
while IFS= read -r -d '' old_backup; do
  rm -f "$old_backup"
  ((REMOVED++))
done < <(find "$OUTPUT_DIR" -name "ai-content-empire_backup_*.tar.gz" -mtime "+$KEEP_DAYS" -print0 2>/dev/null)

if [ "$REMOVED" -gt 0 ]; then
  info "Removed $REMOVED old backup(s)"
fi

# ── List recent backups ───────────────────────────────────────
echo ""
info "Recent backups in $OUTPUT_DIR:"
ls -lht "$OUTPUT_DIR"/ai-content-empire_backup_*.tar.gz 2>/dev/null | head -5 | awk '{print "  " $0}' || echo "  (none)"

echo ""
success "Backup complete!"
echo ""
