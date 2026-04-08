# Code Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all Critical and Important issues from the March 2026 code review, plus remove dead code.

**Architecture:** All fixes are surgical — no new files, no refactors beyond what's required. Each fix is self-contained and independently verifiable.

**Tech Stack:** Next.js 14 App Router, TypeScript, `postgres` tagged-template driver (npm: `postgres`), Zod v4, next-auth v4.

---

## File Map

| File | Change |
|---|---|
| `src/app/api/burndown/route.ts` | Replace `sql.unsafe()` with parameterized tagged template |
| `src/lib/token-revocation.ts` | Remove DELETE from `isTokenRevoked` |
| `src/lib/validation.ts` | Remove `as unknown as` cast, use `error.issues` directly |
| `src/app/api/poam/[id]/route.ts` | Build `updates` from `data`, not `rawBody`; fix `parseInt` radix |
| `src/app/api/admin/factory-reset/route.ts` | Move `audit()` inside try block; fix `parseInt` radix (line 111 POAM route only) |
| `src/middleware.ts` | Throw/fail on missing `NEXTAUTH_SECRET` |
| `src/lib/csrf.ts` | Delete (dead code — replaced by `src/lib/api-csrf.ts`) |

---

## Task 1: Fix Zod cast in `validation.ts`

**Files:**
- Modify: `src/lib/validation.ts:16-19`

The `as unknown as { issues: ... }` cast is unnecessary — `ZodError` in Zod v4 has `.issues` directly on the type.

- [ ] **Step 1: Open `src/lib/validation.ts` and replace `validationError`**

Replace lines 16–19:
```typescript
// BEFORE
export function validationError(error: z.ZodError): NextResponse {
  const issues = (error as unknown as { issues: Array<{ path: (string | number)[]; message: string }> }).issues
  const messages = issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
  return NextResponse.json({ error: messages }, { status: 400 })
}
```

With:
```typescript
// AFTER
export function validationError(error: z.ZodError): NextResponse {
  const messages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
  return NextResponse.json({ error: messages }, { status: 400 })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors on `validation.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validation.ts
git commit -m "fix: remove unnecessary Zod ZodError type cast"
```

---

## Task 2: Fix `parseInt` without radix in POAM route

**Files:**
- Modify: `src/app/api/poam/[id]/route.ts:34` and `:111`

Both `parseInt(params.id)` calls are missing the radix `10`.

- [ ] **Step 1: Fix both parseInt calls**

In `src/app/api/poam/[id]/route.ts`, change:

Line 34:
```typescript
// BEFORE
const id = parseInt(params.id)
```
```typescript
// AFTER
const id = parseInt(params.id, 10)
```

Line 111:
```typescript
// BEFORE
const id = parseInt(params.id)
```
```typescript
// AFTER
const id = parseInt(params.id, 10)
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/poam/[id]/route.ts
git commit -m "fix: add radix 10 to parseInt in POAM route"
```

---

## Task 3: Fix POAM PATCH `updates` built from `rawBody`

**Files:**
- Modify: `src/app/api/poam/[id]/route.ts:48-52`

Currently `updates` is built by checking `key in body` (rawBody) but taking the value from `data` (the Zod-parsed result). A field that passes the `in` check but isn't in the schema can produce `undefined` values in `updates`, which Postgres writes as `NULL`. The fix: build `updates` directly from `data`, not from `rawBody`.

- [ ] **Step 1: Replace the `updates` construction block**

In `src/app/api/poam/[id]/route.ts`, replace lines 48–52:

```typescript
// BEFORE
const body = rawBody as Record<string, unknown>
const updates: Record<string, unknown> = {}
for (const key of ALLOWED_UPDATE_KEYS) {
  if (key in body) updates[key] = data[key as keyof typeof data]
}
```

With:

```typescript
// AFTER
const updates: Record<string, unknown> = {}
for (const key of ALLOWED_UPDATE_KEYS) {
  if (key in data) updates[key] = data[key as keyof typeof data]
}
```

Also remove the now-unused `rawBody` variable. Change the earlier block:

```typescript
// BEFORE
let rawBody: unknown
try {
  rawBody = await req.json()
} catch {
  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
}

const parsed = parsePoamPatch(rawBody)
```

To:

```typescript
// AFTER
let body: unknown
try {
  body = await req.json()
} catch {
  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
}

const parsed = parsePoamPatch(body)
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/poam/[id]/route.ts
git commit -m "fix: build POAM PATCH updates from parsed data, not raw body"
```

---

## Task 4: Move `audit()` inside try block in factory-reset

**Files:**
- Modify: `src/app/api/admin/factory-reset/route.ts:58-77`

Currently `audit()` is called after the try/catch block, meaning it fires even if the reset partially succeeded before throwing. Move it inside the success path.

- [ ] **Step 1: Move `audit()` inside the try block**

In `src/app/api/admin/factory-reset/route.ts`, replace lines 58–77:

```typescript
// BEFORE
  try {
    await restoreFromPayload(parsed)
    // Factory reset clears the audit log — start clean
    await sql`TRUNCATE security_events RESTART IDENTITY`
  } catch (err) {
    console.error('Factory reset failed:', err)
    return NextResponse.json(
      { error: 'Factory reset failed. The database may not have been modified.' },
      { status: 500 }
    )
  }

  await audit({
    action: 'factory.reset',
    actor: session!.user.email ?? 'admin',
    ip: getClientIp(req.headers),
    details: 'Factory reset to baseline',
  })

  return NextResponse.json({ ok: true, message: 'Factory reset complete. All data restored to baseline.' })
```

With:

```typescript
// AFTER
  try {
    await restoreFromPayload(parsed)
    // Factory reset clears the audit log — start clean
    await sql`TRUNCATE security_events RESTART IDENTITY`
    await audit({
      action: 'factory.reset',
      actor: session!.user.email ?? 'admin',
      ip: getClientIp(req.headers),
      details: 'Factory reset to baseline',
    })
  } catch (err) {
    console.error('Factory reset failed:', err)
    return NextResponse.json(
      { error: 'Factory reset failed. The database may not have been modified.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, message: 'Factory reset complete. All data restored to baseline.' })
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/factory-reset/route.ts
git commit -m "fix: only audit factory reset on success, not on partial failure"
```

---

## Task 5: Remove dead `csrf.ts`

**Files:**
- Delete: `src/lib/csrf.ts`

`src/lib/csrf.ts` exports `validateCsrf`, `csrfCookieHeaders`, `CSRF_COOKIE_NAME`, and `CSRF_HEADER_NAME`. None of these are imported anywhere — `src/lib/api-csrf.ts` is the active implementation. Verify no imports exist, then delete.

- [ ] **Step 1: Confirm no imports of `csrf.ts`**

```bash
grep -r "from '@/lib/csrf'" src/
grep -r "from '../lib/csrf'" src/
```

Expected: no output (no imports found).

- [ ] **Step 2: Delete the file**

```bash
rm src/lib/csrf.ts
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -u src/lib/csrf.ts
git commit -m "chore: remove dead csrf.ts (superseded by api-csrf.ts)"
```

---

## Task 6: Fix missing `NEXTAUTH_SECRET` in middleware

**Files:**
- Modify: `src/middleware.ts:58-61`

`process.env.NEXTAUTH_SECRET ?? ''` silently passes an empty string to `getToken()`, which causes all tokens to fail verification and redirects every user to `/login` with no diagnostic message. Fail loudly when the secret is missing.

- [ ] **Step 1: Add a guard before `getToken`**

In `src/middleware.ts`, replace lines 58–61:

```typescript
// BEFORE
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? '',
  })
```

With:

```typescript
// AFTER
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.error('[middleware] NEXTAUTH_SECRET is not set — rejecting all requests')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  const token = await getToken({ req, secret })
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "fix: fail loudly when NEXTAUTH_SECRET is missing in middleware"
```

---

## Task 7: Remove DELETE from `isTokenRevoked`

**Files:**
- Modify: `src/lib/token-revocation.ts:27-31`

Every API request calls `isTokenRevoked`, which runs `DELETE FROM revoked_tokens WHERE expires_at < NOW()` on every check. Under load this causes write amplification and lock contention. The SELECT alone is correct: expired rows don't match any valid `jti`. Move cleanup elsewhere (cron or post-login).

- [ ] **Step 1: Remove the DELETE from `isTokenRevoked`**

In `src/lib/token-revocation.ts`, replace lines 27–31:

```typescript
// BEFORE
/** Returns true if the jti is in the revoked_tokens table (and not yet expired). */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  await sql`DELETE FROM revoked_tokens WHERE expires_at < NOW()`
  const [row] = await sql`SELECT 1 FROM revoked_tokens WHERE jti = ${jti}`
  return !!row
}
```

With:

```typescript
// AFTER
/** Returns true if the jti is in the revoked_tokens table (and not yet expired). */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  const [row] = await sql`SELECT 1 FROM revoked_tokens WHERE jti = ${jti} AND expires_at > NOW()`
  return !!row
}

/** Remove expired tokens from the revoked_tokens table. Call this from a background job or on logout. */
export async function pruneExpiredTokens(): Promise<void> {
  await sql`DELETE FROM revoked_tokens WHERE expires_at < NOW()`
}
```

Note: the SELECT now includes `AND expires_at > NOW()` to ensure expired rows are never treated as active revocations, since we no longer clean them up inline.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/token-revocation.ts
git commit -m "fix: remove per-request DELETE from isTokenRevoked, add pruneExpiredTokens helper"
```

---

## Task 8: Replace `sql.unsafe()` in burndown route

**Files:**
- Modify: `src/app/api/burndown/route.ts:30-53`

`sql.unsafe()` disables the driver's parameterization for the entire query. While the values come from a hardcoded `as const` map, the footgun remains for future changes. Replace with the parameterized tagged-template driver syntax — Postgres supports casting interval and date_trunc text parameters.

- [ ] **Step 1: Replace `sql.unsafe()` with a parameterized query**

In `src/app/api/burndown/route.ts`, replace lines 29–53:

```typescript
// BEFORE
  // All values sourced from hardcoded RANGE_CONFIG — not user-controlled
  const rows = await sql.unsafe(`
    WITH periods AS (
      SELECT generate_series(
        date_trunc('${trunc}', NOW() - INTERVAL '${interval}'),
        date_trunc('${trunc}', NOW()),
        INTERVAL '${step}'
      ) AS period_start
    )
    SELECT
      to_char(p.period_start, '${format}') AS week,
      COUNT(pr.id) FILTER (
        WHERE pr.status IN ('Implemented', 'Audit Ready')
          AND date_trunc('${trunc}', pr.updated_at) <= p.period_start
      )::int AS closed,
      (SELECT COUNT(*) FROM practices WHERE framework = 'CMMC')::int -
        COUNT(pr.id) FILTER (
          WHERE pr.status IN ('Implemented', 'Audit Ready')
            AND date_trunc('${trunc}', pr.updated_at) <= p.period_start
        )::int AS open
    FROM periods p
    LEFT JOIN practices pr ON pr.framework = 'CMMC'
    GROUP BY p.period_start
    ORDER BY p.period_start
  `)
```

With:

```typescript
// AFTER
  // All values are from the hardcoded RANGE_CONFIG const — cast to interval/text in SQL
  const rows = await sql`
    WITH periods AS (
      SELECT generate_series(
        date_trunc(${trunc}, NOW() - ${interval}::interval),
        date_trunc(${trunc}, NOW()),
        ${step}::interval
      ) AS period_start
    )
    SELECT
      to_char(p.period_start, ${format}) AS week,
      COUNT(pr.id) FILTER (
        WHERE pr.status IN ('Implemented', 'Audit Ready')
          AND date_trunc(${trunc}, pr.updated_at) <= p.period_start
      )::int AS closed,
      (SELECT COUNT(*) FROM practices WHERE framework = 'CMMC')::int -
        COUNT(pr.id) FILTER (
          WHERE pr.status IN ('Implemented', 'Audit Ready')
            AND date_trunc(${trunc}, pr.updated_at) <= p.period_start
        )::int AS open
    FROM periods p
    LEFT JOIN practices pr ON pr.framework = 'CMMC'
    GROUP BY p.period_start
    ORDER BY p.period_start
  `
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Smoke-test the endpoint (requires running app)**

```bash
curl -s 'http://localhost:3000/api/burndown?range=1w' | head -c 200
```
Expected: JSON array with `week`, `closed`, `open` fields.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/burndown/route.ts
git commit -m "fix: replace sql.unsafe() in burndown route with parameterized query"
```

---

## Self-Review Checklist

- [x] All 8 Critical/Important findings addressed
- [x] Dead `csrf.ts` removed (suggestion)
- [x] No placeholder steps — all steps contain actual code
- [x] No new files created
- [x] No unrelated refactors
- [x] `parseInt` radix fix covered in Task 2 (both occurrences in POAM route)
- [x] Evidence atomicity: already handled correctly in the codebase (DB insert first, delete on file failure) — no task needed
