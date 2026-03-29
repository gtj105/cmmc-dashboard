# Deployment Guide

This guide is for operators standing up or maintaining the CMMC Dashboard in production. No host-side Node.js is required — everything runs through Docker.

---

## Prerequisites

Install these before you begin:

| Requirement | Version | How to check |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Mac/Windows) or Docker Engine + Compose plugin (Linux) | Docker 24+ | `docker --version` |
| Git | Any | `git --version` |

Make sure Docker is **running** (Docker Desktop icon in taskbar, or `docker info` returns no error).

---

## First-Time Production Deploy

On a fresh machine, run these two commands:

```bash
git clone https://github.com/gtj105/cmmc-dashboard.git ~/cmmc-dashboard-prod
bash ~/cmmc-dashboard-prod/scripts/deploy-prod.sh
```

The deploy script will:

1. **Check** Docker is installed and running
2. **Clone** the repo into `~/cmmc-dashboard-prod`
3. **Generate** secure random secrets (`postgres_password.txt`, `nextauth_secret.txt`)
4. **Prompt** for your server's URL (e.g. `http://10.0.1.50` or `http://cmmc.internal`) — press Enter to use `http://localhost`
5. **Build** the Docker images and start all services
6. **Wait** for the app to be healthy
7. **Seed** the database with baseline CMMC data

When complete, the app is running at the URL you entered.

**Login:** `admin@localhost` / `admin`
**First thing:** Change the admin password (Settings → Change Password) and set your org name (Settings → Organization).

---

## If you already have the repo cloned

Run the deploy script directly from the repo:

```bash
bash ~/cmmc-dashboard-prod/scripts/deploy-prod.sh
```

---

## Day-to-Day Operations

All commands run from `~/cmmc-dashboard-prod/`.

### Start the stack

```bash
bash scripts/start-runtime.sh
```

### Stop the stack (data is preserved)

```bash
bash scripts/stop-runtime.sh
```

### View live logs

```bash
docker compose logs -f app
```

### Add an admin user

```bash
bash scripts/create-admin.sh --email jane@example.com --name "Jane Doe" --password "secure-password"
```

### Check stack health

```bash
docker compose ps
```

All services should show `healthy` or `running`.

---

## Updating to the Latest Version

From `~/cmmc-dashboard-prod/`:

```bash
git pull && docker compose up -d --build
```

Migrations run automatically when the app boots. No manual database steps needed.

Verify afterward:

```bash
bash scripts/validate-runtime.sh
```

---

## Backup and Restore

Automated backups run nightly at 2 AM via the `backup` sidecar container and are stored in the `backup_data` Docker volume.

### Manual export

```bash
bash scripts/export-runtime.sh
```

The export file is saved to `./exports/` on the host.

### Restore from export

```bash
bash scripts/import-runtime.sh --file exports/export-20260101-120000.json
```

Add `--wipe` to clear all existing data first:

```bash
bash scripts/import-runtime.sh --file exports/export-20260101-120000.json --wipe
```

---

## Smoke Test

After any deploy or restore, verify the stack is healthy:

```bash
bash scripts/smoke-test.sh
```

All checks should pass.

---

## Configuration

Secrets and environment config live in `~/cmmc-dashboard-prod/`:

| File | What it contains |
|---|---|
| `secrets/postgres_password.txt` | PostgreSQL password — generated automatically, never commit |
| `secrets/nextauth_secret.txt` | NextAuth JWT signing key — generated automatically, never commit |
| `.env` | Non-secret config: `POSTGRES_PASSWORD`, `NEXTAUTH_URL` |

> **How NEXTAUTH_SECRET reaches the app:** `docker-entrypoint.sh` reads `nextauth_secret.txt` at container startup and exports it as an environment variable. This is required because Next.js Edge middleware cannot read files at runtime — it needs the value as an env var. You never need to set `NEXTAUTH_SECRET` manually.

**Never edit secret files by hand.** To rotate secrets, delete the relevant file and re-run:

```bash
bash scripts/setup-secrets.sh
```

### Organization name

Set your organization name from within the app: **Settings → Organization** (admin only). No restart needed.

### NEXTAUTH_URL

Must match the URL users access the app at. Edit `.env`:

```
NEXTAUTH_URL=http://10.0.1.50
```

Then restart:

```bash
bash scripts/stop-runtime.sh && bash scripts/start-runtime.sh
```

### HTTPS / TLS

For HTTPS, see `docs/SECURITY-AND-OPERATIONS.md` and `docs/RUNBOOK.md`.

---

## Troubleshooting

**App won't start / database unreachable**

```bash
docker compose ps          # check all services are running
docker compose logs db     # check database logs
docker compose logs app    # check app logs
```

**Secrets missing**

```bash
bash scripts/setup-secrets.sh   # safe to re-run; never overwrites existing secrets
```

**Full reset — destroys all data**

```bash
docker compose down -v
bash scripts/deploy-prod.sh
```

---

## Directory Layout After Deploy

```
~/cmmc-dashboard-prod/
├── secrets/                  # generated secrets (never commit)
│   ├── postgres_password.txt
│   └── nextauth_secret.txt
├── .env                      # non-secret config
├── exports/                  # manual backup exports land here
├── scripts/
│   ├── deploy-prod.sh        # first-time setup (this script)
│   ├── start-runtime.sh      # start stack
│   ├── stop-runtime.sh       # stop stack
│   ├── create-admin.sh       # add admin user
│   ├── export-runtime.sh     # manual backup
│   ├── import-runtime.sh     # restore from backup
│   ├── validate-runtime.sh   # DB validation
│   └── smoke-test.sh         # health check
└── docker-compose.yml
```
