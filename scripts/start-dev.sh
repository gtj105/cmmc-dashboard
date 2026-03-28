#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Start Dev Runtime
# Starts a separate development instance on port 3001 with live reload.
# Uses isolated volumes so it never touches the production runtime DB.
#
# Usage:
#   bash ./scripts/start-dev.sh
# ─────────────────────────────────────────────────────────────────
set -eu

cd "$(dirname "$0")/.."

# Bootstrap secrets if this is a first run
if [ ! -f "./secrets/postgres_password.txt" ] || [ ! -f "./secrets/nextauth_secret.txt" ]; then
  echo "Secrets not found — bootstrapping..."
  bash ./scripts/setup-secrets.sh
fi

echo "Starting CMMC Dashboard dev runtime..."
docker compose -p cmmc-dev -f docker-compose.yml -f docker-compose.dev.yml up -d
echo "[OK]   Dev runtime started. Access at http://localhost:3001"
echo "       Migrations run automatically on first boot."
echo "       This is ISOLATED from the production runtime stack."
