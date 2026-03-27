#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Bootstrap Script
# First-run setup for the internal runtime. Idempotent: safe to run again.
#
# Usage:
#   bash ./scripts/bootstrap.sh
# ─────────────────────────────────────────────────────────────────
set -eu

cd "$(dirname "$0")/.."

echo "CMMC Dashboard — Bootstrap"
echo "=========================="
echo ""

# 1. Verify Docker is available
if ! docker info > /dev/null 2>&1; then
  echo "[ERROR] Docker is not running. Start Docker Desktop and try again."
  exit 1
fi
echo "[OK]   Docker is running"

# 2. Ensure secrets exist (idempotent — skips if already present)
echo ""
echo "Setting up secrets..."
bash ./scripts/setup-secrets.sh

# 3. Start the database service and wait for healthy
echo ""
echo "Starting database..."
docker compose up -d db
echo "Waiting for database to be healthy..."
until docker compose exec db pg_isready -U cmmc_user -d cmmc_db > /dev/null 2>&1; do
  printf '.'
  sleep 2
done
echo ""
echo "[OK]   Database is healthy"

# 4. Seed the schema and data — seed.ts is idempotent (skips if data exists)
echo ""
echo "Running seed (schema + initial data if empty)..."
docker compose run --rm app npm run seed
echo "[OK]   Seed complete"

# 5. Ensure a default admin user exists
echo ""
echo "Ensuring default admin user..."
docker compose run --rm app npm run create-user -- \
  --email admin@localhost \
  --name "Admin" \
  --password "changeme" \
  --role admin 2>/dev/null || true
echo "[OK]   Admin check complete (existing admin preserved)"

# 6. Start the full runtime stack
echo ""
echo "Starting runtime stack..."
docker compose up -d
echo ""
echo "[OK]   CMMC Dashboard is running"
echo ""
echo "Access it at: http://localhost"
echo "Default login: admin@localhost / changeme"
echo ""
echo "IMPORTANT: Change the admin password immediately after first login."
echo "Run 'bash ./scripts/stop-runtime.sh' to stop the stack."
