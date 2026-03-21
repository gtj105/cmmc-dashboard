# CMMC Dashboard

Internal compliance tracking dashboard for CMMC Level 2 and ITAR overlay work.

This project is designed for a small trusted user set. It is not intended to be a public-facing multi-tenant product. The current system provides:

- authenticated access with simple roles
- CMMC and ITAR practice tracking
- POA&M tracking
- activity history
- admin CLI utilities for user and data management

## Current Role Model

- `viewer`: read-only access
- `editor`: can update practices and create/update POA&M items
- `admin`: can do editor actions plus delete POA&M items

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Node.js 20+ (only needed for CLI scripts — not required to run the app)

## Environment Setup

Create a `.env.local` file in the project root before starting:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and set a strong random value for `NEXTAUTH_SECRET`:

```
NEXTAUTH_SECRET=your-random-secret-here
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cmmc
```

Generate a secret with: `openssl rand -base64 32`

## Quick Start

From the project root:

```bash
docker compose up -d
```

Open:

```text
http://localhost/login
```

Seeded default admin:

- email: `admin@localhost`
- password: `admin`

## Common Commands

Start the stack:

```bash
docker compose up -d
```

Stop the stack:

```bash
docker compose down
```

Reset and reseed blank local data:

```bash
docker compose down -v
docker compose up -d db
npm run seed
docker compose up -d app nginx
```

Create a user:

```bash
npm run create-user -- --email user@example.com --name "User Name" --role viewer
```

List users:

```bash
npm run list-users
```

Change role:

```bash
npm run set-role -- --email user@example.com --role editor
```

Export data:

```bash
npm run export-data -- --file exports/dashboard-backup.json
```

Import data into a fresh or reset dashboard:

```bash
npm run import-data -- --file exports/dashboard-backup.json --wipe
```

## Documentation

- [Operational Runbook](./docs/RUNBOOK.md)
- [Security and Operations Notes](./docs/SECURITY-AND-OPERATIONS.md)

## Notes

- the local database is published only on `127.0.0.1:5432`
- the export file contains sensitive compliance data and password hashes
- import is intended for restore/migration, not merge
