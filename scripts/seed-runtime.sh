#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Seed Runtime
# Runs the seed script inside the app container.
# Safe to run on a live stack — seed.ts skips tables that already have data.
#
# Usage:
#   bash ./scripts/seed-runtime.sh
# ─────────────────────────────────────────────────────────────────
set -eu

cd "$(dirname "$0")/.."

echo "Running seed inside the app container..."
docker compose exec app npm run seed
echo "[OK]   Seed complete"
