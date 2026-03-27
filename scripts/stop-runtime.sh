#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Stop Runtime
# Stops the internal runtime stack cleanly. Data is preserved.
#
# Usage:
#   bash ./scripts/stop-runtime.sh
# ─────────────────────────────────────────────────────────────────
set -eu

cd "$(dirname "$0")/.."

echo "Stopping CMMC Dashboard runtime..."
docker compose down
echo "[OK]   Runtime stopped. Data volumes are preserved."
