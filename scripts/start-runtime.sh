#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Start Runtime
# Starts the stable internal runtime stack.
#
# Usage:
#   bash ./scripts/start-runtime.sh
# ─────────────────────────────────────────────────────────────────
set -eu

cd "$(dirname "$0")/.."

echo "Starting CMMC Dashboard runtime..."
docker compose up -d
echo "[OK]   Runtime started. Access at http://localhost"
