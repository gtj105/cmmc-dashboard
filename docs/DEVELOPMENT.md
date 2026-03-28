# Development Guide

For developers working on the CMMC Dashboard codebase. The dev stack has live reload and is **completely isolated** from any stable runtime — you can run both at the same time without touching each other's data.

---

## Getting Started (First Time)

### 1. Prerequisites

- **Docker Desktop** (Mac/Windows) or Docker Engine + Compose plugin (Linux) — must be running
- **Node.js 20+** — only needed on the host for IDE type support (`npm install`). The app itself runs inside Docker.
- **Python 3.10+** — only needed to run the static test suite. Pre-installed on most systems.
- **Git**

Verify:

```bash
docker --version        # Docker version 24+
docker compose version  # v2.x
node --version          # v20+
python3 --version       # 3.10+
```

### 2. Clone and install host dependencies

```bash
git clone https://github.com/gtj105/cmmc-dashboard.git
cd cmmc-dashboard/dashboard

# Install npm deps on the host — needed for IDE autocomplete/type-checking only
npm install
```

### 3. Start the dev instance

```bash
bash ./scripts/start-dev.sh
```

`start-dev.sh` will automatically generate secrets if they don't exist yet (no separate setup step needed). Wait for the `app` container to print `ready started server on 0.0.0.0:3000`. First run takes 2–3 minutes while Docker builds the image. Subsequent starts are under 10 seconds.

> **Migrations run automatically on startup.** The Next.js instrumentation hook runs all pending SQL migration files in `scripts/migrations/` before the app starts serving requests. No manual `psql` steps are needed.

Dev app is at: **http://localhost:3001**

### 4. Seed the database (first time only)

The dev database starts empty. Once the stack is healthy, run the seed once:

```bash
docker compose -p cmmc-dev -f docker-compose.yml -f docker-compose.dev.yml exec app npm run seed
```

This inserts all 110 CMMC practices + 20 ITAR controls + 4 overlay packs, and creates a default admin user (`admin@localhost` / `admin`).

### 6. Start editing

Open the `src/` directory in your editor. Changes to any `.tsx` or `.ts` file under `src/` are picked up immediately via Next.js hot reload — no container restart needed.

Schema changes require a seed re-run (see [Reset the Dev Database](#reset-the-dev-database)).

---

## How the Two-Lane Model Works

There are two independent stacks that never share state:

| Stack | Compose project | Port | Volumes | Started with |
|---|---|---|---|---|
| **Runtime** (stable, production-like) | `cmmc` (default) | 80 | `pgdata`, `evidence_data` | `start-runtime.sh` |
| **Dev** (live-reload) | `cmmc-dev` | 3001 | `pgdata-dev`, `evidence-dev` | `start-dev.sh` |

You can run both simultaneously. The dev overlay (`docker-compose.dev.yml`):

- Mounts `src/` into the container so edits hot-reload without a rebuild
- Runs `npm run dev` instead of the production binary
- Uses its own `pgdata-dev` and `evidence-dev` volumes
- Exposes port 3001 instead of 80
- Disables nginx and backup sidecars (not needed in dev)

---

## Reset the Dev Database

Wipe dev data and start fresh — the production runtime is never touched:

```bash
docker compose -p cmmc-dev -f docker-compose.yml -f docker-compose.dev.yml down -v
bash ./scripts/start-dev.sh
docker compose -p cmmc-dev -f docker-compose.yml -f docker-compose.dev.yml exec app npm run seed
```

---

## Running Tests

Tests are static — no running database or Docker required:

```bash
# Run the full suite from the repo root
python3 -m unittest discover -s tests -v
```

Or target a specific module:

```bash
# Deployment config (NEXTAUTH_URL, HOSTNAME, CSRF, Docker env)
python3 -m unittest tests.test_deployment_config -v

# SPRS weights, baseline.json, migration alignment
python3 -m unittest tests.test_data_invariants -v

# Auth flow (signOut callbackUrl, redirect:false, JWT strategy)
python3 -m unittest tests.test_auth_flow_config -v
```

Post-deploy smoke test (requires the runtime stack to be running):

```bash
bash ./scripts/smoke-test.sh
```

---

## Key Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Base service definitions (db, app, nginx, backup) |
| `docker-compose.dev.yml` | Dev overlay — mounted source, port 3001, isolated volumes |
| `docker-compose.ssl.yml` | TLS overlay for production — port 443, Let's Encrypt certs |
| `scripts/start-dev.sh` | Start the dev instance |
| `scripts/start-runtime.sh` | Start the production runtime |
| `scripts/bootstrap.sh` | One-shot production setup (secrets + seed + start) |
| `scripts/setup-secrets.sh` | Generate secrets only |
| `scripts/seed.ts` | Schema creation + initial practice/ITAR/overlay data |
| `scripts/validate-db.ts` | DB invariant checker |
| `src/` | Next.js app source |
| `src/lib/auth.ts` | NextAuth config, JWT logic, session revocation |
| `src/lib/validation.ts` | Zod schemas for all API mutation routes |
| `src/middleware.ts` | Auth enforcement + must-change-password redirect |
| `tests/` | Python-based static test suite |

---

## Dockerfile Stages

The Dockerfile has three stages:

- `deps` — installs npm dependencies; used by the dev compose via `target: deps`
- `builder` — compiles the Next.js standalone output
- `runner` — minimal production image, just the compiled app

The dev compose targets `deps` so the container has `node_modules` but skips the full build, which is what makes hot reload work.

---

## Keeping Dev Isolated from Runtime

Never run dev tooling against the production compose project. Always include `-p cmmc-dev -f docker-compose.yml -f docker-compose.dev.yml` when targeting dev, or use the wrapper scripts.

The `start-runtime.sh` and `stop-runtime.sh` scripts target the default `cmmc` project and will never touch dev volumes.

A quick sanity check — lists containers for the dev project only:

```bash
docker compose -p cmmc-dev -f docker-compose.yml -f docker-compose.dev.yml ps
```
