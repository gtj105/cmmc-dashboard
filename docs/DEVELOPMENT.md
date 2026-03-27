# Development Guide

This document is for developers working on the CMMC Dashboard codebase. It describes how to run a live-reload dev instance that is **completely isolated** from the stable internal runtime.

---

## How the Two-Lane Model Works

There are two independent stacks:

| Stack | Compose project | Port | Volumes | Started with |
|---|---|---|---|---|
| **Runtime** (stable) | `cmmc` (default) | 80 | `pgdata`, `evidence_data` | `start-runtime.sh` |
| **Dev** (live-reload) | `cmmc-dev` | 3001 | `pgdata-dev`, `evidence-dev` | `start-dev.sh` |

They never share a database or evidence volume. You can run both simultaneously without interference.

---

## Prerequisites

- Docker Desktop or Docker Engine + Compose
- Node.js 20 (only needed to install dependencies on the host for IDE support — not for running the app)

---

## Start the Dev Instance

```bash
bash ./scripts/start-dev.sh
```

The app starts on **http://localhost:3001** with live reload. Source code is mounted into the container so edits appear immediately without rebuilding the image.

This uses `docker-compose.dev.yml` as an overlay on top of `docker-compose.yml`. The dev overlay:

- Binds the source directory into the container
- Runs `npm run dev` instead of the production server
- Uses separate volumes (`pgdata-dev`, `evidence-dev`)
- Exposes port 3001 instead of 80
- Disables the nginx and backup sidecars (not needed in dev)

---

## Seed the Dev Database

On first start the dev DB is empty. Run the seed inside the dev container:

```bash
docker compose -p cmmc-dev -f docker-compose.yml -f docker-compose.dev.yml exec app npm run seed
```

---

## Reset the Dev Database

To wipe the dev database and start fresh:

```bash
docker compose -p cmmc-dev -f docker-compose.yml -f docker-compose.dev.yml down -v
bash ./scripts/start-dev.sh
docker compose -p cmmc-dev -f docker-compose.yml -f docker-compose.dev.yml exec app npm run seed
```

This only affects the dev volumes (`pgdata-dev`, `evidence-dev`). The production runtime is untouched.

---

## Running Tests

Tests are static (no live DB required) and run from the project root:

```bash
cd dashboard
python3 -m unittest discover -s tests -v
```

Or target specific suites:

```bash
# Deployment config (NEXTAUTH_URL, HOSTNAME, CSRF, Docker env)
python3 -m unittest tests.test_deployment_config -v

# SPRS weights, baseline.json, migration alignment
python3 -m unittest tests.test_data_invariants -v

# Auth flow (signOut callbackUrl, redirect:false, JWT strategy)
python3 -m unittest tests.test_auth_flow_config -v
```

---

## Key Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Base runtime config |
| `docker-compose.dev.yml` | Dev overlay (mounted source, port 3001, isolated volumes) |
| `scripts/start-dev.sh` | Start the dev instance |
| `scripts/start-runtime.sh` | Start the production runtime |
| `src/` | Next.js app source |
| `scripts/seed.ts` | Schema creation and initial data |
| `scripts/validate-db.ts` | DB invariant checker |
| `tests/` | Python-based static test suite |

---

## Dockerfile Stages

The Dockerfile has three stages:

- `deps` — installs npm dependencies (used by dev for live-reload)
- `builder` — builds the Next.js standalone output
- `runner` — minimal production image

The dev compose uses `target: deps` so the container has node_modules but skips the full production build.

---

## Keeping Dev Isolated from Runtime

The most important rule: **never run dev tooling against the production compose project**. Always include `-p cmmc-dev -f docker-compose.yml -f docker-compose.dev.yml` when targeting the dev stack, or use the provided wrapper scripts.

The wrapper scripts (`start-runtime.sh`, `stop-runtime.sh`) target the default compose project and will never touch dev volumes.
