# Docs, Deployment & Structural Cleanup Design

**Goal:** Update all documentation to reflect recent security hardening, add auto-migrations on startup, simplify deployment to minimum commands, and consolidate overlay modules.

**Architecture:** Auto-migrations via Next.js `instrumentation.ts` hook; docs updated in-place; overlay logic consolidated into `src/lib/overlays/`; `.gitignore` cleanup.

**Date:** 2026-03-28

---

## Part 1 — Auto-Migration on Startup

### New files
- `src/instrumentation.ts` — Next.js lifecycle hook, runs `runMigrations()` once on server start in both dev and prod
- `src/lib/run-migrations.ts` — creates `schema_migrations` tracking table, reads `.sql` files from `migrations/` dir, runs unapplied ones in filename order, records applied filenames
- `migrations/` — copied from `scripts/migrations/` into Docker image by Dockerfile

### Migration tracking table
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Dockerfile change
Add to runner stage (after existing COPY lines):
```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrations ./migrations
```

### Dev behavior
`next dev` already calls `instrumentation.ts` on startup. Migrations run automatically before first request is served.

### Prod behavior
`node server.js` (via entrypoint) calls `instrumentation.ts`. Migrations run before app accepts traffic.

---

## Part 2 — Simplified Deployment

### start-dev.sh (update)
Add secrets bootstrap check at top:
```sh
if [ ! -f "./secrets/postgres_password.txt" ] || [ ! -f "./secrets/nextauth_secret.txt" ]; then
  echo "Secrets not found — running setup-secrets.sh..."
  bash ./scripts/setup-secrets.sh
fi
```
Then existing `docker compose up -d` command.

### Dev workflow (new developer, first time ever)
```bash
git clone <repo> && cd cmmc-dashboard
./scripts/start-dev.sh          # generates secrets + starts stack (migrations auto-run)
# wait ~60s, then:
docker compose -p cmmc-dev -f docker-compose.yml -f docker-compose.dev.yml exec app npm run seed
```
Login: `admin@localhost` / `admin`

### Prod workflow (first deploy)
```bash
./scripts/setup-secrets.sh
docker compose up -d --build    # migrations auto-run on boot
docker compose exec app npm run seed
```

### Prod workflow (updates)
```bash
git pull && docker compose up -d --build   # one command; new migrations auto-run
```

---

## Part 3 — Documentation Updates

### README.md
- Update Security section: add token revocation enforced on every request, user invalidation on deletion, DB-backed rate limiter, Zod row validation on backup restore, timing-safe CSRF, entrypoint-based secret handling
- Update Architecture section: add `login_attempts`, `user_invalidations`, `schema_migrations` to DB tables listed
- Remove any manual migration steps from setup flow
- Keep overall structure (What it does, Getting started, Day-to-day, Security, Architecture)

### docs/DEVELOPMENT.md
- Remove any mention of manually running migrations
- Update setup steps to reflect `start-dev.sh` auto-bootstraps secrets
- Note that migrations run automatically on `next dev` start

### docs/DEPLOYMENT.md
- Update first-deploy steps: `setup-secrets.sh` + `docker compose up -d --build` + seed
- Note migrations run automatically — no manual `psql` step
- Update upgrade/redeploy to single `git pull && docker compose up -d --build`

### docs/SECURITY-AND-OPERATIONS.md
New section: **Security Hardening (2026-03-28)**
Document all 10 new controls:
1. Token revocation enforced on every API request via `getAuthSession()`
2. User deletion immediately invalidates all active tokens via `user_invalidations` table
3. DB-backed login rate limiter (`login_attempts` table) — survives restarts
4. Backup file size limit (10 MB) on upload
5. Zod row-level validation on backup restore — rejects malformed payloads
6. Backup restore never accepts `password_hash` from file — always forces password reset
7. Timing-safe CSRF token comparison
8. `csrfCookieHeaders()` sets `Secure` flag only when `NEXTAUTH_URL` uses https
9. Health endpoint masks DB error details (logged server-side only)
10. Evidence URLs validated: http/https only, max 2048 chars

### docs/RUNBOOK.md
- Add `login_attempts`, `user_invalidations`, `schema_migrations` to DB tables section
- Note migrations are tracked — no manual re-run risk

### docs/architecture.html
Add to DB schema section: `login_attempts`, `user_invalidations`, `schema_migrations`
Add to component diagram: `getAuthSession()` layer showing dual revocation check (jti + user_invalidations)
Update security flow to show token revocation on every request

### docs/improvement-plan.html
Mark these items as complete in Phase 4 or add as new completed Phase 5:
- Token revocation enforced on every request ✓
- User token invalidation on deletion ✓
- DB-backed login rate limiter ✓
- Zod row validation on restore ✓
- Backup password hash injection blocked ✓
- Timing-safe CSRF ✓
- Health endpoint hardened ✓
- Evidence URL validation ✓
- Auto-migrations on startup ✓
- Simplified deployment (one-command) ✓

---

## Part 4 — Structural Cleanup

### .gitignore additions
```
.env.bak
*.env.bak
tsconfig.tsbuildinfo
```

### Delete artifacts
- `.env.bak` (root)

### Overlay module consolidation
Move these files into `src/lib/overlays/`:
- `src/lib/overlays.ts` → `src/lib/overlays/types.ts`
- `src/lib/overlay-queries.ts` → `src/lib/overlays/queries.ts`
- `src/lib/overlay-scoring.ts` → `src/lib/overlays/scoring.ts`
- `src/lib/overlay-resolution.ts` → `src/lib/overlays/resolution.ts`
- `src/app/overlays/overlay-page-data.ts` → `src/lib/overlays/page-data.ts`
- `src/app/overlays/overlay-page-state.ts` → stays in `src/app/overlays/` (UI state, belongs with page)

Create `src/lib/overlays/index.ts` barrel that re-exports everything.
Update all imports across the codebase.

### File naming standardization
Rename in `src/lib/`:
- No renames needed (already kebab-case consistently)

Rename in `src/app/`:
- `src/app/overlays/overlay-page-data.ts` moves to lib (above)
- Leave page-level files in their route folders

---

## Out of Scope
- Splitting large component files (deferred — Option C)
- SSL setup changes
- Seed automation (first-time seed still manual)
