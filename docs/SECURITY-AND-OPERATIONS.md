# Security And Operations Notes

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
- `NEXTAUTH_SECRET`
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
