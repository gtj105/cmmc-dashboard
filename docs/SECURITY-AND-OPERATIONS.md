# Security And Operations Notes

## Security Hardening — April 2026 (OWASP ASVS review)

The following controls were added or strengthened in April 2026 based on a full OWASP ASVS-aligned review:

1. **bcrypt cost factor raised to 13** — OWASP ASVS §2.4.1. Applies to all new hashes. The `DUMMY_HASH` used for timing protection on unknown-email logins was also regenerated at cost 13 to maintain equal compare time.
2. **Password complexity enforced** — Passwords must contain at least one uppercase letter, lowercase letter, digit, and special character in addition to the 12-character minimum (OWASP ASVS §2.1.1).
3. **Password history** — The last 5 password hashes are stored per user in `password_history`; reuse of any of them is rejected (OWASP ASVS §2.1.9).
4. **File upload magic number validation** — `validateFileMagic()` reads the first bytes of every uploaded evidence file and compares against expected magic bytes for the declared extension. Client-supplied MIME type is no longer trusted.
5. **ZIP files removed from allowed evidence types** — Eliminates decompression bomb risk. PDF, images, Office docs (.docx/.xlsx), CSV, and plain text remain allowed.
6. **Nonce-based Content Security Policy** — Per-request cryptographic nonce generated in Edge middleware. `script-src` no longer includes `unsafe-inline` or `unsafe-eval`. CSP header is set by middleware (not nginx) so the nonce is available to Next.js.
7. **Backup HMAC signing** — Every exported backup is signed with HMAC-SHA256 keyed on `NEXTAUTH_SECRET`. The import endpoint rejects any backup without a valid `_hmac` field. Timing-safe comparison prevents signature oracle attacks.
8. **Factory reset step-up authentication** — The `POST /api/admin/factory-reset` endpoint now requires the admin's current password in the request body. A wrong password is audit-logged and rejected with 403.
9. **JWT TTL reduced; inactivity timeout added** — Absolute TTL reduced from 24 hours to 8 hours. A `lastActive` claim is updated on every authenticated request; sessions idle for more than 30 minutes are rejected server-side (OWASP ASVS §3.3.2).
10. **Database TLS enforced in production** — `rejectUnauthorized: true` in the postgres connection config when `NODE_ENV=production`. Docker loopback connections in dev/local skip SSL.
11. **Rate limits for evidence upload and backup** — nginx: evidence upload capped at 2 req/s (burst 3); backup export/import at 1 req/min (burst 2).
12. **`/api/health` restricted to internal networks** — nginx allows only `127.0.0.1`, Docker bridge (`172.16.0.0/12`), and internal (`10.0.0.0/8`); all other sources receive 403. The Docker healthcheck hits port 3000 directly and is unaffected.
13. **Random initial admin password** — `deploy-prod.sh` generates a cryptographically random 20-character password via `openssl rand` and prints it once. The hardcoded `admin` default is gone. `must_change_password` is set to `true` on the seeded admin user.

## Security Hardening — March 2026

The following controls were added in March 2026:

1. **Token revocation on every API request** — `getAuthSession()` checks both `revoked_tokens` (per-token JTI) and `user_invalidations` (per-user) on every authenticated request, not just at login.
2. **User deletion invalidates all active tokens** — deleting a user writes a row to `user_invalidations`; any existing JWT for that user is rejected immediately on the next request.
3. **DB-backed login rate limiter** — failed login attempts are tracked in the `login_attempts` table; 5 failures triggers a 15-minute lockout that survives app and container restarts.
4. **Backup file size limit** — the backup restore endpoint rejects uploaded files larger than 10 MB before parsing.
5. **Zod row-level validation on backup restore** — every row in an uploaded backup is validated against its Zod schema; malformed payloads are rejected before touching the database.
6. **Backup restore never accepts password hashes** — `password_hash` is rejected from any restore payload; all restored users are forced to set a new password on first login.
7. **Timing-safe CSRF token comparison** — `checkCsrf()` uses `crypto.timingSafeEqual` to prevent timing-based token oracle attacks.
8. **CSRF `Secure` flag conditioned on HTTPS** — sets `Secure` only when `NEXTAUTH_URL` starts with `https`, so the cookie works correctly in HTTP-only dev environments.
9. **Health endpoint error masking** — `/api/health` returns generic status messages to callers; detailed DB errors are logged server-side only.
10. **Evidence URL validation** — URL fields accept only `http`/`https` scheme, capped at 2048 characters; other schemes and overlong values are rejected at the API layer.

---

## Intended Use

This dashboard is intended for a small set of trusted internal users.

It is not currently designed as:

- a public SaaS
- a multi-tenant product
- a full enterprise identity and access platform

That assumption matters for how much admin surface and complexity is appropriate.

## Security Boundary

Current protections include:

- authenticated access with simple roles
- write authorization by role
- loopback-only Postgres host publishing
- container hardening basics
- no `.env` in Docker build context
- runtime-only `NEXTAUTH_SECRET`

## Role Model

- `viewer`
  Read-only access to dashboard data

- `editor`
  Can update practices and create/update POA&M items

- `admin`
  Can do editor actions plus destructive POA&M delete

## Secret Handling

Secrets belong in runtime environment variables, not in the image.

Important variables:

- `POSTGRES_PASSWORD`
- `NEXTAUTH_SECRET` — In production, `docker-entrypoint.sh` reads the Docker secret file at startup and exports `NEXTAUTH_SECRET` before the app starts — it never needs to be in `.env`. In dev, `setup-secrets.sh` writes it to `.env` and Next.js auto-loads it.
- `NEXTAUTH_URL`

Do not put real secrets into:

- `Dockerfile`
- committed docs
- `.env.example`

## Database Exposure

Postgres is intentionally bound to:

```text
127.0.0.1:5432
```

That keeps it available for local admin and scripting while avoiding broader host/network exposure.

## Export / Import Sensitivity

The JSON export contains:

- compliance tracking data
- POA&M data
- activity history
- user records (no password hashes — intentionally excluded)

Exports are HMAC-signed with `NEXTAUTH_SECRET`. Imports verify the signature before touching the database — tampered or unsigned files are rejected.

Treat exported files as sensitive operational backups.

Do not send them casually or store them in uncontrolled locations.

## Why Import Uses `--wipe`

The current import path is designed for:

- restore
- migration
- cloning a known-good state into a fresh dashboard

It is not designed for:

- record-level merge
- partial reconciliation
- conflict resolution

That is why destructive import is explicit.

## Practical Guidance

Do not overbuild this system yet.

For the current use case, the right balance is:

- enough security to avoid obvious mistakes
- enough admin tooling to operate safely
- minimal UI/admin complexity

If future usage changes, revisit:

- SSO or MFA
- stronger audit attribution
- richer validation
- user-management UI
- more structured backup lifecycle
