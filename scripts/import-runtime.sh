#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Import Runtime Data
# Imports a JSON export file into the running stack.
# Requires the schema to already be present (run bootstrap first).
#
# Usage:
#   bash ./scripts/import-runtime.sh --file exports/export-20250101-120000.json [--wipe]
#
# Options:
#   --file  Path to the export JSON file (required)
#   --wipe  Truncate all data before importing (use with care)
# ─────────────────────────────────────────────────────────────────
set -eu

cd "$(dirname "$0")/.."

if [ "$#" -eq 0 ]; then
  echo "Usage: bash ./scripts/import-runtime.sh --file <path> [--wipe]"
  echo ""
  echo "Example:"
  echo "  bash ./scripts/import-runtime.sh --file exports/export-20250101-120000.json"
  echo "  bash ./scripts/import-runtime.sh --file exports/export-20250101-120000.json --wipe"
  exit 1
fi

# Parse --file from args to copy it into the container
FILE=""
EXTRA_ARGS=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --file)
      FILE="$2"
      shift 2
      ;;
    --wipe)
      EXTRA_ARGS="${EXTRA_ARGS} --wipe"
      shift
      ;;
    *)
      echo "[ERROR] Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [ -z "$FILE" ]; then
  echo "[ERROR] --file is required"
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "[ERROR] File not found: $FILE"
  exit 1
fi

BASENAME=$(basename "$FILE")
echo "Copying export file into container..."
docker compose cp "$FILE" "app:/tmp/${BASENAME}"

echo "Importing data..."
# shellcheck disable=SC2086
docker compose exec app npm run import-data -- --file "/tmp/${BASENAME}"${EXTRA_ARGS}
echo "[OK]   Import complete"
