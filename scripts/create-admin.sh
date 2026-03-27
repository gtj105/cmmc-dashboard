#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Create Admin User
# Creates an admin user inside the running app container.
#
# Usage:
#   bash ./scripts/create-admin.sh --email user@example.com --name "Jane Doe" --password "secret"
# ─────────────────────────────────────────────────────────────────
set -eu

cd "$(dirname "$0")/.."

if [ "$#" -eq 0 ]; then
  echo "Usage: bash ./scripts/create-admin.sh --email <email> --name <name> --password <password>"
  echo ""
  echo "Example:"
  echo "  bash ./scripts/create-admin.sh --email jane@example.com --name 'Jane Doe' --password 'changeme'"
  exit 1
fi

echo "Creating admin user..."
docker compose exec app npm run create-user -- --role admin "$@"
echo "[OK]   Admin user created"
