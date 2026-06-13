# CMMC Dashboard — Code Review
**Date:** 2026-04-01
**Scope:** Full codebase, BASE `46d6030` → HEAD `0e7dbc7`
**Reviewer:** Senior Code Review (Claude Sonnet 4.6)

---

## What Was Done Well

- Parameterized queries via the `postgres` tagged-template driver throughout all DB code — no raw string interpolation on user input in normal paths.
- bcrypt (10 rounds) used correctly; DUMMY_HASH constant prevents timing oracle on unknown emails.
- Token revocation implemented at two levels (jti per-logout, user_id per-deletion); enforced in `getAuthSession()` on every API request.
- `checkCsrf` uses `crypto.timingSafeEqual` — correct resistance to timing attacks on the token comparison.
- Zod validation on every mutating endpoint; schemas are strict and enums are closed.
- Path-traversal protection in `resolveEvidencePath` (segment allow-list + prefix check).
- Account lockout is DB-persisted (survives restarts), 5 attempts / 15-minute window.
- CSRF cookie is `SameSite=strict`, non-httpOnly (intentional for JS read), and `secure` flag derived from the actual URL scheme rather than NODE_ENV.
- Secrets loaded from Docker secret files with env-var fallback; no hardcoded values.
- Structured JSON audit log on stderr; security events are clearly flagged.

---

## Critical Issues (Must Fix)

### 1. `sql.unsafe()` in `/api/burndown/route.ts` — defense-in-depth gap

**File:** `src/app/api/burndown/route.ts`, lines 30–53

The burndown query uses `sql.unsafe()` with string interpolation of `interval`, `step`, `trunc`, and `format` values. These are sourced from the hardcoded `RANGE_CONFIG` object after the `raw in RANGE_CONFIG` guard, so no user-controlled string reaches the query today. However:

- A future developer adding a range key could inadvertently introduce unsafe values.
- `sql.unsafe()` bypasses the parameterization safety net of the `postgres` driver entirely for this entire query block.

The comment "All values sourced from hardcoded RANGE_CONFIG — not user-controlled" is correct but fragile. The `postgres` driver supports `sql(identifier)` and `sql.unsafe()` minimally; the accepted pattern is to use `sql` fragments or restructure the query to parameterize what can be parameterized and use the driver's identifier-quoting for the rest. At minimum, replace `sql.unsafe` with `sql` tagged literal where possible and leave a lint rule or type-level constraint preventing future `sql.unsafe` calls in route files.

**Risk:** Low right now, high over time as the codebase evolves.

---

### 2. `isTokenRevoked` runs a `DELETE` on every API request — hot-path performance + correctness issue

**File:** `src/lib/token-revocation.ts`, lines 27–31

```ts
export async function isTokenRevoked(jti: string): Promise<boolean> {
  await sql`DELETE FROM revoked_tokens WHERE expires_at < NOW()`  // ← runs on every request
  const [row] = await sql`SELECT 1 FROM revoked_tokens WHERE jti = ${jti}`
  return !!row
}
```

Every authenticated API request triggers a `DELETE` on `revoked_tokens`. This:

1. Takes an exclusive row-level lock (or table-level depending on concurrency) on every request.
2. Produces write amplification under load — a dashboard with many concurrent users degrades this table's performance significantly.
3. The cleanup `DELETE` and the `SELECT` are two separate statements with no transaction wrapper, so a race is theoretically possible (though unlikely given the table is append-only for inserts).

**Recommended fix:** Move cleanup to a scheduled job (pg_cron, a separate cron container, or a low-frequency background route). The SELECT alone is sufficient for revocation checking; expired rows don't affect correctness since `expires_at < NOW()` rows simply won't match the `SELECT` for a valid jti.

---

### 3. `validationError` casts through `unknown` to access `.issues` — Zod v4 API breakage

**File:** `src/lib/validation.ts`, lines 16–19

```ts
export function validationError(error: z.ZodError): NextResponse {
  const issues = (error as unknown as { issues: Array<{...}> }).issues
```

The project uses `zod: "^4.3.6"`. Zod v4 changed `ZodError`'s error format — `error.issues` is still present but the cast through `unknown` suggests the author was working around a type error, which is a signal the API may not be stable. More critically, if a Zod v4 `ZodError` is passed but the shape of `.issues` changed subtly, this cast will silently produce wrong error messages rather than failing loudly.

**Recommended fix:** Use `error.issues` directly (it exists on `ZodError` in v4) or use `z.ZodError.prototype.flatten()` / `error.format()` which are the stable v4 APIs. Remove the `as unknown as` cast.

---

## Important Issues (Should Fix)

### 4. POAM PATCH reads `rawBody` after Zod parse to build `updates` — logic inconsistency

**File:** `src/app/api/poam/[id]/route.ts`, lines 48–51

```ts
const body = rawBody as Record<string, unknown>
const updates: Record<string, unknown> = {}
for (const key of ALLOWED_UPDATE_KEYS) {
  if (key in body) updates[key] = data[key as keyof typeof data]
```

The code checks `key in body` (raw, unvalidated object) but assigns `data[key]` (Zod-parsed value). This means the presence check uses the raw input while the value comes from the parsed output. This is safe in practice because Zod strips unknown keys by default in `.object()`, but it is confusing: a field that Zod strips (unknown key not in schema) could satisfy `key in body` and produce `updates[key] = undefined`. The `ALLOWED_UPDATE_KEYS` list also includes `practice_id` which is absent from `TRACKED_FIELDS`, making the two lists diverge silently.

**Recommended fix:** Build `updates` from `data` (Zod output) directly, not from `rawBody`. Use `Object.keys(data)` filtered through `ALLOWED_UPDATE_KEYS`.

---

### 5. File write and DB insert are not atomic in evidence upload

**File:** `src/app/api/practices/[id]/evidence/route.ts` (evidence POST handler)

The sequence is:
1. Write file to disk (`writeEvidenceFileAt`)
2. Insert row into `practice_evidence`
3. Update `evidence_exists = true` on the practice

If step 2 or 3 fails after step 1 succeeds, a file is orphaned on disk with no DB record. The reverse (DB insert succeeds, file missing) is also possible if a concurrent DELETE runs between steps 1 and 2.

**Recommended fix:** Wrap steps 2 and 3 in a DB transaction. On catch, attempt to delete the already-written file. Or, write the file path to the DB first (within a transaction), then write the file, and clean up on failure.

---

### 6. `getToken` in middleware uses empty-string fallback for `NEXTAUTH_SECRET`

**File:** `src/middleware.ts`, line 60

```ts
const token = await getToken({
  req,
  secret: process.env.NEXTAUTH_SECRET ?? '',
})
```

If `NEXTAUTH_SECRET` is not set, the fallback is an empty string. `getToken` with an empty secret will attempt JWT verification against the empty string, which will fail (tokens signed with a real secret won't verify), so auth will be denied — which is safe. However, the correct behavior is to fail loudly at startup, not silently deny all sessions. The `getNextAuthSecret()` function in `src/lib/auth.ts` already throws on missing secret; the middleware should use the same mechanism or at least throw rather than default to `''`.

**Note:** Edge runtime cannot call `getNextAuthSecret()` (it uses `require('fs')`), but the env-var branch is safe to call. Consider extracting just the env-var branch into an edge-compatible helper.

---

### 7. `parseInt(params.id)` without radix in POAM route

**File:** `src/app/api/poam/[id]/route.ts`, lines 34 and 111

```ts
const id = parseInt(params.id)
```

Missing the radix argument (`10`). While in practice route params from Next.js are decimal strings, `parseInt` without radix 10 will interpret strings like `"0x10"` as hex. Other routes correctly use `parseInt(params.id, 10)`. Consistency and correctness require the radix everywhere.

---

### 8. `audit()` called after `restoreFromPayload` succeeds but before the catch block — audit log written after a failed factory reset

**File:** `src/app/api/admin/factory-reset/route.ts`, lines 58–75

The `audit()` call at line 70 is outside the try/catch. If `restoreFromPayload` throws asynchronously in a way that the catch at line 62 does not catch (e.g., a rejected promise after the transaction commits partially), the audit entry is still written. More importantly, the audit entry should be inside the try block to ensure it is only recorded on confirmed success.

---

## Suggestions (Nice to Have)

### 9. Two CSRF libraries coexist (`src/lib/csrf.ts` and `src/lib/api-csrf.ts`)

`src/lib/csrf.ts` exports `validateCsrf` (async, calls `getServerSession`) and `csrfCookieHeaders`. `src/lib/api-csrf.ts` exports `checkCsrf` (synchronous, no session check). Routes use `checkCsrf` from `api-csrf.ts`. The `csrf.ts` file appears unused in API routes and exports a different (heavier) implementation. This dead code should be removed or clearly documented as an alternative that is not used.

### 10. `validationError` messages are joined with `; ` and returned in a single `error` string

This is workable but clients cannot easily extract individual field errors. Consider returning `{ errors: { [field]: message } }` for better frontend usability.

### 11. No test files found in the diff

The commit range adds ~15,000 lines of production code with no automated test files for API routes, auth logic, or DB queries. The Python test file referenced in the diff appears to test overlay scoring only. Given this is a compliance tool that must produce auditable results, the absence of integration tests for auth, POAM mutations, and evidence tracking is a significant gap.

### 12. `getAuthSession` is called after `checkCsrf` in every route

This means two full session lookups per request on mutating endpoints (one in the route handler, one implicit in `validateCsrf` in `src/lib/csrf.ts` — though `checkCsrf` from `api-csrf.ts` does not call session). This is fine architecturally but worth documenting so future developers don't add a second `getAuthSession` call inadvertently.

---

## Summary Table

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | Critical | `api/burndown/route.ts` | `sql.unsafe()` — fragile defense |
| 2 | Critical | `lib/token-revocation.ts` | Eager `DELETE` on every request |
| 3 | Critical | `lib/validation.ts` | Zod v4 cast through `unknown` |
| 4 | Important | `api/poam/[id]/route.ts` | `rawBody` vs `data` presence check |
| 5 | Important | `api/practices/[id]/evidence/route.ts` | File write + DB insert not atomic |
| 6 | Important | `middleware.ts` | Empty-string fallback for NEXTAUTH_SECRET |
| 7 | Important | `api/poam/[id]/route.ts` | `parseInt` missing radix |
| 8 | Important | `api/admin/factory-reset/route.ts` | Audit outside try/catch |
| 9 | Suggestion | `lib/csrf.ts` | Dead CSRF library |
| 10 | Suggestion | `lib/validation.ts` | Single-string error format |
| 11 | Suggestion | (all) | No automated tests |
| 12 | Suggestion | (all) | Double session pattern documentation |
