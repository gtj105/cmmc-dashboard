#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Validate Runtime DB
# Runs DB invariant checks inside the app container.
# Use after migrations, imports, or any schema change.
#
# Usage:
#   bash ./scripts/validate-runtime.sh
# ─────────────────────────────────────────────────────────────────
set -eu

cd "$(dirname "$0")/.."

echo "Running DB validation..."
docker compose exec app npm run validate-db
echo "[OK]   All invariants passed"
