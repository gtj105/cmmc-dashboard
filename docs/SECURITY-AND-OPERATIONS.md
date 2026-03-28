# Security And Operations Notes

## Security Hardening — March 2026

The following controls were added in March 2026:

1. **Token revocation on every API request** — `getAuthSession()` checks both `revoked_tokens` (per-token JTI) and `user_invalidations` (per-user) on every authenticated request, not just at login.
2. **User deletion invalidates all active tokens** — deleting a user writes a row to `user_invalidations`; any existing JWT for that user is rejected immediately on the next request.
3. **DB-backed login rate limiter** — failed login attempts are tracked in the `login_attempts` table; 5 failures triggers a 15-minute lockout that survives app and container restarts.
4. **Backup file size limit** — the backup restore endpoint rejects uploaded files larger than 10 MB before parsing.
5. **Zod row-level validation on backup restore** — every row in an uploaded backup is validated against its Zod schema; malformed payloads are rejected before touching the database.
6. **Backup restore never accepts password hashes** — `password_hash` is rejected from any restore payload; all restored users are forced to set a new password on first login.
7. **Timing-safe CSRF token comparison** — `checkCsrf()` uses `crypto.timingSafeEqual` to prevent timing-based token oracle attacks.
8. **CSRF `Secure` flag conditioned on HTTPS** — `csrfCookieHeaders()` sets `Secure` only when `NEXTAUTH_URL` starts with `https`, so the cookie works correctly in HTTP-only dev environments.
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
- user records
- password hashes

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
