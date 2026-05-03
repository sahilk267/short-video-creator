#!/usr/bin/env bash
# ============================================================
# Database Migration Runner
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

echo ""
echo "🗄️  Running database migrations..."
echo "   Migrations dir: $MIGRATIONS_DIR"
echo ""

for migration in "$MIGRATIONS_DIR"/[0-9]*.js; do
  if [ -f "$migration" ]; then
    echo "▶ Running: $(basename "$migration")"
    node "$migration"
  fi
done

echo "✅ All migrations complete!"
