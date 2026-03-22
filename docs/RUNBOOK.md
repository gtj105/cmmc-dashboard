# Dashboard Runbook

## Purpose

This runbook is the practical operating guide for the internal CMMC dashboard.

Use it when you need to:

- start or stop the stack
- reset local data
- seed a fresh environment
- create or manage users
- export a backup
- import a backup into a fresh dashboard
- troubleshoot the most common issues

## 1. Start The Dashboard

Project root:

```bash
cd /Users/gtj105/Documents/obsidian/dashboard
```

Start all services:

```bash
docker compose up -d
```

Open:

```text
http://localhost/login
```

Check status:

```bash
docker compose ps
```

Expected services:

- `db`
- `app`
- `nginx`

## 2. Stop The Dashboard

```bash
docker compose down
```

This stops containers but preserves data.

## 3. Reset Local Data

Only do this when it is safe to destroy local dashboard data.

```bash
docker compose down -v
docker compose up -d db
npm run seed
docker compose up -d app nginx
```

What this does:

- removes the local Postgres volume
- recreates the database
- seeds sample CMMC and ITAR data
- recreates the default admin user

Default admin after seed:

- email: `admin@localhost`
- password: `admin`

## 4. User Management

### Create A User

```bash
npm run create-user -- --email user@example.com --name "User Name" --role viewer
```

The script will:

- prompt for password
- prompt for confirmation
- hash the password with bcrypt
- insert the user

Valid roles:

- `viewer`
- `editor`
- `admin`

### List Users

```bash
npm run list-users
```

### Change A User Role

```bash
npm run set-role -- --email user@example.com --role editor
```

## 5. Data Backup And Restore

### Export Dashboard Data

```bash
npm run export-data -- --file exports/dashboard-backup.json
```

The export contains:

- `users`
- `domains`
- `practices`
- `poam_items`
- `practice_history`

### Import Dashboard Data

Use import for a fresh environment or a deliberate restore.

```bash
npm run import-data -- --file exports/dashboard-backup.json --wipe
```

Important:

- `--wipe` truncates existing dashboard data first
- import is not a merge workflow
- the export file should be treated as sensitive

## 6. Build And Verification

Type check:

```bash
./node_modules/.bin/tsc --noEmit
```

Build app image:

```bash
docker compose build app
```

Bring updated stack up:

```bash
docker compose up -d
```

## 7. Overlay Workflow

If overlay mapping data changes in code, reseed the local database before testing the dashboard.

Use:

```bash
rm -rf .next
npm run seed
npm run dev
```

Current overlay notes:

- the local seed currently loads `4` available overlay packs, all off by default
- current seeded mapping counts:
  - `Microsoft 365 GCC High`: `44`
  - `Azure Government`: `92`
  - `Microsoft Defender`: `58`
  - `Microsoft Purview`: `42`
- the overview trend section currently keeps both the burndown chart and the domain radar

Coverage behavior:

- fully inherited `CSP` controls count toward progress to the `110`
- `Shared` controls automatically present as `In Progress` when their raw status is still `Not Started`
- `Shared` controls require OSC completion before they count as covered
- `Validation required` controls do not count until validated
- risk and POA&M remain focused on OSC work still open

## 8. Troubleshooting

### Login Page Does Not Load

Check:

```bash
docker compose ps
```

Then restart:

```bash
docker compose up -d
```

### Database Authentication Fails

Make sure `.env` and the current Postgres volume agree on the password.

If this is a blank local environment, the cleanest fix is:

```bash
docker compose down -v
docker compose up -d db
npm run seed
docker compose up -d app nginx
```

### User Cannot Edit

Check the user role:

```bash
npm run list-users
```

Then promote if needed:

```bash
npm run set-role -- --email user@example.com --role editor
```

### Import Fails On Existing Data

Use:

```bash
npm run import-data -- --file exports/dashboard-backup.json --wipe
```

The current import path expects a clean destination when IDs and unique keys already exist.

### Overlay Numbers Look Wrong

Most commonly this is one of three issues:

1. The local database was not reseeded after mapping changes.
2. A stale Next.js cache is still serving old client chunks.
3. The overlay was not enabled on `/overlays`.

Use:

```bash
rm -rf .next
npm run seed
npm run dev
```

Then:

- log in again
- enable the overlay packs you want to test on `/overlays`
- reload `/overview`

## 9. Operational Rule Of Thumb

This dashboard is intentionally simple.

Use the CLI for infrequent admin tasks.
Do not build a management UI unless those admin tasks become frequent enough to justify the extra surface area.

## Evidence File Backup

Evidence files are stored in the `evidence_data` Docker named volume at `/data/evidence/` inside the app container. They are NOT included in the `export-data` JSON backup.

To back up evidence files:

```bash
docker run --rm \
  -v evidence_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/evidence-$(date +%Y%m%d).tar.gz /data
```

To restore (substitute the actual backup filename for `evidence-YYYYMMDD.tar.gz`):

```bash
docker run --rm \
  -v evidence_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/evidence-YYYYMMDD.tar.gz -C /
```

Run both the database export and the evidence backup together for a complete snapshot.
