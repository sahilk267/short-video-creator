#!/usr/bin/env bash
# ============================================================
# Database Seeder Runner
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEEDERS_DIR="$SCRIPT_DIR/seeders"

echo ""
echo "🌱 Running database seeders..."
echo "   Seeders dir: $SEEDERS_DIR"
echo ""

for seeder in "$SEEDERS_DIR"/[0-9]*.js; do
  if [ -f "$seeder" ]; then
    echo "▶ Running: $(basename "$seeder")"
    node "$seeder"
  fi
done

echo "✅ All seeders complete!"
