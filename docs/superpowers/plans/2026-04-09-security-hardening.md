# Security Hardening Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all findings from the April 2026 OWASP-aligned security review. No MFA.

**Architecture:** 13 discrete tasks grouped by subsystem. Each task is independently committable. No task depends on another completing first, except Task 3 (password history) which requires the migration from Task 2 to exist.

**Tech Stack:** Next.js 14 App Router, TypeScript, PostgreSQL 15, bcryptjs, Zod 4, nginx, Docker Compose

---

## Task 1: Bump bcrypt cost factor 10 → 13 and regenerate dummy hash

**Files:**
- Modify: `src/lib/auth.ts` (line 12 — DUMMY_HASH constant)
- Modify: `src/app/api/user/password/route.ts` (line 39)
- Modify: `src/app/api/admin/users/route.ts` (line 30)

The dummy hash used for timing protection must match the cost factor of real hashes, or the timing difference reveals whether an email exists.

- [ ] **Step 1: Generate a new dummy hash at cost 13**

Run in a Node REPL or one-liner:
```bash
node -e "const b=require('bcryptjs'); b.hash('dummy-timing-protection-only', 13).then(h => console.log(h))"
```
Copy the output — it will look like `$2b$13$...` (60 chars).

- [ ] **Step 2: Update DUMMY_HASH in `src/lib/auth.ts`**

```typescript
// Replace line 12:
const DUMMY_HASH = '$2b$13$<output-from-step-1>'
```

- [ ] **Step 3: Update bcrypt rounds in `src/app/api/user/password/route.ts`**

```typescript
// Line 39 — was: await bcrypt.hash(newPassword, 10)
const newHash = await bcrypt.hash(newPassword, 13)
```

- [ ] **Step 4: Update bcrypt rounds in `src/app/api/admin/users/route.ts`**

```typescript
// Line 30 — was: await bcrypt.hash(password, 10)
const passwordHash = await bcrypt.hash(password, 13)
```

- [ ] **Step 5: Verify — confirm no other files hardcode rounds**

```bash
grep -r "bcrypt.hash\|genSalt" src/ --include="*.ts"
```
Expected: only the two files above.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/app/api/user/password/route.ts src/app/api/admin/users/route.ts
git commit -m "security: bump bcrypt cost factor to 13, regenerate dummy hash

OWASP ASVS §2.4.1 requires cost factor ≥ 13. Dummy hash updated
to match so timing protection remains effective."
```

---

## Task 2: Password complexity rules (uppercase, lowercase, number, symbol)

**Files:**
- Modify: `src/lib/validation.ts`

Both `UserCreateSchema` and `PasswordChangeSchema` currently only enforce `min(12)`. Add character-class requirements.

- [ ] **Step 1: Write the failing test**

Add to your test suite (or run inline to verify):
```typescript
// These should PASS after the change:
// "MyP@ssw0rd!1" — has upper, lower, digit, symbol, 12 chars
// These should FAIL:
// "alllowercase1!" — no uppercase
// "ALLUPPERCASE1!" — no lowercase
// "NoSpecialChar1" — no symbol
// "NoDigitsHere!!" — no digit
// "Short!1Aa"      — under 12 chars
```

- [ ] **Step 2: Add complexity refinement to `PasswordChangeSchema` in `src/lib/validation.ts`**

```typescript
// Replace the existing PasswordChangeSchema (lines 120-126):
const PASSWORD_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]).{12,128}$/

export const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(128),
  newPassword:     z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(
      PASSWORD_COMPLEXITY,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
}).refine(d => d.currentPassword !== d.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
})
```

- [ ] **Step 3: Add the same regex to `UserCreateSchema` (line 99)**

```typescript
export const UserCreateSchema = z.object({
  email:    z.string().email('Invalid email address').max(254),
  name:     z.string().min(1, 'Name is required').max(100),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(
      PASSWORD_COMPLEXITY,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  role:     z.enum(USER_ROLES),
})
```

Note: `PASSWORD_COMPLEXITY` is defined once above both schemas — do not duplicate it.

- [ ] **Step 4: Run type check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts
git commit -m "security: add password complexity requirements

Require uppercase, lowercase, digit, and symbol (OWASP ASVS §2.1.1).
Applies to both user creation and password change flows."
```

---

## Task 3: Password history — prevent reuse of last 5 passwords

**Files:**
- Create: `scripts/migrations/008-password-history.sql`
- Modify: `src/app/api/user/password/route.ts`
- Modify: `src/lib/restore.ts` (exclude new table from restore)

- [ ] **Step 1: Write the migration**

Create `scripts/migrations/008-password-history.sql`:
```sql
-- Migration 008: Password history
-- Stores the last N password hashes per user to prevent reuse.
CREATE TABLE IF NOT EXISTS password_history (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hash       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user
  ON password_history (user_id, created_at DESC);
```

- [ ] **Step 2: Apply the migration to local dev DB**

```bash
docker compose -f docker-compose.dev.yml exec db psql -U postgres -d cmmc -f /dev/stdin < scripts/migrations/008-password-history.sql
```
Expected: `CREATE TABLE`, `CREATE INDEX`

- [ ] **Step 3: Update `src/app/api/user/password/route.ts` to check history before saving**

Add a history check after the current password verification and before the hash update. Replace the current hash + update block:

```typescript
import bcrypt from 'bcryptjs'
// ... existing imports remain ...

// After: const valid = await bcrypt.compare(currentPassword, user.password_hash)
// After: if (!valid) return ... error ...

// Check password history (last 5 hashes including current)
const HISTORY_LIMIT = 5
const [currentRow, ...historyRows] = await sql<{ hash: string }[]>`
  SELECT password_hash AS hash FROM users WHERE id = ${userId}
  UNION ALL
  SELECT hash FROM password_history
  WHERE user_id = ${userId}
  ORDER BY created_at DESC
  LIMIT ${HISTORY_LIMIT}
`
// currentRow is the current hash (already verified above), check history
const historyHashes = historyRows.map(r => r.hash)
for (const oldHash of historyHashes) {
  const reused = await bcrypt.compare(newPassword, oldHash)
  if (reused) {
    return NextResponse.json(
      { error: 'Password was used recently. Choose a password you have not used in the last 5 changes.' },
      { status: 400 }
    )
  }
}

// Save current hash to history before overwriting
await sql`
  INSERT INTO password_history (user_id, hash)
  VALUES (${userId}, ${user.password_hash})
`
// Prune: keep only the last (HISTORY_LIMIT - 1) history rows (current will become the newest)
await sql`
  DELETE FROM password_history
  WHERE user_id = ${userId}
  AND id NOT IN (
    SELECT id FROM password_history
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${HISTORY_LIMIT - 1}
  )
`

const newHash = await bcrypt.hash(newPassword, 13)
await sql`UPDATE users SET password_hash = ${newHash}, must_change_password = false WHERE id = ${userId}`
```

- [ ] **Step 4: Run type check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrations/008-password-history.sql src/app/api/user/password/route.ts
git commit -m "security: add password history table, block reuse of last 5 passwords

OWASP ASVS §2.1.9. Migration 008 creates password_history table."
```

---

## Task 4: File upload magic number validation (replace client-supplied MIME)

**Files:**
- Modify: `package.json` (add `file-type` dependency)
- Modify: `src/lib/evidence.ts`

Currently `validateFileType(file.name, file.type)` trusts the browser-supplied MIME type. An attacker sends `Content-Type: image/png` with an `.exe` body and it passes.

- [ ] **Step 1: Install `file-type`**

```bash
npm install file-type
```
Expected: package added to `dependencies` in `package.json`.

- [ ] **Step 2: Add a `validateFileMagic` function to `src/lib/evidence.ts`**

Add after the existing `validateFileType` function:

```typescript
import { fileTypeFromBuffer } from 'file-type'

// Map of allowed extensions to their permitted magic-number MIME types.
// Some formats (txt, csv) have no magic bytes — we allow them by extension only.
const MAGIC_ALLOWED: Record<string, Set<string>> = {
  '.pdf':  new Set(['application/pdf']),
  '.png':  new Set(['image/png']),
  '.jpg':  new Set(['image/jpeg']),
  '.jpeg': new Set(['image/jpeg']),
  '.gif':  new Set(['image/gif']),
  '.docx': new Set(['application/zip']),  // OOXML is a ZIP internally
  '.xlsx': new Set(['application/zip']),  // OOXML is a ZIP internally
  '.zip':  new Set(['application/zip']),
  // .csv and .txt: no magic bytes — extension-only check is acceptable
  '.csv':  new Set(),
  '.txt':  new Set(),
}

/**
 * Validates file content against its declared extension using magic bytes.
 * Returns an error string if invalid, or null if OK.
 */
export async function validateFileMagic(
  buffer: Buffer,
  filename: string
): Promise<string | null> {
  const ext = path.extname(filename).toLowerCase()
  const allowedMagic = MAGIC_ALLOWED[ext]

  if (!allowedMagic) return 'File type not allowed'

  // Text formats have no magic bytes — skip magic check
  if (allowedMagic.size === 0) return null

  const detected = await fileTypeFromBuffer(buffer)
  if (!detected) {
    return `Could not determine file type. Expected ${ext} content.`
  }
  if (!allowedMagic.has(detected.mime)) {
    return `File content does not match its extension. Detected: ${detected.mime}`
  }
  return null
}
```

- [ ] **Step 3: Update the POST handler in `src/app/api/practices/[id]/evidence/route.ts` to call `validateFileMagic`**

Add the import and call after the existing size/type checks:

```typescript
import {
  buildEvidencePath,
  validateFileSize,
  validateFileType,
  validateFileMagic,   // add this
  writeEvidenceFileAt,
} from '@/lib/evidence'

// ... in the multipart/form-data branch, after the existing validation:
const buffer = Buffer.from(await file.arrayBuffer())

const magicError = await validateFileMagic(buffer, file.name)
if (magicError) {
  return NextResponse.json({ error: magicError }, { status: 400 })
}
```

Place the `validateFileMagic` call **before** `buildEvidencePath` — no file should be written if magic check fails.

- [ ] **Step 4: Run type check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/evidence.ts src/app/api/practices/[id]/evidence/route.ts
git commit -m "security: validate file uploads against magic bytes

Uses file-type library to reject files whose content doesn't match
their declared extension. Prevents .exe-as-.pdf upload bypass."
```

---

## Task 5: Remove ZIP from allowed evidence types (ZIP bomb protection)

**Files:**
- Modify: `src/lib/evidence.ts`

ZIP files have no compliance use case for evidence and introduce ZIP bomb risk (decompression attack). The simplest fix is removal.

- [ ] **Step 1: Remove `.zip` and `application/zip` from the allowlists in `src/lib/evidence.ts`**

```typescript
// Replace ALLOWED_EXTENSIONS:
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.png', '.jpg', '.jpeg', '.gif',
  '.docx', '.xlsx', '.csv', '.txt',
])

// Replace ALLOWED_MIME_TYPES:
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
])

// Remove '.zip' entry from MAGIC_ALLOWED (added in Task 4):
// Change .docx and .xlsx entries to a more specific set if file-type
// can distinguish OOXML from generic ZIP. For now, keep 'application/zip'
// for those two since OOXML containers are detected as application/zip by
// file-type — but remove the standalone '.zip' key entirely.
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/evidence.ts
git commit -m "security: remove ZIP from allowed evidence file types

ZIP files have no compliance evidence use case and introduce
decompression bomb risk. PDF, images, Office docs, CSV, TXT remain."
```

---

## Task 6: CSP hardening — remove unsafe-inline and unsafe-eval, add nonce

**Files:**
- Modify: `src/middleware.ts`
- Modify: `nginx.conf`
- Modify: `nginx-ssl.conf`
- Modify: `src/app/layout.tsx` (or root layout file — find with glob)

In Next.js App Router, the correct approach is to generate a nonce in middleware, set it on a request header, read it in the root layout, and pass it to `<Script>` components. nginx's CSP header is removed so middleware controls the policy.

- [ ] **Step 1: Find the root layout file**

```bash
find src/app -name "layout.tsx" | head -5
```

- [ ] **Step 2: Add nonce generation to `src/middleware.ts`**

After the existing CSRF cookie logic (around line 50), add:

```typescript
// Generate per-request CSP nonce
const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64')

// Set CSP header — Next.js inline scripts (RSC hydration) need the nonce
const csp = [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}'`,
  "style-src 'self' 'unsafe-inline'",  // Tailwind requires this; tighten if moving to CSS modules
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ')

response.headers.set('Content-Security-Policy', csp)
response.headers.set('x-nonce', nonce)  // Root layout reads this
```

This replaces nginx's CSP. The nonce is per-request so replay attacks don't apply.

- [ ] **Step 3: Update root layout to pass nonce to `<Script>` tags**

In `src/app/layout.tsx`, read the nonce from headers and pass it through:

```typescript
import { headers } from 'next/headers'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? ''
  // Pass nonce as a prop to any <Script> components used here
  // For Next.js's own hydration scripts, set it on <html> via next.config.ts
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

If the layout already uses `<Script>` tags from `next/script`, add `nonce={nonce}` to each.

- [ ] **Step 4: Remove the CSP header from `nginx.conf` and `nginx-ssl.conf`**

In both files, delete (or comment out) the `add_header Content-Security-Policy ...` line. The middleware now owns CSP.

```nginx
# REMOVE this line from both nginx.conf and nginx-ssl.conf:
# add_header Content-Security-Policy "...unsafe-inline..." always;
```

Leave all other security headers (X-Frame-Options, X-Content-Type-Options, etc.) in nginx.

- [ ] **Step 5: Run type check and lint**

```bash
npx tsc --noEmit && npx eslint src/middleware.ts src/app/layout.tsx
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts src/app/layout.tsx nginx.conf nginx-ssl.conf
git commit -m "security: remove unsafe-inline/unsafe-eval from CSP, add nonce

Next.js middleware now generates per-request nonce and sets CSP header.
nginx no longer sets CSP (middleware owns it).
style-src retains unsafe-inline (required for Tailwind JIT)."
```

---

## Task 7: Backup HMAC — sign on export, verify on import

**Files:**
- Create: `src/lib/backup-hmac.ts`
- Modify: `src/app/api/admin/backup/export/route.ts`
- Modify: `src/app/api/admin/backup/import/route.ts`

Sign every export with HMAC-SHA256 keyed on `NEXTAUTH_SECRET`. Import rejects any payload with a missing or invalid signature.

- [ ] **Step 1: Create `src/lib/backup-hmac.ts`**

```typescript
import { createHmac, timingSafeEqual } from 'crypto'

const HMAC_FIELD = '_hmac'
const ALGORITHM = 'sha256'

function getKey(): string {
  const key = process.env.NEXTAUTH_SECRET
  if (!key) throw new Error('NEXTAUTH_SECRET not set — cannot sign backup')
  return key
}

/**
 * Returns an HMAC-SHA256 hex digest of the payload (excluding the _hmac field itself).
 * The payload is serialized deterministically before signing.
 */
export function signBackup(payload: Record<string, unknown>): string {
  const { [HMAC_FIELD]: _, ...unsigned } = payload
  const data = JSON.stringify(unsigned, Object.keys(unsigned).sort())
  return createHmac(ALGORITHM, getKey()).update(data).digest('hex')
}

/**
 * Verifies the _hmac field in the payload. Throws if missing or invalid.
 */
export function verifyBackup(payload: unknown): void {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Invalid backup: not an object')
  }
  const obj = payload as Record<string, unknown>
  const providedHmac = obj[HMAC_FIELD]
  if (typeof providedHmac !== 'string' || !providedHmac) {
    throw new Error(
      'Backup file has no integrity signature (_hmac). ' +
      'This file was created before signing was added, or has been tampered with. ' +
      'Use a backup created with the current version of the application.'
    )
  }
  const expectedHmac = signBackup(obj)
  const provided = Buffer.from(providedHmac, 'hex')
  const expected = Buffer.from(expectedHmac, 'hex')
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new Error('Backup integrity check failed: signature does not match. The file may have been tampered with.')
  }
}
```

- [ ] **Step 2: Sign the payload in `src/app/api/admin/backup/export/route.ts`**

```typescript
import { signBackup } from '@/lib/backup-hmac'

// After building the payload object, before JSON.stringify:
const signedPayload = {
  ...payload,
  _hmac: signBackup(payload),
}

// Then:
return new NextResponse(JSON.stringify(signedPayload, null, 2), { ... })
```

- [ ] **Step 3: Verify the signature in `src/app/api/admin/backup/import/route.ts`**

Add the import and verify call before `validatePayload`:

```typescript
import { verifyBackup } from '@/lib/backup-hmac'

// After JSON.parse succeeds, before validatePayload:
try {
  verifyBackup(parsed)
} catch (err) {
  return NextResponse.json({ error: (err as Error).message }, { status: 400 })
}
```

- [ ] **Step 4: Run type check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/backup-hmac.ts src/app/api/admin/backup/export/route.ts src/app/api/admin/backup/import/route.ts
git commit -m "security: HMAC-sign backup exports, verify on import

Uses HMAC-SHA256 keyed on NEXTAUTH_SECRET. Imports without a valid
signature are rejected with an explanation message.
Timing-safe comparison prevents signature oracle attacks."
```

---

## Task 8: Factory reset step-up — require admin password confirmation

**Files:**
- Modify: `src/lib/validation.ts`
- Modify: `src/app/api/admin/factory-reset/route.ts`

Currently any valid admin session + CSRF can trigger factory reset. Add password re-entry so a compromised session alone isn't sufficient.

- [ ] **Step 1: Add `FactoryResetSchema` to `src/lib/validation.ts`**

```typescript
export const FactoryResetSchema = z.object({
  confirm_password: z.string().min(1, 'Password confirmation is required').max(128),
})

export function parseFactoryReset(body: unknown) {
  return FactoryResetSchema.safeParse(body)
}
```

- [ ] **Step 2: Update `src/app/api/admin/factory-reset/route.ts` POST handler**

Add the following after the existing session/CSRF checks and before loading the baseline file:

```typescript
import bcrypt from 'bcryptjs'
import { parseFactoryReset, validationError } from '@/lib/validation'

// Parse and verify confirmation password
let rawBody: unknown
try {
  rawBody = await req.json()
} catch {
  return NextResponse.json({ error: 'Request body required' }, { status: 400 })
}

const confirmParsed = parseFactoryReset(rawBody)
if (!confirmParsed.success) return validationError(confirmParsed.error)

const adminEmail = session!.user.email!
const [adminUser] = await sql<{ password_hash: string }[]>`
  SELECT password_hash FROM users WHERE email = ${adminEmail}
`
if (!adminUser) return NextResponse.json({ error: 'Admin user not found' }, { status: 403 })

const passwordValid = await bcrypt.compare(confirmParsed.data.confirm_password, adminUser.password_hash)
if (!passwordValid) {
  await audit({
    action: 'factory.reset.denied',
    actor: adminEmail,
    ip: getClientIp(req.headers),
    details: 'Wrong confirmation password',
  })
  return NextResponse.json({ error: 'Incorrect password' }, { status: 403 })
}
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/validation.ts src/app/api/admin/factory-reset/route.ts
git commit -m "security: require admin password confirmation for factory reset

Step-up authentication prevents a compromised admin session token
from being used to wipe the database unilaterally."
```

---

## Task 9: Reduce JWT TTL and add session inactivity check

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/get-session.ts`

Current JWT is valid for 24 hours with no inactivity enforcement. Reduce absolute TTL to 8 hours and reject tokens with > 30 minutes of inactivity.

- [ ] **Step 1: Add `lastActive` claim and reduce TTL in `src/lib/auth.ts`**

```typescript
// Change JWT_MAX_AGE_SECONDS (currently 24h):
const JWT_MAX_AGE_SECONDS = 8 * 60 * 60  // 8 hours (was 24)
const INACTIVITY_TIMEOUT_SECONDS = 30 * 60  // 30 minutes

// In the jwt() callback, add lastActive to the token on every sign-in and refresh.
// Find the jwt callback and add:
async jwt({ token, user }) {
  if (user) {
    // First sign-in
    token.id   = user.id
    token.role = user.role
    token.mustChangePassword = user.mustChangePassword
    token.jti  = token.jti ?? randomUUID()
    token.lastActive = Math.floor(Date.now() / 1000)
  } else {
    // Subsequent calls — refresh lastActive
    token.lastActive = Math.floor(Date.now() / 1000)
  }
  return token
},
```

Also update the `maxAge` in the NextAuth session config:
```typescript
session: {
  strategy: 'jwt',
  maxAge: JWT_MAX_AGE_SECONDS,
},
```

- [ ] **Step 2: Enforce inactivity in `src/lib/get-session.ts`**

After the existing revocation checks, add:

```typescript
const INACTIVITY_TIMEOUT_SECONDS = 30 * 60

// After token revocation checks, before returning the session:
const lastActive = (token as { lastActive?: number }).lastActive
if (lastActive) {
  const idleSeconds = Math.floor(Date.now() / 1000) - lastActive
  if (idleSeconds > INACTIVITY_TIMEOUT_SECONDS) {
    return null  // Force re-login — session timed out due to inactivity
  }
}
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/lib/get-session.ts
git commit -m "security: reduce JWT TTL to 8h, add 30-minute inactivity timeout

OWASP ASVS §3.3.2. lastActive claim updated on each authenticated
request; sessions idle for >30 min are rejected server-side."
```

---

## Task 10: Enforce SSL on database connection

**Files:**
- Modify: `src/lib/db.ts`
- Modify: `.env.example` (documentation)

- [ ] **Step 1: Add SSL option to the postgres connection in `src/lib/db.ts`**

```typescript
const sql = globalThis._sql ?? postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 30,
  max_lifetime: 60 * 30,
  connect_timeout: 10,
  connection: {
    application_name: 'cmmc-dashboard',
  },
  // Require SSL in production; allow plain for local Docker (loopback only)
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : false,
})
```

Note: In the Docker Compose setup, app and db are on the same Docker network (127.0.0.1 binding). Production deployments with a remote DB (RDS, etc.) will now enforce TLS and reject self-signed certs.

- [ ] **Step 2: Update `.env.example` to document SSL mode**

```
# Database — append ?sslmode=require for external databases
DATABASE_URL=postgres://user:password@localhost:5432/cmmc
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts .env.example
git commit -m "security: enforce TLS on PostgreSQL connection in production

Uses rejectUnauthorized:true in production. Docker loopback
connections (local/dev) skip SSL — no postgres cert needed there."
```

---

## Task 11: Add rate limiting for evidence upload and backup export in nginx

**Files:**
- Modify: `nginx.conf`
- Modify: `nginx-ssl.conf`

Evidence upload is currently covered only by the generic `/api/` zone (10 req/s). Backup export has no dedicated limit. Add tighter zones for both.

- [ ] **Step 1: Add rate limit zones in `nginx.conf` (inside the `http {}` block)**

```nginx
# Evidence upload — 2 req/s per IP (25 MB files, disk protection)
limit_req_zone $binary_remote_addr zone=evidence:10m rate=2r/s;

# Backup export — 1 req/min per IP (admin-only, large data)
limit_req_zone $binary_remote_addr zone=backup:10m rate=1r/m;
```

- [ ] **Step 2: Add location blocks in `nginx.conf` (before the generic `/api/` block)**

```nginx
# Evidence upload
location /api/practices/ {
  limit_req zone=evidence burst=3 nodelay;
  limit_req_status 429;
  proxy_pass http://nextjs;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  client_max_body_size 26M;
}

# Backup export and import
location /api/admin/backup/ {
  limit_req zone=backup burst=2 nodelay;
  limit_req_status 429;
  proxy_pass http://nextjs;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  client_max_body_size 11M;
}
```

- [ ] **Step 3: Apply the same changes to `nginx-ssl.conf`** (identical blocks inside the `server {}` block that handles HTTPS).

- [ ] **Step 4: Test nginx config syntax**

```bash
docker compose exec nginx nginx -t 2>&1 || nginx -t 2>&1
```
Expected: `syntax is ok` and `test is successful`

- [ ] **Step 5: Commit**

```bash
git add nginx.conf nginx-ssl.conf
git commit -m "security: add rate limits for evidence upload and backup endpoints

Evidence upload: 2 req/s (burst 3). Backup: 1 req/min (burst 2).
Prevents disk exhaustion and backup exfiltration abuse."
```

---

## Task 12: Restrict /api/health to internal network in nginx

**Files:**
- Modify: `nginx.conf`
- Modify: `nginx-ssl.conf`

The health endpoint leaks memory stats, DB connectivity status, and disk info. It should only be reachable from the Docker internal network (for `docker healthcheck`) and optionally a monitoring IP.

- [ ] **Step 1: Update the `/api/health` location in `nginx.conf`**

```nginx
location /api/health {
  # Allow Docker internal network and loopback only
  allow 127.0.0.1;
  allow 172.16.0.0/12;   # Docker bridge networks
  allow 10.0.0.0/8;      # Internal networks
  deny all;

  proxy_pass http://nextjs;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
}
```

If you have a specific monitoring server IP, add `allow <monitoring-ip>;` above `deny all`.

- [ ] **Step 2: Apply the same change to `nginx-ssl.conf`**.

- [ ] **Step 3: Verify docker healthcheck still works**

The `docker-compose.yml` app healthcheck hits `http://127.0.0.1:3000/api/health` directly (bypasses nginx), so this change doesn't break it.

```bash
grep -r "healthcheck\|api/health" docker-compose.yml
```
Expected: healthcheck URL targets port 3000 directly, not via nginx.

- [ ] **Step 4: Commit**

```bash
git add nginx.conf nginx-ssl.conf
git commit -m "security: restrict /api/health to internal networks in nginx

Prevents public fingerprinting of memory, DB, and disk status.
Docker healthcheck bypasses nginx (direct :3000) so it still works."
```

---

## Task 13: Generate random initial admin password in deploy script

**Files:**
- Modify: `scripts/deploy-prod.sh`

Currently `scripts/seed.ts` sets `admin@localhost` / `admin`. The deploy script tells users to change it but doesn't enforce it. Generate a random password at deploy time and print it once.

- [ ] **Step 1: Add a random password generator to `scripts/deploy-prod.sh`**

Find the section that seeds the database (around line 115-139). Replace the hardcoded default with a generated password:

```bash
# Generate a random initial admin password
ADMIN_PASS=$(openssl rand -base64 18 | tr -d '/+=' | head -c 20)
```

- [ ] **Step 2: Pass the generated password to the seed script**

Update the docker run seed command to accept an env var:

```bash
docker run --rm \
  --network "${COMPOSE_PROJECT}_default" \
  -e DATABASE_URL="postgresql://postgres:${PG_PASS}@db:5432/cmmc" \
  -e ADMIN_INITIAL_PASSWORD="${ADMIN_PASS}" \
  ... \
  sh -c "npm ci --prefer-offline --silent 2>&1 | tail -1 && node_modules/.bin/tsx scripts/seed.ts"
```

- [ ] **Step 3: Update `scripts/seed.ts` to read `ADMIN_INITIAL_PASSWORD`**

Find where the admin user is created in `seed.ts` and replace the hardcoded password:

```typescript
import bcrypt from 'bcryptjs'

const adminPassword = process.env.ADMIN_INITIAL_PASSWORD ?? 'admin'
const adminHash = await bcrypt.hash(adminPassword, 13)

// Use adminHash when inserting the admin user
```

- [ ] **Step 4: Update the post-deploy output in `deploy-prod.sh`**

```bash
echo ""
echo "  Login:    admin@localhost"
echo "  Password: ${ADMIN_PASS}"
echo ""
echo "  This password will NOT be shown again. Save it now."
echo "  Change it immediately at: Settings → Change Password"
```

Remove the old hardcoded `echo "  Password: admin"` line.

- [ ] **Step 5: Commit**

```bash
git add scripts/deploy-prod.sh scripts/seed.ts
git commit -m "security: generate random initial admin password at deploy time

Password is printed once during deploy and never stored in scripts.
Removes the hardcoded 'admin' default that required manual rotation."
```

---

## Post-implementation checklist

After all 13 tasks are committed:

- [ ] Run full ESLint: `npx eslint src/ --ext .ts,.tsx`
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Rebuild Docker image and run smoke test: `docker compose build && docker compose up -d`
- [ ] Verify login works, password change works, backup export/import roundtrip works
- [ ] Verify `/api/health` returns 403 from outside Docker network
- [ ] Check nginx rate limits with: `for i in {1..15}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost/api/; done`
- [ ] Create PR from feature branch to master
