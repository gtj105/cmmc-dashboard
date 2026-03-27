# QA Edge Case Plan — CMMC Dashboard
## Handoff Document for Implementation Agent

---

## Context: Bugs This Plan Is Designed to Prevent

Three recurring bug categories were found during development. Each one caused the app to appear broken after a rebuild, deploy, or data reset:

| Bug | Category | Root Cause |
|-----|----------|------------|
| Logout redirected to `localhost:3000/login` | Config drift | `.env` had `NEXTAUTH_URL=http://localhost:3000` (dev port). Docker Compose reads `.env` and passed the wrong URL into the container. |
| Login broken after logout | Auth edge case | CSRF cookie set with `Secure: true` using `NODE_ENV === 'production'` — wrong in HTTP Docker. Fixed to check `NEXTAUTH_URL` scheme instead. |
| SPRS score showed `-20` instead of `-204` | Data invariant | All `sprs_weight` values were `1` after a factory reset restored from a `baseline.json` that was generated before the weights migration ran. |
| Container health check failed | Docker config | Next.js standalone binds to the container hostname, not `0.0.0.0`. Missing `HOSTNAME: 0.0.0.0` env var. Health check also used `localhost` which can fail DNS resolution inside Docker. |

The goal is tests that would have caught all four categories before they became regressions.

---

## Repo Structure Reference

```
dashboard/
├── tests/                         # Existing Python test suite (run with python -m unittest)
│   ├── test_container_hardening.py
│   ├── test_overlay_scoring.py
│   └── ... (15 existing files)
├── scripts/
│   ├── data/baseline.json         # Factory reset source of truth (130 practices)
│   ├── migrate-sprs-weights.sql   # Canonical SPRS weight assignments
│   └── smoke-test.sh              # TO BE CREATED
├── src/
│   └── middleware.ts              # Sets CSRF cookie — Secure flag logic lives here
├── docker-compose.yml
├── nginx.conf
└── .env                           # NEXTAUTH_URL=http://localhost (no port)
```

**Test style:** All existing tests are plain Python `unittest`, no dependencies beyond stdlib. They read source files as text or run TypeScript snippets via `node --experimental-strip-types`. No Docker, no network, no server required. Match this style exactly.

**How to run:** `python -m unittest discover -s tests` from the repo root.

---

## Layer 1: Static Invariant Tests (Three New Files)

### File 1: `tests/test_deployment_config.py`

Catches config drift between dev and Docker. Every check reads source files — no running container needed.

```python
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class DeploymentConfigTests(unittest.TestCase):

    def test_env_example_uses_port_80_nextauth_url(self) -> None:
        """NEXTAUTH_URL in .env.example must not contain a port number.
        The canonical Docker URL is http://localhost (nginx on 80).
        If this has :3000, logout redirects will hit the internal container
        port which is unreachable from the browser."""
        env_example = (ROOT / ".env.example").read_text()
        lines = [l.strip() for l in env_example.splitlines() if l.startswith("NEXTAUTH_URL")]
        self.assertTrue(len(lines) >= 1, ".env.example must define NEXTAUTH_URL")
        for line in lines:
            self.assertNotIn(":3000", line, (
                "NEXTAUTH_URL in .env.example must not use port 3000. "
                "Docker serves via nginx on port 80. Use http://localhost"
            ))

    def test_env_example_does_not_contain_nextauth_secret(self) -> None:
        """.env.example is committed to the repo and must never contain real secrets."""
        env_example = (ROOT / ".env.example").read_text()
        self.assertNotIn("NEXTAUTH_SECRET=", env_example, (
            "NEXTAUTH_SECRET must not appear in .env.example — "
            "it is committed to the repo. Use NEXTAUTH_SECRET_FILE via Docker secrets."
        ))

    def test_compose_app_env_has_hostname_binding(self) -> None:
        """Next.js standalone binds to the container hostname by default, not 0.0.0.0.
        Without HOSTNAME: 0.0.0.0, health checks fail because wget cannot reach
        the server even though the process is running."""
        compose = (ROOT / "docker-compose.yml").read_text()
        self.assertIn('HOSTNAME: "0.0.0.0"', compose, (
            "docker-compose.yml app environment must include HOSTNAME: \"0.0.0.0\". "
            "Next.js standalone binds to the container hostname otherwise."
        ))

    def test_compose_nextauth_url_default_has_no_port(self) -> None:
        """The NEXTAUTH_URL fallback in docker-compose must not include :3000.
        The app is served via nginx on port 80 inside Docker."""
        compose = (ROOT / "docker-compose.yml").read_text()
        # Extract NEXTAUTH_URL line
        for line in compose.splitlines():
            if "NEXTAUTH_URL" in line and ":-" in line:
                self.assertNotIn(":3000", line, (
                    "NEXTAUTH_URL default in docker-compose.yml must not use port 3000. "
                    "Use http://localhost (nginx on 80)."
                ))

    def test_middleware_csrf_secure_flag_uses_nextauth_url_not_node_env(self) -> None:
        """NODE_ENV=production in Docker even when serving plain HTTP.
        Keying the Secure cookie flag off NODE_ENV causes the CSRF cookie to be
        rejected by the browser over HTTP, silently breaking login after logout.
        Must check NEXTAUTH_URL scheme instead."""
        middleware = (ROOT / "src/middleware.ts").read_text()
        self.assertNotIn(
            "process.env.NODE_ENV === 'production'",
            middleware,
            "middleware.ts must not use NODE_ENV to set Secure cookie flag — "
            "NODE_ENV=production in Docker even on HTTP. "
            "Use: process.env.NEXTAUTH_URL?.startsWith('https') ?? false"
        )
        self.assertIn(
            "NEXTAUTH_URL",
            middleware,
            "middleware.ts must key Secure flag off NEXTAUTH_URL scheme"
        )

    def test_healthcheck_uses_127_0_0_1_not_localhost(self) -> None:
        """localhost DNS resolution can fail inside the container.
        Health checks must use the explicit IPv4 loopback 127.0.0.1."""
        compose = (ROOT / "docker-compose.yml").read_text()
        self.assertNotIn(
            "http://localhost:3000/api/health",
            compose,
            "Health check must use 127.0.0.1, not localhost — DNS can fail inside the container"
        )
        self.assertIn("http://127.0.0.1:3000/api/health", compose)

    def test_compose_app_does_not_expose_port_3000_publicly(self) -> None:
        """Port 3000 must only be exposed internally (expose:), not published (ports:).
        Traffic should only reach the app through nginx."""
        compose = (ROOT / "docker-compose.yml").read_text()
        self.assertNotIn('"3000:3000"', compose)
        self.assertNotIn("'3000:3000'", compose)
        self.assertIn("expose:", compose)


if __name__ == "__main__":
    unittest.main()
```

---

### File 2: `tests/test_data_invariants.py`

Catches data integrity failures. Reads `baseline.json` and `migrate-sprs-weights.sql` — no DB connection needed.

```python
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASELINE = ROOT / "scripts" / "data" / "baseline.json"
MIGRATION = ROOT / "scripts" / "migrate-sprs-weights.sql"

EXPECTED_CMMC_COUNT = 110
EXPECTED_ITAR_COUNT = 20
EXPECTED_WEIGHT_SUM = 314
EXPECTED_BASELINE_SPRS = -204  # 110 - 314
EXPECTED_5PT_COUNT = 44
EXPECTED_3PT_COUNT = 14
EXPECTED_1PT_COUNT = 52


class BaselineJsonInvariantTests(unittest.TestCase):

    def setUp(self) -> None:
        with open(BASELINE) as f:
            data = json.load(f)
        self.practices = data["practices"]
        self.cmmc = [p for p in self.practices if not p["practice_id"].startswith("ITAR")]
        self.itar = [p for p in self.practices if p["practice_id"].startswith("ITAR")]

    def test_practice_count(self) -> None:
        """baseline.json must contain exactly 110 CMMC + 20 ITAR practices."""
        self.assertEqual(len(self.cmmc), EXPECTED_CMMC_COUNT,
            f"Expected {EXPECTED_CMMC_COUNT} CMMC practices, got {len(self.cmmc)}")
        self.assertEqual(len(self.itar), EXPECTED_ITAR_COUNT,
            f"Expected {EXPECTED_ITAR_COUNT} ITAR practices, got {len(self.itar)}")

    def test_sprs_weight_sum(self) -> None:
        """CMMC practice weights must sum to 314 per DoD Assessment Methodology v1.2.1.
        If this fails, baseline.json was regenerated before migrate-sprs-weights.sql ran
        and the factory reset will clobber the correct weights."""
        total = sum(p["sprs_weight"] for p in self.cmmc)
        self.assertEqual(total, EXPECTED_WEIGHT_SUM,
            f"CMMC sprs_weight sum is {total}, expected {EXPECTED_WEIGHT_SUM}. "
            f"Run scripts/migrate-sprs-weights.sql then regenerate baseline.json.")

    def test_baseline_sprs_score(self) -> None:
        """At all-not-started baseline, SPRS score must equal -204."""
        total = sum(p["sprs_weight"] for p in self.cmmc)
        score = 110 - total
        self.assertEqual(score, EXPECTED_BASELINE_SPRS,
            f"Baseline SPRS score is {score}, expected {EXPECTED_BASELINE_SPRS}")

    def test_weight_tier_counts(self) -> None:
        """Exactly 44 five-point, 14 three-point, and 52 one-point CMMC practices."""
        count_5 = sum(1 for p in self.cmmc if p["sprs_weight"] == 5)
        count_3 = sum(1 for p in self.cmmc if p["sprs_weight"] == 3)
        count_1 = sum(1 for p in self.cmmc if p["sprs_weight"] == 1)
        self.assertEqual(count_5, EXPECTED_5PT_COUNT, f"Expected {EXPECTED_5PT_COUNT} five-point practices, got {count_5}")
        self.assertEqual(count_3, EXPECTED_3PT_COUNT, f"Expected {EXPECTED_3PT_COUNT} three-point practices, got {count_3}")
        self.assertEqual(count_1, EXPECTED_1PT_COUNT, f"Expected {EXPECTED_1PT_COUNT} one-point practices, got {count_1}")

    def test_no_zero_or_null_weights_in_cmmc(self) -> None:
        """No CMMC practice may have a null or zero weight — that signals a seed/migration failure."""
        bad = [p["practice_id"] for p in self.cmmc if not p.get("sprs_weight")]
        self.assertEqual(bad, [],
            f"These CMMC practices have null/zero sprs_weight: {bad}. "
            f"Run scripts/migrate-sprs-weights.sql.")

    def test_cmmc_is_customer_scored_true(self) -> None:
        """All 110 CMMC practices must have is_customer_scored=True.
        If null, the SPRS score calculation silently excludes them."""
        bad = [p["practice_id"] for p in self.cmmc if p.get("is_customer_scored") is not True]
        self.assertEqual(bad, [],
            f"These CMMC practices have is_customer_scored != true: {bad}")

    def test_itar_is_customer_scored_false(self) -> None:
        """ITAR overlay controls must have is_customer_scored=False.
        ITAR controls have no SPRS weight and must not contaminate the score."""
        bad = [p["practice_id"] for p in self.itar if p.get("is_customer_scored") is not False]
        self.assertEqual(bad, [],
            f"These ITAR practices have is_customer_scored != false: {bad}")

    def test_all_baseline_statuses_are_not_started(self) -> None:
        """The factory reset baseline must have every practice as Not Started.
        If any are Implemented, the baseline was generated from a dirty DB."""
        non_baseline = [
            p["practice_id"] for p in self.practices
            if p.get("status") != "Not Started"
        ]
        self.assertEqual(non_baseline, [],
            f"These practices in baseline.json are not 'Not Started': {non_baseline}. "
            f"Regenerate from a clean DB.")


class MigrationAlignmentTests(unittest.TestCase):
    """Verify that baseline.json and migrate-sprs-weights.sql agree on weights.
    If someone edits one without the other, the factory reset will break scoring."""

    def setUp(self) -> None:
        with open(BASELINE) as f:
            data = json.load(f)
        self.practices = {
            p["practice_id"]: p
            for p in data["practices"]
            if not p["practice_id"].startswith("ITAR")
        }
        sql = MIGRATION.read_text()
        # Parse 5-point list
        m5 = re.search(r"sprs_weight = 5 WHERE practice_id IN \(([^)]+)\)", sql, re.DOTALL)
        m3 = re.search(r"sprs_weight = 3 WHERE practice_id IN \(([^)]+)\)", sql, re.DOTALL)
        self.sql_5pt = set(re.findall(r"'([A-Z]+\.L2-[\d.]+)'", m5.group(1))) if m5 else set()
        self.sql_3pt = set(re.findall(r"'([A-Z]+\.L2-[\d.]+)'", m3.group(1))) if m3 else set()

    def test_five_point_practices_match_migration(self) -> None:
        """Every practice listed as 5-point in the SQL must be 5 in baseline.json."""
        for pid in self.sql_5pt:
            self.assertIn(pid, self.practices, f"{pid} in migration SQL but not in baseline.json")
            self.assertEqual(self.practices[pid]["sprs_weight"], 5,
                f"{pid} is 5-point in migration SQL but weight={self.practices[pid]['sprs_weight']} in baseline.json")

    def test_three_point_practices_match_migration(self) -> None:
        """Every practice listed as 3-point in the SQL must be 3 in baseline.json."""
        for pid in self.sql_3pt:
            self.assertIn(pid, self.practices, f"{pid} in migration SQL but not in baseline.json")
            self.assertEqual(self.practices[pid]["sprs_weight"], 3,
                f"{pid} is 3-point in migration SQL but weight={self.practices[pid]['sprs_weight']} in baseline.json")

    def test_one_point_practices_are_not_in_higher_tier_lists(self) -> None:
        """Practices not in the 5pt or 3pt SQL lists must be 1-point in baseline.json."""
        higher = self.sql_5pt | self.sql_3pt
        for pid, practice in self.practices.items():
            if pid not in higher:
                self.assertEqual(practice["sprs_weight"], 1,
                    f"{pid} is not in migration's 5pt or 3pt list but has weight={practice['sprs_weight']} in baseline.json")


if __name__ == "__main__":
    unittest.main()
```

---

### File 3: `tests/test_auth_flow_config.py`

Catches auth configuration bugs that only show up at runtime. All static — reads source files.

```python
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class AuthFlowConfigTests(unittest.TestCase):

    def test_signout_callback_url_is_relative(self) -> None:
        """signOut must use a relative callbackUrl, not a hardcoded host/port.
        NextAuth resolves relative URLs against NEXTAUTH_URL, so hardcoding
        localhost:3000 here would bypass nginx."""
        topnav = (ROOT / "src/components/layout/TopNav.tsx").read_text()
        self.assertIn("callbackUrl: '/login'", topnav,
            "signOut must use relative callbackUrl: '/login'")
        self.assertNotIn("callbackUrl: 'http://", topnav,
            "signOut callbackUrl must not be an absolute URL")

    def test_nextauth_secret_read_from_file_with_trim(self) -> None:
        """Docker secrets files often have trailing newlines. The secret reader
        must trim whitespace, otherwise the effective secret changes between
        reads and JWT validation fails inconsistently."""
        auth = (ROOT / "src/lib/auth.ts").read_text()
        self.assertIn(".trim()", auth,
            "getNextAuthSecret must call .trim() on the file contents to strip newlines")

    def test_login_page_uses_redirect_false(self) -> None:
        """signIn must use redirect: false so the app controls the redirect.
        Without this, NextAuth redirects to NEXTAUTH_URL/api/auth/callback which
        bypasses client-side error handling."""
        login = (ROOT / "src/app/login/page.tsx").read_text()
        self.assertIn("redirect: false", login,
            "Login page signIn call must use redirect: false")

    def test_auth_options_session_strategy_is_jwt(self) -> None:
        """Session strategy must be jwt, not database. The app has no session table
        and relies on JWT cookies."""
        auth = (ROOT / "src/lib/auth.ts").read_text()
        self.assertIn("strategy: 'jwt'", auth)

    def test_auth_options_has_explicit_sign_in_page(self) -> None:
        """pages.signIn must point to /login. Without this, NextAuth redirects to
        its built-in /api/auth/signin which is unstyled and skips rate limiting."""
        auth = (ROOT / "src/lib/auth.ts").read_text()
        self.assertIn("signIn: '/login'", auth)

    def test_nextauth_url_not_hardcoded_in_auth_source(self) -> None:
        """NEXTAUTH_URL must come from environment, never hardcoded in source.
        Hardcoded URLs survive into production images and are very hard to trace."""
        for path in [
            ROOT / "src/lib/auth.ts",
            ROOT / "src/app/api/auth/[...nextauth]/route.ts",
        ]:
            content = path.read_text()
            self.assertNotIn("localhost:3000", content,
                f"{path.name} must not contain hardcoded localhost:3000")


if __name__ == "__main__":
    unittest.main()
```

---

## Layer 2: Post-Deploy Smoke Test

### File: `scripts/smoke-test.sh`

Run after every `docker compose up --build`. Exits non-zero on any failure. Requires the stack to be up and healthy.

```bash
#!/usr/bin/env bash
# smoke-test.sh — Post-deploy verification for CMMC Dashboard
#
# Usage:
#   ./scripts/smoke-test.sh
#   ./scripts/smoke-test.sh http://localhost   # custom base URL
#
# Prerequisites: stack must be running (docker compose up -d)
# Exit code: 0 = all checks passed, 1 = something is broken

set -euo pipefail

BASE="${1:-http://localhost}"
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

# 1. Health endpoint returns healthy
check "Health endpoint returns 'healthy'" \
  bash -c "curl -sf $BASE/api/health | grep -q healthy"

# 2. Unauthenticated /overview redirects to /login (not :3000/login)
check "Unauthenticated /overview redirects to /login on port 80" \
  bash -c "curl -sI $BASE/overview | grep -E 'Location:' | grep -q '/login' && \
           curl -sI $BASE/overview | grep -E 'Location:' | grep -qv ':3000'"

# 3. Login returns a session cookie (not a 401)
COOKIE_JAR=$(mktemp)
LOGIN_RESULT=$(curl -sf -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "email=admin@localhost" \
  --data-urlencode "password=$(cat secrets/admin_password.txt 2>/dev/null || echo 'changeme')" \
  -w "%{http_code}" -o /dev/null 2>/dev/null || echo "000")

if grep -q "next-auth.session-token" "$COOKIE_JAR" 2>/dev/null; then
  green "Login sets session cookie"
  ((PASS++)) || true
else
  red "Login did not set session cookie (HTTP $LOGIN_RESULT)"
  ((FAIL++)) || true
fi

# 4. SPRS score is not -20 (the broken all-weights-equal-1 value)
SPRS=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/overview" 2>/dev/null | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('baselineSprsScore','missing'))" 2>/dev/null || echo "unavailable")

if [ "$SPRS" != "-20" ] && [ "$SPRS" != "unavailable" ] && [ "$SPRS" != "missing" ]; then
  green "SPRS baseline score is $SPRS (not the broken -20)"
  ((PASS++)) || true
else
  red "SPRS baseline score is $SPRS — weights are probably all 1 (run migrate-sprs-weights.sql)"
  ((FAIL++)) || true
fi

# 5. Logout redirects to /login on port 80 (not :3000/login)
LOGOUT_LOCATION=$(curl -sf -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/api/auth/signout" \
  -d "callbackUrl=/login" \
  -sI 2>/dev/null | grep -i "location:" || echo "no-redirect")

if echo "$LOGOUT_LOCATION" | grep -q "/login" && \
   ! echo "$LOGOUT_LOCATION" | grep -q ":3000"; then
  green "Logout redirects to /login (no :3000 port)"
  ((PASS++)) || true
else
  red "Logout redirect is wrong: $LOGOUT_LOCATION — check NEXTAUTH_URL in .env"
  ((FAIL++)) || true
fi

# 6. DB practice count is 130 (110 CMMC + 20 ITAR)
PRACTICE_COUNT=$(docker compose exec -T db psql -U cmmc_user -d cmmc_db -tAc \
  "SELECT COUNT(*) FROM practices;" 2>/dev/null || echo "0")
check "DB has 130 practices (110 CMMC + 20 ITAR)" \
  bash -c "[ '$PRACTICE_COUNT' = '130' ]"

# 7. SPRS weight sum in DB is 314
WEIGHT_SUM=$(docker compose exec -T db psql -U cmmc_user -d cmmc_db -tAc \
  "SELECT SUM(sprs_weight) FROM practices WHERE framework = 'CMMC';" 2>/dev/null || echo "0")
check "DB SPRS weight sum is 314 (not 110 = all-ones default)" \
  bash -c "[ '$WEIGHT_SUM' = '314' ]"

rm -f "$COOKIE_JAR"

echo "---"
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
```

Make it executable: `chmod +x scripts/smoke-test.sh`

---

## Layer 3: Startup DB Validation (App-Side)

### File: `scripts/validate-db.ts`

Run after seed/migrations and before generating a new baseline. Exits non-zero if the DB is in a bad state.

```typescript
// validate-db.ts — asserts DB invariants before baseline generation or deploy
// Usage: npx tsx scripts/validate-db.ts
//        docker compose exec app npx tsx /app/scripts/validate-db.ts

import sql from '../src/lib/db'

const ERRORS: string[] = []

function assert(condition: boolean, message: string) {
  if (!condition) ERRORS.push(message)
}

async function main() {
  console.log('Validating DB invariants...\n')

  // 1. Practice count
  const [{ count: practiceCount }] = await sql`SELECT COUNT(*)::int AS count FROM practices`
  assert(practiceCount === 130, `Practice count is ${practiceCount}, expected 130 (110 CMMC + 20 ITAR)`)

  const [{ count: cmmcCount }] = await sql`SELECT COUNT(*)::int AS count FROM practices WHERE framework = 'CMMC'`
  assert(cmmcCount === 110, `CMMC practice count is ${cmmcCount}, expected 110`)

  // 2. SPRS weight sum
  const [{ total }] = await sql`SELECT SUM(sprs_weight)::int AS total FROM practices WHERE framework = 'CMMC'`
  assert(total === 314,
    `SPRS weight sum is ${total}, expected 314. Run scripts/migrate-sprs-weights.sql first.`)

  // 3. Weight tier distribution
  const [{ five_pt, three_pt, one_pt }] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE sprs_weight = 5)::int AS five_pt,
      COUNT(*) FILTER (WHERE sprs_weight = 3)::int AS three_pt,
      COUNT(*) FILTER (WHERE sprs_weight = 1)::int AS one_pt
    FROM practices WHERE framework = 'CMMC'
  `
  assert(five_pt === 44, `5-point practice count is ${five_pt}, expected 44`)
  assert(three_pt === 14, `3-point practice count is ${three_pt}, expected 14`)
  assert(one_pt === 52, `1-point practice count is ${one_pt}, expected 52`)

  // 4. No null weights
  const [{ null_count }] = await sql`
    SELECT COUNT(*)::int AS null_count FROM practices
    WHERE framework = 'CMMC' AND sprs_weight IS NULL
  `
  assert(null_count === 0, `${null_count} CMMC practices have NULL sprs_weight`)

  // 5. NEXTAUTH_URL env var
  const nextauthUrl = process.env.NEXTAUTH_URL ?? ''
  assert(!nextauthUrl.includes(':3000'),
    `NEXTAUTH_URL is "${nextauthUrl}" — contains :3000. Set to http://localhost (nginx port 80).`)
  assert(nextauthUrl.length > 0, 'NEXTAUTH_URL is not set')

  // 6. Domains exist
  const [{ domain_count }] = await sql`SELECT COUNT(*)::int AS domain_count FROM domains`
  assert(domain_count === 14, `Domain count is ${domain_count}, expected 14`)

  // Report
  if (ERRORS.length === 0) {
    console.log('All invariants passed.\n')
    process.exit(0)
  } else {
    console.error(`${ERRORS.length} invariant(s) failed:\n`)
    ERRORS.forEach(e => console.error(`  ✗ ${e}`))
    console.error('')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Validation error:', err)
  process.exit(1)
})
```

Add this to `package.json` scripts:
```json
"validate-db": "node --env-file=.env ./node_modules/.bin/tsx scripts/validate-db.ts"
```

---

## Implementation Checklist

```
[ ] Create tests/test_deployment_config.py
[ ] Create tests/test_data_invariants.py
[ ] Create tests/test_auth_flow_config.py
[ ] Create scripts/smoke-test.sh  →  chmod +x
[ ] Create scripts/validate-db.ts
[ ] Add "validate-db" to package.json scripts
[ ] Run python -m unittest discover -s tests  →  all pass
[ ] Run scripts/smoke-test.sh against live stack  →  all pass
```

## How to Run Everything

```bash
# Static tests (no Docker required)
python -m unittest discover -s tests -v

# Post-deploy smoke test (Docker stack must be up)
./scripts/smoke-test.sh

# DB invariant check (from inside running container or with local .env)
npm run validate-db

# Or against the container directly
docker compose exec app npx tsx scripts/validate-db.ts
```

## When to Run

| Trigger | Run |
|---------|-----|
| Before every commit | Static tests (`python -m unittest`) |
| After `docker compose up --build` | Smoke test |
| Before generating a new `baseline.json` | `npm run validate-db` |
| After factory reset | Smoke test + `validate-db` |
| After editing `migrate-sprs-weights.sql` or `baseline.json` | Static tests (migration alignment test will catch drift) |
