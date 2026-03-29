#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Production Deploy Script
#
# Run this ONCE on a fresh machine to stand up the production stack.
# It clones the repo into ~/cmmc-dashboard-prod, generates secrets,
# configures the environment, and starts all services.
#
# Usage (fresh machine):
#   git clone https://github.com/gtj105/cmmc-dashboard.git ~/cmmc-dashboard-prod
#   bash ~/cmmc-dashboard-prod/scripts/deploy-prod.sh
# ─────────────────────────────────────────────────────────────────
set -eu

REPO_URL="https://github.com/gtj105/cmmc-dashboard.git"
DEPLOY_DIR="${HOME}/cmmc-dashboard-prod"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   CMMC Dashboard — Production Setup  ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ─── Step 1: Check prerequisites ─────────────────────────────────
echo "Step 1/6 — Checking prerequisites..."

if ! docker info > /dev/null 2>&1; then
  echo ""
  echo "[ERROR] Docker is not running."
  echo "        Install Docker Desktop (Mac/Windows) or Docker Engine (Linux)"
  echo "        and start it before running this script."
  exit 1
fi
echo "[OK]   Docker is running"

if ! docker compose version > /dev/null 2>&1; then
  echo "[ERROR] Docker Compose not found. Install Docker Compose v2 and try again."
  exit 1
fi
echo "[OK]   Docker Compose is available"

# ─── Step 2: Clone repo ───────────────────────────────────────────
echo ""
echo "Step 2/6 — Setting up deployment directory..."

if [ -d "${DEPLOY_DIR}/.git" ]; then
  echo "[INFO] ${DEPLOY_DIR} already exists — pulling latest changes..."
  git -C "${DEPLOY_DIR}" pull
else
  echo "Cloning into ${DEPLOY_DIR}..."
  git clone "${REPO_URL}" "${DEPLOY_DIR}"
  echo "[OK]   Repository cloned"
fi

cd "${DEPLOY_DIR}"

# ─── Step 3: Generate secrets ─────────────────────────────────────
echo ""
echo "Step 3/6 — Generating secrets..."
bash ./scripts/setup-secrets.sh

# ─── Step 4: Configure environment ───────────────────────────────
echo ""
echo "Step 4/6 — Configuring environment..."

ENV_FILE=".env"

# Set NEXTAUTH_URL
if grep -q "^NEXTAUTH_URL=" "${ENV_FILE}" 2>/dev/null; then
  echo ""
  echo "Current NEXTAUTH_URL: $(grep '^NEXTAUTH_URL=' ${ENV_FILE} | cut -d= -f2)"
  echo "Enter the URL where this app will be accessed (e.g. http://10.0.1.50 or http://cmmc.internal)"
  echo "Press Enter to keep the current value:"
  read -r input_url
  if [ -n "${input_url}" ]; then
    sed -i.bak "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=${input_url}|" "${ENV_FILE}"
    rm -f "${ENV_FILE}.bak"
    echo "[OK]   NEXTAUTH_URL set to ${input_url}"
  else
    echo "[SKIP] NEXTAUTH_URL unchanged"
  fi
else
  echo "Enter the URL where this app will be accessed (e.g. http://10.0.1.50 or http://cmmc.internal)"
  echo "Press Enter to use http://localhost:"
  read -r input_url
  url="${input_url:-http://localhost}"
  echo "" >> "${ENV_FILE}"
  echo "NEXTAUTH_URL=${url}" >> "${ENV_FILE}"
  echo "[OK]   NEXTAUTH_URL set to ${url}"
fi

# ─── Step 5: Build and start ──────────────────────────────────────
echo ""
echo "Step 5/6 — Building and starting the stack (this takes a few minutes)..."
docker compose up -d --build
echo "[OK]   Stack started — migrations run automatically on boot"

# Wait for app to be healthy
echo "Waiting for app to be healthy..."
ATTEMPTS=0
until docker compose exec -T app wget -q -O- http://localhost:3000/api/health > /dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "${ATTEMPTS}" -ge 30 ]; then
    echo "[WARN] App did not become healthy after 60s. Check: docker compose logs app"
    break
  fi
  printf '.'
  sleep 2
done
echo ""
echo "[OK]   App is healthy"

# ─── Step 6: Seed database ────────────────────────────────────────
echo ""
echo "Step 6/6 — Seeding database with baseline data..."
docker compose exec app npm run seed
echo "[OK]   Database seeded"

# ─── Done ─────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   CMMC Dashboard is running!                         ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  URL:      $(grep '^NEXTAUTH_URL=' ${ENV_FILE} | cut -d= -f2)"
echo "  Login:    admin@localhost"
echo "  Password: admin"
echo ""
echo "  IMPORTANT: Change the admin password immediately after first login."
echo "             Settings → Change Password"
echo ""
echo "  Set your organization name under Settings → Organization (admin only)."
echo ""
echo "  Deployment directory: ${DEPLOY_DIR}"
echo ""
echo "  Useful commands:"
echo "    Start:   bash ${DEPLOY_DIR}/scripts/start-runtime.sh"
echo "    Stop:    bash ${DEPLOY_DIR}/scripts/stop-runtime.sh"
echo "    Update:  cd ${DEPLOY_DIR} && git pull && docker compose up -d --build"
echo "    Logs:    cd ${DEPLOY_DIR} && docker compose logs -f app"
echo ""
