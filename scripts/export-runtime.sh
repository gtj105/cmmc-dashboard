#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Export Runtime Data
# Exports all dashboard data to a JSON file inside the app container,
# then copies it to the host at ./exports/.
#
# Usage:
#   bash ./scripts/export-runtime.sh
# ─────────────────────────────────────────────────────────────────
set -eu

cd "$(dirname "$0")/.."

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
EXPORT_FILE="exports/export-${TIMESTAMP}.json"

mkdir -p exports

echo "Exporting dashboard data..."
docker compose exec app npm run export-data -- --file "/tmp/export-${TIMESTAMP}.json"
docker compose cp "app:/tmp/export-${TIMESTAMP}.json" "./${EXPORT_FILE}"
echo "[OK]   Export saved to ${EXPORT_FILE}"
