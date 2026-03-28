# Security Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 10 security vulnerabilities identified in the code review — 4 Critical and 6 Important.

**Architecture:** Add a shared `getAuthSession()` helper that enforces token revocation on every API request; persist revocation state in the DB (new `user_invalidations` table); add Zod row-level validation to restore; harden several smaller issues (CSRF timing, URL validation, health endpoint, rate limiter).

**Tech Stack:** Next.js 14 App Router, NextAuth.js JWT, postgres.js, Zod, Node.js `crypto`

---

## File Map

| File | Change |
|------|--------|
| `scripts/migrations/005-auth-hardening.sql` | NEW — `login_attempts` and `user_invalidations` tables |
| `src/lib/token-revocation.ts` | Add `invalidateUser()` and `isUserInvalidated()` |
| `src/lib/get-session.ts` | NEW — `getAuthSession()` helper with revocation checks |
| `src/lib/auth.ts` | Replace in-memory rate limiter with DB-backed one |
| `src/lib/restore.ts` | Add Zod schemas; always ignore `password_hash`; extract audit-log truncation |
| `src/lib/api-csrf.ts` | Use `crypto.timingSafeEqual` |
| `src/lib/csrf.ts` | Conditional `Secure` flag in `csrfCookieHeaders()` |
| `src/app/api/health/route.ts` | Mask DB error message |
| `src/app/api/admin/backup/import/route.ts` | File size limit |
| `src/app/api/admin/factory-reset/route.ts` | Fix audit action; truncate audit log here (not in restore) |
| `src/app/api/admin/users/[id]/route.ts` | Call `invalidateUser()` on DELETE |
| `src/app/api/practices/[id]/evidence/route.ts` | Validate URL scheme |
| All 19 API routes using `getServerSession` | Replace with `getAuthSession` |

---

## Task 1: DB migration — login_attempts and user_invalidations tables

**Files:**
- Create: `scripts/migrations/005-auth-hardening.sql`

- [ ] **Step 1: Write the migration**

```sql
-- scripts/migrations/005-auth-hardening.sql
-- ─────────────────────────────────────────────────────────────────
-- Migration 005: Auth Hardening
-- 1. login_attempts — persistent rate limiting (survives restarts)
-- 2. user_invalidations — revoke all tokens for a user on delete
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS login_attempts (
  email         TEXT PRIMARY KEY,
  count         INT NOT NULL DEFAULT 0,
  locked_until  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_invalidations (
  user_id       INT PRIMARY KEY,
  invalidated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 2: Apply the migration**

```bash
# From repo root — adjust connection string as needed
psql "$DATABASE_URL" -f scripts/migrations/005-auth-hardening.sql
```

Expected: `CREATE TABLE` twice, no errors.

- [ ] **Step 3: Commit**

```bash
git add scripts/migrations/005-auth-hardening.sql
git commit -m "feat: add login_attempts and user_invalidations tables (migration 005)"
```

---

## Task 2: Extend token-revocation with user invalidation

**Files:**
- Modify: `src/lib/token-revocation.ts`

- [ ] **Step 1: Replace the file contents**

```typescript
/**
 * token-revocation.ts
 *
 * Two revocation mechanisms:
 *
 * 1. Per-token revocation (jti-based): used on logout.
 *    Inserts the token's jti into revoked_tokens.
 *
 * 2. Per-user revocation (user_id-based): used on user deletion.
 *    Inserts a row into user_invalidations with the current timestamp.
 *    Any token issued BEFORE that timestamp is treated as revoked.
 *    The user row may no longer exist — user_invalidations is separate.
 */

import sql from '@/lib/db'

/** Insert a jti into the revoked_tokens table. expiresAt = when the JWT would have expired. */
export async function revokeToken(jti: string, expiresAt: Date): Promise<void> {
  await sql`
    INSERT INTO revoked_tokens (jti, expires_at)
    VALUES (${jti}, ${expiresAt.toISOString()})
    ON CONFLICT (jti) DO NOTHING
  `
}

/** Returns true if the jti is in the revoked_tokens table (and not yet expired). */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  await sql`DELETE FROM revoked_tokens WHERE expires_at < NOW()`
  const [row] = await sql`SELECT 1 FROM revoked_tokens WHERE jti = ${jti}`
  return !!row
}

/**
 * Revoke all tokens for a user by recording the current time.
 * Any JWT with iat < invalidated_at is treated as revoked.
 * Call this when deleting a user.
 */
export async function invalidateUser(userId: number): Promise<void> {
  await sql`
    INSERT INTO user_invalidations (user_id, invalidated_at)
    VALUES (${userId}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET invalidated_at = NOW()
  `
}

/**
 * Returns true if the user has been invalidated after the given token issue time.
 * iat is the JWT "issued at" timestamp (seconds since epoch).
 */
export async function isUserInvalidated(userId: number, iat: number): Promise<boolean> {
  const issuedAt = new Date(iat * 1000)
  const [row] = await sql`
    SELECT 1 FROM user_invalidations
    WHERE user_id = ${userId} AND invalidated_at > ${issuedAt.toISOString()}
  `
  return !!row
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/token-revocation.ts
git commit -m "feat: add invalidateUser and isUserInvalidated to token-revocation"
```

---

## Task 3: Create shared getAuthSession() helper

This is the fix for **Critical Issue #1** — revoked tokens not checked on API requests.

**Files:**
- Create: `src/lib/get-session.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/get-session.ts
//
// Drop-in replacement for getServerSession(getAuthOptions()) that also
// enforces token revocation. Use this in ALL API routes.

import { getServerSession, Session } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { isTokenRevoked, isUserInvalidated } from '@/lib/token-revocation'

/**
 * Returns the session if the request is authenticated and the token is not revoked.
 * Returns null if: not authenticated, token revoked at logout, or user was invalidated.
 */
export async function getAuthSession(): Promise<Session | null> {
  const session = await getServerSession(getAuthOptions())
  if (!session) return null

  const jti = (session.user as Record<string, unknown>)?.jti as string | undefined
  const userId = (session.user as Record<string, unknown>)?.id as string | undefined
  const token = session as unknown as Record<string, unknown>
  const iat = token.iat as number | undefined

  // Check per-token revocation (logout)
  if (jti && (await isTokenRevoked(jti))) return null

  // Check per-user invalidation (user deleted)
  if (userId && iat && (await isUserInvalidated(parseInt(userId, 10), iat))) return null

  return session
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/get-session.ts
git commit -m "feat: add getAuthSession() — enforces token and user revocation on every request"
```

---

## Task 4: Replace getServerSession in all 19 API routes

This wires `getAuthSession()` into every protected route.

**Files (all modify):**
- `src/app/api/admin/audit/route.ts`
- `src/app/api/admin/backup/export/route.ts`
- `src/app/api/admin/backup/import/route.ts`
- `src/app/api/admin/factory-reset/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/burndown/route.ts`
- `src/app/api/domains/route.ts`
- `src/app/api/evidence/[...path]/route.ts`
- `src/app/api/overlays/[key]/mappings/route.ts`
- `src/app/api/overlays/[key]/toggle/route.ts`
- `src/app/api/overlays/route.ts`
- `src/app/api/poam/[id]/route.ts`
- `src/app/api/poam/route.ts`
- `src/app/api/practices/[id]/evidence/[eid]/route.ts`
- `src/app/api/practices/[id]/evidence/route.ts`
- `src/app/api/practices/[id]/objectives/route.ts`
- `src/app/api/practices/[id]/route.ts`
- `src/app/api/user/password/route.ts`

- [ ] **Step 1: In each file, replace the import**

Old:
```typescript
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
```

New (add alongside or replace):
```typescript
import { getAuthSession } from '@/lib/get-session'
```

- [ ] **Step 2: In each file, replace the call**

Old:
```typescript
const session = await getServerSession(getAuthOptions())
```

New:
```typescript
const session = await getAuthSession()
```

Note: some routes import `getAuthOptions` for other purposes — only remove it if it's only used for `getServerSession`. The `getAuthOptions` import in `src/app/api/auth/[...nextauth]/route.ts` must NOT be changed (NextAuth needs it directly).

- [ ] **Step 3: Verify each file builds cleanly**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors related to `getServerSession` or `getAuthOptions`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/
git commit -m "fix: replace getServerSession with getAuthSession in all API routes (Critical #1)"
```

---

## Task 5: Wire invalidateUser into user DELETE route

This fixes **Critical Issue #2** — deleted users retain valid sessions.

**Files:**
- Modify: `src/app/api/admin/users/[id]/route.ts`

- [ ] **Step 1: Add the import**

Add to the imports at the top:
```typescript
import { invalidateUser } from '@/lib/token-revocation'
```

- [ ] **Step 2: Call invalidateUser before the DELETE**

In the `DELETE` handler, after the `SELECT id, email FROM users WHERE id = ${id}` query and before the `DELETE FROM users` query, add:

```typescript
// Invalidate all tokens for this user before deleting the row.
// This prevents the deleted user's JWT from working for the remaining token lifetime.
await invalidateUser(id)
```

The DELETE block should look like:
```typescript
try {
  const [user] = await sql<{ id: number; email: string }[]>`
    SELECT id, email FROM users WHERE id = ${id}
  `
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  // Invalidate all tokens for this user before deleting the row
  await invalidateUser(id)
  const [deleted] = await sql<{ id: number }[]>`
    DELETE FROM users WHERE id = ${id} RETURNING id
  `
  if (!deleted) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  await audit({ action: 'user.deleted', actor: session!.user.email ?? 'admin', target: user.email, ip: getClientIp(_req.headers) })
  return new NextResponse(null, { status: 204 })
} catch {
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/users/[id]/route.ts
git commit -m "fix: invalidate user tokens before deletion (Critical #2)"
```

---

## Task 6: Persistent DB-backed login rate limiter

This fixes **Important Issue #5** — in-memory rate limiter is lost on restart.

**Files:**
- Modify: `src/lib/auth.ts`

- [ ] **Step 1: Replace the in-memory rate limiter with DB queries**

Remove the three functions `isLockedOut`, `recordFailure`, `clearFailures` and the `loginAttempts` Map. Replace with:

```typescript
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

async function isLockedOut(email: string): Promise<boolean> {
  const [rec] = await sql<{ count: number; locked_until: Date | null }[]>`
    SELECT count, locked_until FROM login_attempts WHERE email = ${email}
  `
  if (!rec) return false
  if (rec.locked_until && new Date(rec.locked_until) > new Date()) return true
  // Expired lockout — reset
  if (rec.locked_until && new Date(rec.locked_until) <= new Date()) {
    await sql`DELETE FROM login_attempts WHERE email = ${email}`
  }
  return false
}

async function recordFailure(email: string): Promise<void> {
  await sql`
    INSERT INTO login_attempts (email, count, locked_until)
    VALUES (${email}, 1, NULL)
    ON CONFLICT (email) DO UPDATE
      SET count = login_attempts.count + 1,
          locked_until = CASE
            WHEN login_attempts.count + 1 >= ${MAX_ATTEMPTS}
            THEN NOW() + INTERVAL '15 minutes'
            ELSE NULL
          END
  `
}

async function clearFailures(email: string): Promise<void> {
  await sql`DELETE FROM login_attempts WHERE email = ${email}`
}
```

- [ ] **Step 2: Update the authorize callback to await the async helpers**

The three calls inside `authorize` must be awaited:

```typescript
if (await isLockedOut(email)) {
  // ...
}
// ...
await recordFailure(email)
// ...
await clearFailures(email)
```

Also update the audit call for rate limiting to not reference `loginAttempts.get(email)` anymore:
```typescript
// Remove: const rec = loginAttempts.get(email)
// Remove: details: `Invalid password (attempt ${rec?.count ?? 1}/${MAX_ATTEMPTS})`
// Replace with:
details: `Invalid password`,
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts
git commit -m "fix: replace in-memory login rate limiter with DB-backed login_attempts table (Important #5)"
```

---

## Task 7: Backup file size limit

This fixes **Critical Issue #3** — no size guard on backup upload.

**Files:**
- Modify: `src/app/api/admin/backup/import/route.ts`

- [ ] **Step 1: Add size check before file.text()**

Replace:
```typescript
  let parsed: unknown
  try {
    const text = await file.text()
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'File is not valid JSON' }, { status: 400 })
  }
```

With:
```typescript
  const MAX_BACKUP_BYTES = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_BACKUP_BYTES) {
    return NextResponse.json({ error: 'Backup file too large (max 10 MB)' }, { status: 400 })
  }

  let parsed: unknown
  try {
    const text = await file.text()
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'File is not valid JSON' }, { status: 400 })
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/backup/import/route.ts
git commit -m "fix: add 10 MB size limit on backup file upload (Critical #3)"
```

---

## Task 8: Zod validation in restore.ts + block password_hash injection + fix audit truncation

This fixes **Critical Issue #4**, **Suggestion S2**, and **Suggestion S3**.

**Files:**
- Modify: `src/lib/restore.ts`
- Modify: `src/app/api/admin/factory-reset/route.ts`

- [ ] **Step 1: Add Zod import and row schemas to restore.ts**

At the top of `src/lib/restore.ts`, add:
```typescript
import { z } from 'zod'
```

Add the schemas before `validatePayload`:
```typescript
const UserRowSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
  created_at: z.string(),
  // password_hash intentionally excluded — we never restore it from backups
})

const DomainRowSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  abbreviation: z.string(),
  framework: z.string(),
  description: z.string(),
})

const PracticeRowSchema = z.object({
  id: z.number().int().positive(),
  domain_id: z.number().int().positive(),
  framework: z.string(),
  practice_id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  risk_level: z.string(),
  owner: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  evidence_exists: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

const PoamItemRowSchema = z.object({
  id: z.number().int().positive(),
  practice_id: z.string().nullable().optional(),
  finding: z.string(),
  responsible_individual: z.string().nullable().optional(),
  resources_required: z.string().nullable().optional(),
  scheduled_completion: z.string().nullable().optional(),
  milestone_progress: z.number().default(0),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

const PracticeHistoryRowSchema = z.object({
  id: z.number().int().positive(),
  practice_id: z.string(),
  field_changed: z.string(),
  old_value: z.string().nullable().optional(),
  new_value: z.string().nullable().optional(),
  changed_by: z.string(),
  changed_at: z.string(),
})

const OverlayPackStateSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
})

const OverlayValidationRowSchema = z.object({
  id: z.number().int().positive(),
  overlay_mapping_id: z.number().int().positive(),
  validated: z.boolean(),
  resolved_inheritance_type: z.string().nullable().optional(),
  validated_by: z.string().nullable().optional(),
  validated_at: z.string().nullable().optional(),
  validation_notes: z.string().nullable().optional(),
})

const RestorePayloadSchema = z.object({
  users: z.array(UserRowSchema),
  domains: z.array(DomainRowSchema),
  practices: z.array(PracticeRowSchema),
  poam_items: z.array(PoamItemRowSchema),
  practice_history: z.array(PracticeHistoryRowSchema),
  overlay_pack_states: z.array(OverlayPackStateSchema).optional(),
  overlay_validations: z.array(OverlayValidationRowSchema).optional(),
})

export type RestorePayload = z.infer<typeof RestorePayloadSchema>
```

- [ ] **Step 2: Replace validatePayload with Zod-based version**

Replace:
```typescript
export function validatePayload(payload: unknown): asserts payload is RestorePayload {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid backup file')
  for (const key of ['users', 'domains', 'practices', 'poam_items', 'practice_history']) {
    if (!Array.isArray((payload as Record<string, unknown>)[key])) {
      throw new Error(`Backup file is missing required section: ${key}`)
    }
  }
}
```

With:
```typescript
export function validatePayload(payload: unknown): asserts payload is RestorePayload {
  const result = RestorePayloadSchema.safeParse(payload)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    const path = firstIssue.path.join('.')
    throw new Error(`Invalid backup file: ${path ? path + ': ' : ''}${firstIssue.message}`)
  }
}
```

- [ ] **Step 3: Update restoreFromPayload to use typed data and always ignore password_hash**

Replace the user insertion loop:
```typescript
    const LOCKED_HASH = '$2b$10$lockedXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    for (const user of parsed.users) {
      const hash = (user.password_hash as string | undefined) ?? LOCKED_HASH
      const mustChange = !user.password_hash // no hash in file → force reset
      await q`
        INSERT INTO users (id, email, password_hash, name, role, must_change_password, created_at)
        VALUES (${user.id as number}, ${user.email as string}, ${hash},
                ${user.name as string}, ${(user.role as string) ?? 'viewer'},
                ${mustChange}, ${user.created_at as string})
      `
    }
```

With (always uses LOCKED_HASH — no password_hash injection possible):
```typescript
    const LOCKED_HASH = '$2b$10$lockedXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    for (const user of parsed.users) {
      await q`
        INSERT INTO users (id, email, password_hash, name, role, must_change_password, created_at)
        VALUES (${user.id}, ${user.email}, ${LOCKED_HASH},
                ${user.name}, ${user.role},
                ${true}, ${user.created_at})
      `
    }
```

All other loops can now use typed fields directly (no `as string` casts needed — Zod guarantees the types). For example the domain loop becomes:
```typescript
    for (const domain of parsed.domains) {
      await q`
        INSERT INTO domains (id, name, abbreviation, framework, description)
        VALUES (${domain.id}, ${domain.name}, ${domain.abbreviation},
                ${domain.framework}, ${domain.description})
      `
    }
```

Apply the same pattern (remove all `as X` casts) to the practices, poam_items, practice_history, and overlay_validations loops.

- [ ] **Step 4: Remove the TRUNCATE security_events line from restoreFromPayload**

Remove this line from the bottom of the transaction:
```typescript
    // Clear security events (audit log) — factory reset should start with a clean slate
    await q`TRUNCATE security_events RESTART IDENTITY`
```

This line will move to the factory-reset route only (next step).

- [ ] **Step 5: Fix factory-reset route — add audit log truncation + fix audit action**

In `src/app/api/admin/factory-reset/route.ts`, after `await restoreFromPayload(parsed)` succeeds, add the audit log truncation:

```typescript
  try {
    await restoreFromPayload(parsed)
    // Factory reset clears the audit log — start clean
    await sql`TRUNCATE security_events RESTART IDENTITY`
  } catch (err) {
```

And fix the audit action from `'backup.imported'` to `'factory.reset'`:
```typescript
  await audit({
    action: 'factory.reset',
    actor: session!.user.email ?? 'admin',
    ip: getClientIp(req.headers),
    details: 'Factory reset to baseline',
  })
```

Add the sql import at the top of factory-reset/route.ts:
```typescript
import sql from '@/lib/db'
```

- [ ] **Step 6: Check Zod is installed**

```bash
grep '"zod"' package.json
```

If not present: `npm install zod`

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/restore.ts src/app/api/admin/factory-reset/route.ts
git commit -m "fix: Zod row validation in restore, block password_hash injection, fix factory-reset audit (Critical #4, S2, S3)"
```

---

## Task 9: Timing-safe CSRF comparison

This fixes **Important Issue #9**.

**Files:**
- Modify: `src/lib/api-csrf.ts`

- [ ] **Step 1: Replace string equality with timingSafeEqual**

Replace:
```typescript
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
```

With:
```typescript
  const tokensMatch =
    cookieToken &&
    headerToken &&
    cookieToken.length === headerToken.length &&
    require('crypto').timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))

  if (!tokensMatch) {
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api-csrf.ts
git commit -m "fix: use timingSafeEqual for CSRF token comparison (Important #9)"
```

---

## Task 10: csrfCookieHeaders — conditional Secure flag

This fixes **Important Issue #10**.

**Files:**
- Modify: `src/lib/csrf.ts`

- [ ] **Step 1: Replace hardcoded Secure with conditional**

Replace:
```typescript
export function csrfCookieHeaders(): Record<string, string> {
  const token = generateToken()
  // HttpOnly=false so JavaScript can read it and send as header
  // SameSite=Strict prevents the cookie from being sent in cross-site requests
  return {
    'Set-Cookie': `${CSRF_COOKIE}=${token}; Path=/; SameSite=Strict; HttpOnly=false; Secure`,
  }
}
```

With:
```typescript
export function csrfCookieHeaders(): Record<string, string> {
  const token = generateToken()
  const isSecure = process.env.NEXTAUTH_URL?.startsWith('https') ?? false
  const securePart = isSecure ? '; Secure' : ''
  return {
    'Set-Cookie': `${CSRF_COOKIE}=${token}; Path=/; SameSite=Strict; HttpOnly=false${securePart}`,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/csrf.ts
git commit -m "fix: csrfCookieHeaders sets Secure flag conditionally based on NEXTAUTH_URL (Important #10)"
```

---

## Task 11: Health endpoint — mask DB error message

This fixes **Important Issue #8**.

**Files:**
- Modify: `src/app/api/health/route.ts`

- [ ] **Step 1: Replace err.message with generic string**

Replace:
```typescript
      message: err instanceof Error ? err.message : 'Connection failed',
```

With:
```typescript
      message: 'Database connection failed',
```

Add server-side logging before the `checks.database` assignment:
```typescript
  } catch (err) {
    logger.error('health.db_check_failed', { error: err instanceof Error ? err.message : String(err) })
    checks.database = {
      status: 'error',
      latency_ms: Date.now() - dbStart,
      message: 'Database connection failed',
    }
    healthy = false
  }
```

Add the logger import at the top:
```typescript
import { logger } from '@/lib/logger'
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/health/route.ts
git commit -m "fix: mask DB error details in health endpoint (Important #8)"
```

---

## Task 12: Evidence URL validation

This fixes **Important Issue #6**.

**Files:**
- Modify: `src/app/api/practices/[id]/evidence/route.ts`

- [ ] **Step 1: Add URL validation in the JSON (URL submission) branch**

Replace:
```typescript
  const body = await req.json()
  const label = typeof body.label === 'string' ? body.label.trim() : ''
  const url = typeof body.url === 'string' ? body.url.trim() : ''

  if (!label) return NextResponse.json({ error: 'label is required' }, { status: 400 })
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })
```

With:
```typescript
  const body = await req.json()
  const label = typeof body.label === 'string' ? body.label.trim() : ''
  const rawUrl = typeof body.url === 'string' ? body.url.trim() : ''

  if (!label) return NextResponse.json({ error: 'label is required' }, { status: 400 })
  if (!rawUrl) return NextResponse.json({ error: 'url is required' }, { status: 400 })
  if (rawUrl.length > 2048) return NextResponse.json({ error: 'URL too long (max 2048 characters)' }, { status: 400 })

  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 })
  }
  const url = rawUrl
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/practices/[id]/evidence/route.ts
git commit -m "fix: validate evidence URL scheme and length (Important #6)"
```

---

## Task 13: Final type-check and build verification

- [ ] **Step 1: Full type check**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 2: Build**

```bash
npm run build 2>&1 | tail -20
```

Expected: successful build, no type errors.

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -p  # stage only what was fixed
git commit -m "fix: resolve type errors from security hardening"
```
