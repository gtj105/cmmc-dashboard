# Docs, Deployment & Structural Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auto-migrations on startup, simplified deployment, updated docs, overlay consolidation.

**Spec:** docs/superpowers/specs/2026-03-28-docs-deployment-cleanup-design.md

**Tech Stack:** Next.js 14, postgres.js, Docker Compose, TypeScript

---

## Task 1: Auto-migration infrastructure

**Files:**
- Create: `src/instrumentation.ts`
- Create: `src/lib/run-migrations.ts`
- Modify: `Dockerfile`

- [ ] **Step 1: Create src/lib/run-migrations.ts**

```typescript
// src/lib/run-migrations.ts
//
// Runs pending SQL migrations on startup.
// Tracks applied migrations in schema_migrations table.
// Called from src/instrumentation.ts (Next.js lifecycle hook).

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import sql from '@/lib/db'

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations')

async function ensureMigrationsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const rows = await sql<{ filename: string }[]>`
    SELECT filename FROM schema_migrations ORDER BY filename
  `
  return new Set(rows.map(r => r.filename))
}

export async function runMigrations(): Promise<void> {
  try {
    await ensureMigrationsTable()

    let files: string[]
    try {
      const entries = await readdir(MIGRATIONS_DIR)
      files = entries.filter(f => f.endsWith('.sql')).sort()
    } catch {
      // migrations/ dir not present (e.g. test environment) — skip silently
      return
    }

    const applied = await getAppliedMigrations()
    const pending = files.filter(f => !applied.has(f))

    if (pending.length === 0) return

    console.log(`[migrations] Running ${pending.length} pending migration(s)...`)

    for (const filename of pending) {
      const filepath = path.join(MIGRATIONS_DIR, filename)
      const sqlText = await readFile(filepath, 'utf8')

      // Run each migration as a transaction
      await sql.begin(async (tx) => {
        // Execute the SQL (postgres.js unsafeRaw for raw DDL)
        await tx.unsafe(sqlText)
        await tx`
          INSERT INTO schema_migrations (filename) VALUES (${filename})
        `
      })

      console.log(`[migrations] ✓ ${filename}`)
    }

    console.log(`[migrations] Done.`)
  } catch (err) {
    console.error('[migrations] Failed:', err)
    throw err
  }
}
```

- [ ] **Step 2: Create src/instrumentation.ts**

```typescript
// src/instrumentation.ts
// Next.js lifecycle hook — runs once on server startup (dev and prod).
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runMigrations } = await import('./lib/run-migrations')
    await runMigrations()
  }
}
```

- [ ] **Step 3: Update Dockerfile — copy migrations into image**

In the runner stage, after the existing COPY lines and before `USER nextjs`, add:
```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrations ./migrations
```

- [ ] **Step 4: Enable instrumentation in next.config**

Check if `next.config.ts` or `next.config.js` exists. If it has `experimental` section, add `instrumentationHook: true`. If no config exists, create `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  output: 'standalone',
}
module.exports = nextConfig
```
If a config already exists, just add `instrumentationHook: true` to the `experimental` block.

- [ ] **Step 5: Type-check**
```bash
cd /Users/gtj105/repos/cmmc-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**
```bash
git add src/instrumentation.ts src/lib/run-migrations.ts Dockerfile next.config.*
git commit -m "feat: auto-run SQL migrations on startup via Next.js instrumentation hook"
```

---

## Task 2: Update start-dev.sh

**Files:**
- Modify: `scripts/start-dev.sh`

- [ ] **Step 1: Add secrets bootstrap check**

Read the current file, then replace the content with:
```sh
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
```

- [ ] **Step 2: Commit**
```bash
git add scripts/start-dev.sh
git commit -m "fix: start-dev.sh auto-bootstraps secrets on first run"
```

---

## Task 3: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read current README**

Read `/Users/gtj105/repos/cmmc-dashboard/README.md`

- [ ] **Step 2: Update Security section**

Replace the existing Security bullet list with:
```markdown
## Security

- Secrets (DB password, NextAuth secret) generated by `setup-secrets.sh` and stored in `./secrets/` — never committed to git; NextAuth secret exposed to Edge middleware via secure entrypoint script, not `.env`
- Passwords are bcrypt-hashed (10 rounds); minimum 12 characters enforced
- CSRF double-submit cookie protection on all mutation endpoints with timing-safe comparison
- JWT sessions with 24-hour expiry; tokens are revoked server-side on logout and on user deletion — revocation is enforced on every API request via `getAuthSession()`
- Login rate limiting persisted in the database (survives restarts) — 5 attempts before 15-minute lockout
- Full Content Security Policy, nginx rate limiting (10 req/s API, 3 req/s login), structured audit log
- Zod input validation on all API routes and on backup restore — row-level schema enforcement rejects malformed payloads before hitting the DB
- Backup restore never accepts password hashes from the file — all restored users are force-prompted to set a new password
- Evidence URLs validated: http/https scheme only, 2048-character limit
- The database port is bound to `127.0.0.1` only and never exposed to the network
- Health endpoint returns generic errors only — detailed DB errors are logged server-side
```

- [ ] **Step 3: Update Architecture DB section**

In the Architecture section, update the PostgreSQL line to:
```markdown
- **PostgreSQL 15** — practices, POA&M, evidence metadata, audit log, session revocation, login rate limiting, user token invalidation, migration tracking
```

- [ ] **Step 4: Update Getting Started**

In the Getting started section, update step 3 to remove any manual migration references. The bootstrap command should be the only step (migrations run automatically).

- [ ] **Step 5: Commit**
```bash
git add README.md
git commit -m "docs: update README security section and architecture for recent hardening"
```

---

## Task 4: Update docs/DEVELOPMENT.md

**Files:**
- Modify: `docs/DEVELOPMENT.md`

- [ ] **Step 1: Read the file**

Read `/Users/gtj105/repos/cmmc-dashboard/docs/DEVELOPMENT.md`

- [ ] **Step 2: Update setup steps**

Find the setup/getting-started section and update it to reflect:
- `start-dev.sh` now auto-bootstraps secrets (no separate setup-secrets.sh step needed)
- Migrations run automatically on startup — remove any manual `psql` migration steps
- Add note: "On first run, after the stack is healthy, run `npm run seed` once to populate baseline data"

- [ ] **Step 3: Commit**
```bash
git add docs/DEVELOPMENT.md
git commit -m "docs: update DEVELOPMENT.md — auto-migrations, simplified setup"
```

---

## Task 5: Update docs/DEPLOYMENT.md

**Files:**
- Modify: `docs/DEPLOYMENT.md`

- [ ] **Step 1: Read the file**

Read `/Users/gtj105/repos/cmmc-dashboard/docs/DEPLOYMENT.md`

- [ ] **Step 2: Update first-deploy section**

Replace manual migration steps with:
```
1. ./scripts/setup-secrets.sh
2. docker compose up -d --build     # migrations run automatically on boot
3. docker compose exec app npm run seed   # first time only
```

- [ ] **Step 3: Update upgrade/redeploy section**

```bash
git pull && docker compose up -d --build
```
Add note: "New migrations run automatically when the app boots."

- [ ] **Step 4: Commit**
```bash
git add docs/DEPLOYMENT.md
git commit -m "docs: update DEPLOYMENT.md — auto-migrations, one-command redeploy"
```

---

## Task 6: Update docs/SECURITY-AND-OPERATIONS.md

**Files:**
- Modify: `docs/SECURITY-AND-OPERATIONS.md`

- [ ] **Step 1: Read the file**

Read `/Users/gtj105/repos/cmmc-dashboard/docs/SECURITY-AND-OPERATIONS.md`

- [ ] **Step 2: Add new section**

Add a new section titled `## Security Hardening — March 2026` with these 10 controls documented concisely:

1. **Token revocation enforced on every request** — `getAuthSession()` checks `revoked_tokens` on every API call. Revoked tokens (logout) are rejected within milliseconds, not just at session expiry.
2. **User deletion invalidates active sessions** — deleting a user writes to `user_invalidations` table; any JWT issued before that timestamp is rejected on next request.
3. **DB-backed login rate limiter** — `login_attempts` table replaces in-memory Map; lockout state survives container restarts and applies across all instances.
4. **Backup file size limit** — upload endpoint rejects files > 10 MB before reading into memory.
5. **Zod row-level validation on restore** — every row in a backup file is validated against strict schemas before the transaction begins.
6. **Password hash injection blocked** — restore never reads `password_hash` from backup files; all restored users get a locked hash and must set a new password.
7. **Timing-safe CSRF comparison** — `crypto.timingSafeEqual` used for token comparison to prevent timing side-channel attacks.
8. **Conditional Secure cookie flag** — CSRF cookie `Secure` flag set only when `NEXTAUTH_URL` starts with `https://`.
9. **Health endpoint error masking** — DB connection errors logged server-side only; generic message returned to unauthenticated callers.
10. **Evidence URL validation** — URL-typed evidence must use `http:` or `https:` scheme and be ≤ 2048 characters.

- [ ] **Step 3: Update NEXTAUTH_SECRET section**

Document that `NEXTAUTH_SECRET` is now handled by `docker-entrypoint.sh` in production (reads from Docker secret file at runtime) and auto-written to `.env` by `setup-secrets.sh` for dev (Next.js auto-loads `.env`).

- [ ] **Step 4: Commit**
```bash
git add docs/SECURITY-AND-OPERATIONS.md
git commit -m "docs: document 10 new security controls in SECURITY-AND-OPERATIONS.md"
```

---

## Task 7: Update docs/RUNBOOK.md

**Files:**
- Modify: `docs/RUNBOOK.md`

- [ ] **Step 1: Read the file**

Read `/Users/gtj105/repos/cmmc-dashboard/docs/RUNBOOK.md`

- [ ] **Step 2: Add new DB tables**

Find the database tables section and add:
- `login_attempts` — tracks failed login attempts per email for rate limiting; auto-cleared on successful login
- `user_invalidations` — records when a user's tokens were invalidated (on deletion); used to reject JWTs issued before this time
- `schema_migrations` — tracks applied SQL migration files; prevents double-application

- [ ] **Step 3: Update migration notes**

If there's a section about running migrations manually, update it to note that migrations now run automatically on startup. The `scripts/migrations/` directory is the source of truth.

- [ ] **Step 4: Commit**
```bash
git add docs/RUNBOOK.md
git commit -m "docs: add new DB tables and auto-migration notes to RUNBOOK.md"
```

---

## Task 8: Update docs/architecture.html

**Files:**
- Modify: `docs/architecture.html`

- [ ] **Step 1: Read the file**

Read `/Users/gtj105/repos/cmmc-dashboard/docs/architecture.html`

- [ ] **Step 2: Add new DB tables to schema section**

Find the database schema table/list and add:
- `login_attempts` — email, count, locked_until — persistent rate limiting
- `user_invalidations` — user_id, invalidated_at — token invalidation on user deletion
- `schema_migrations` — filename, applied_at — migration tracking

- [ ] **Step 3: Add getAuthSession to auth flow**

Find the authentication/auth layer section and add a note or diagram update showing:
- Every API request goes through `getAuthSession()` (not raw `getServerSession`)
- `getAuthSession()` checks both `revoked_tokens` (jti) AND `user_invalidations` (user_id + iat)

- [ ] **Step 4: Commit**
```bash
git add docs/architecture.html
git commit -m "docs: update architecture.html with new DB tables and auth revocation flow"
```

---

## Task 9: Update docs/improvement-plan.html

**Files:**
- Modify: `docs/improvement-plan.html`

- [ ] **Step 1: Read the file**

Read `/Users/gtj105/repos/cmmc-dashboard/docs/improvement-plan.html`

- [ ] **Step 2: Mark completed items and add Phase 5**

Add a new Phase 5 section (or extend Phase 4) marking these as complete:
- Token revocation enforced on every API request ✓
- User token invalidation on deletion ✓
- DB-backed login rate limiter (survives restarts) ✓
- Zod row-level validation on backup restore ✓
- Backup password hash injection blocked ✓
- Timing-safe CSRF token comparison ✓
- Health endpoint error masking ✓
- Evidence URL validation ✓
- Auto-migrations on startup ✓
- Simplified deployment (one-command dev and prod) ✓
- Entrypoint-based NEXTAUTH_SECRET for Edge middleware ✓

- [ ] **Step 3: Commit**
```bash
git add docs/improvement-plan.html
git commit -m "docs: mark security hardening and deployment improvements complete in improvement-plan.html"
```

---

## Task 10: Structural cleanup

**Files:**
- Modify: `.gitignore`
- Delete: `.env.bak`
- Create: `src/lib/overlays/` (directory with moved files)
- Modify: all files importing from overlay modules

- [ ] **Step 1: Update .gitignore**

Read `.gitignore`, then add these lines:
```
.env.bak
*.env.bak
tsconfig.tsbuildinfo
```

- [ ] **Step 2: Delete .env.bak**
```bash
rm -f /Users/gtj105/repos/cmmc-dashboard/.env.bak
```

- [ ] **Step 3: Create overlay module directory and move files**

Create `src/lib/overlays/` directory. Move these files:
- `src/lib/overlays.ts` → `src/lib/overlays/types.ts`
- `src/lib/overlay-queries.ts` → `src/lib/overlays/queries.ts`
- `src/lib/overlay-scoring.ts` → `src/lib/overlays/scoring.ts`
- `src/lib/overlay-resolution.ts` → `src/lib/overlays/resolution.ts`

Keep `src/app/overlays/overlay-page-data.ts` and `src/app/overlays/overlay-page-state.ts` in place (they're page-level concerns).

Create `src/lib/overlays/index.ts` that re-exports everything:
```typescript
export * from './types'
export * from './queries'
export * from './scoring'
export * from './resolution'
```

- [ ] **Step 4: Update all imports**

Find all files importing from the old paths and update them:
- `from '@/lib/overlays'` → `from '@/lib/overlays'` (same — index.ts handles it)
- `from '@/lib/overlay-queries'` → `from '@/lib/overlays/queries'` or `from '@/lib/overlays'`
- `from '@/lib/overlay-scoring'` → `from '@/lib/overlays/scoring'` or `from '@/lib/overlays'`
- `from '@/lib/overlay-resolution'` → `from '@/lib/overlays/resolution'` or `from '@/lib/overlays'`

- [ ] **Step 5: Type-check**
```bash
cd /Users/gtj105/repos/cmmc-dashboard && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "refactor: consolidate overlay modules into src/lib/overlays/, update .gitignore"
```

---

## Task 11: Final verification

- [ ] **Step 1: Type-check**
```bash
cd /Users/gtj105/repos/cmmc-dashboard && npx tsc --noEmit 2>&1
```

- [ ] **Step 2: Build**
```bash
cd /Users/gtj105/repos/cmmc-dashboard && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Verify all docs files updated**
```bash
git log --oneline -15
```

- [ ] **Step 4: Push**
```bash
git push
```
