# CMMC Dashboard

Internal compliance tracking dashboard for CMMC Level 2 and ITAR overlay work.

![Overview](docs/screenshots/overview.png)

Designed for a small trusted user set. Not a public-facing multi-tenant product. Features include:

- Authenticated access with role-based access control (viewer / editor / admin)
- CMMC Level 2 and ITAR practice tracking across all 14 domains
- SPRS score calculation and compliance gauge
- Evidence management — attach files and URLs to practices
- POA&M tracking with milestone progress
- Activity history across all practice changes
- Assessment report export (print to PDF via Ctrl+P)
- Admin user management UI

---

## Two Supported Modes

**Internal runtime** — the stable deployment for your team. Runs on port 80 with automated nightly backups.

**Development runtime** — an isolated instance for active development. Runs on port 3001 with live reload. Never touches the runtime database.

---

## Internal Runtime: Getting Started

### 1. Install Docker Desktop

Go to [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop), download for your OS, and start it. Wait until the Docker icon shows "Docker Desktop is running."

### 2. Get the code

Download from [https://github.com/gtj105/cmmc-dashboard](https://github.com/gtj105/cmmc-dashboard) via the green Code button → Download ZIP, then unzip it.

Or with Git: `git clone https://github.com/gtj105/cmmc-dashboard.git`

### 3. Open a terminal in the project folder

**Mac:** Right-click the project folder in Finder → New Terminal at Folder

**Windows:** Open the folder in File Explorer, click the address bar, type `cmd`, press Enter

### 4. Bootstrap the runtime

```bash
bash ./scripts/bootstrap.sh
```

This is the only command you need for a fresh install. It generates secrets, starts the database, seeds the schema, creates a default admin, and starts the full stack.

The app will be available at **http://localhost** when it finishes.

### 5. Log in and change the default password

Default login: `admin@localhost` / `changeme`

**Change this password immediately after first login.**

---

## Common Operations

Start the runtime:
```bash
bash ./scripts/start-runtime.sh
```

Stop the runtime (data is preserved):
```bash
bash ./scripts/stop-runtime.sh
```

Add an admin user:
```bash
bash ./scripts/create-admin.sh --email jane@example.com --name "Jane Doe" --password "secure-password"
```

Export data to JSON:
```bash
bash ./scripts/export-runtime.sh
```

Import from a JSON export:
```bash
bash ./scripts/import-runtime.sh --file exports/export-20250101-120000.json
```

Run DB validation:
```bash
bash ./scripts/validate-runtime.sh
```

Run post-deploy smoke test:
```bash
bash ./scripts/smoke-test.sh
```

---

## User Roles

| Role | Access |
|---|---|
| `viewer` | Read-only |
| `editor` | Update practices, create/update POA&M items |
| `admin` | Full access including user management |

---

## Documentation

- [Deployment Guide](./docs/DEPLOYMENT.md) — operator-first setup, backup/restore, configuration
- [Development Guide](./docs/DEVELOPMENT.md) — dev runtime, live-reload, isolated volumes
- [Operational Runbook](./docs/RUNBOOK.md) — incident response, health checks, advanced ops
- [Security and Operations Notes](./docs/SECURITY-AND-OPERATIONS.md)

---

## Security Notes

- The `./secrets/` directory contains generated credentials. It is `.gitignore`'d and must never be committed.
- The export file contains compliance data and password hashes. Handle it accordingly.
- The database port is published only on `127.0.0.1`, not the network interface.
- Import is a restore/migration tool, not a merge operation.
