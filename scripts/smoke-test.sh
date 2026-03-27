#!/usr/bin/env bash
# smoke-test.sh — Post-deploy verification for CMMC Dashboard
#
# Usage:
#   ./scripts/smoke-test.sh
#   ./scripts/smoke-test.sh http://127.0.0.1

set -euo pipefail

BASE="${1:-http://127.0.0.1}"
PASS=0
FAIL=0

green() { printf "\033[32m✓\033[0m %s\n" "$1"; }
red()   { printf "\033[31m✗\033[0m %s\n" "$1"; }

check() {
  local label="$1"; shift
  if "$@" &>/dev/null; then
    green "$label"
    ((PASS++)) || true
  else
    red "$label"
    ((FAIL++)) || true
  fi
}

echo "Smoke test: $BASE"
echo "---"

check "Health endpoint returns 'healthy'" \
  bash -c "curl -sf $BASE/api/health | grep -q healthy"

check "Unauthenticated /overview redirects to /login on port 80" \
  bash -c "curl -sI $BASE/overview | grep -E 'Location:' | grep -q '/login' && \
           curl -sI $BASE/overview | grep -E 'Location:' | grep -qv ':3000'"

COOKIE_JAR=$(mktemp)
ADMIN_PASSWORD="$(cat secrets/admin_password.txt 2>/dev/null || echo 'admin')"

CSRF_JSON=$(curl -sf -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$BASE/api/auth/csrf" 2>/dev/null || echo "")
CSRF_TOKEN=$(printf "%s" "$CSRF_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('csrfToken',''))" 2>/dev/null || echo "")

LOGIN_RESULT=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "csrfToken=$CSRF_TOKEN" \
  --data-urlencode "email=admin@localhost" \
  --data-urlencode "password=$ADMIN_PASSWORD" \
  -w "%{http_code}" -o /dev/null 2>/dev/null || echo "000")

if grep -q "next-auth.session-token" "$COOKIE_JAR" 2>/dev/null || \
   grep -q "__Secure-next-auth.session-token" "$COOKIE_JAR" 2>/dev/null; then
  green "Login sets session cookie"
  ((PASS++)) || true
else
  red "Login did not set session cookie (HTTP $LOGIN_RESULT)"
  ((FAIL++)) || true
fi

PRACTICE_COUNT=$(docker compose exec -T db psql -U cmmc_user -d cmmc_db -tAc \
  "SELECT COUNT(*) FROM practices;" 2>/dev/null || echo "0")
check "DB has 130 practices (110 CMMC + 20 ITAR)" \
  bash -c "[ '$PRACTICE_COUNT' = '130' ]"

WEIGHT_SUM=$(docker compose exec -T db psql -U cmmc_user -d cmmc_db -tAc \
  "SELECT SUM(sprs_weight) FROM practices WHERE framework = 'CMMC';" 2>/dev/null || echo "0")
check "DB SPRS weight sum is 314 (not 110 = all-ones default)" \
  bash -c "[ '$WEIGHT_SUM' = '314' ]"

BASELINE_SPRS=$(docker compose exec -T db psql -U cmmc_user -d cmmc_db -tAc \
  "SELECT 110 - SUM(sprs_weight) FROM practices WHERE framework = 'CMMC';" 2>/dev/null || echo "unavailable")

if [ "$BASELINE_SPRS" = "-204" ]; then
  green "Baseline SPRS score is $BASELINE_SPRS"
  ((PASS++)) || true
else
  red "Baseline SPRS score is $BASELINE_SPRS — check SPRS weights and baseline seed data"
  ((FAIL++)) || true
fi

LOGOUT_CSRF_JSON=$(curl -sf -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$BASE/api/auth/csrf" 2>/dev/null || echo "")
LOGOUT_CSRF_TOKEN=$(printf "%s" "$LOGOUT_CSRF_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('csrfToken',''))" 2>/dev/null || echo "")

LOGOUT_LOCATION=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/api/auth/signout" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "csrfToken=$LOGOUT_CSRF_TOKEN" \
  --data-urlencode "callbackUrl=/login" \
  -D - -o /dev/null 2>/dev/null | grep -i "^location:" || echo "no-redirect")

if echo "$LOGOUT_LOCATION" | grep -q "/login" && \
   ! echo "$LOGOUT_LOCATION" | grep -q ":3000"; then
  green "Logout redirects to /login (no :3000 port)"
  ((PASS++)) || true
else
  red "Logout redirect is wrong: $LOGOUT_LOCATION — check NEXTAUTH_URL in .env"
  ((FAIL++)) || true
fi

rm -f "$COOKIE_JAR"

echo "---"
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
