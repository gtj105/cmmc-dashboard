# Dashboard Runbook

## Purpose

Practical operating guide for the internal CMMC Dashboard. All normal operations run through the wrapper scripts — no host-side Node.js required.

For first-time setup, see [docs/DEPLOYMENT.md](./DEPLOYMENT.md).
For developer workflow, see [docs/DEVELOPMENT.md](./DEVELOPMENT.md).

---

## 1. Start and Stop

Start the runtime:

```bash
bash ./scripts/start-runtime.sh
```

Stop the runtime (data preserved):

```bash
bash ./scripts/stop-runtime.sh
```

Check service status:

```bash
docker compose ps
```

Expected services: `db`, `app`, `nginx`, `backup`

Access the app at: `http://localhost/login`

---

## 2. Full Reset (destroys all data)

Only do this when it is safe to destroy existing data.

```bash
docker compose down -v
bash ./scripts/bootstrap.sh
```

This wipes all volumes and runs a clean bootstrap. Default admin after reset: `admin@localhost` / `changeme`.

---

## 3. User Management

### Create an admin user

```bash
bash ./scripts/create-admin.sh --email user@example.com --name "User Name" --password "secure-password"
```

### Create a viewer or editor (inside the container)

```bash
docker compose exec app npm run create-user -- --email viewer@example.com --name "Viewer" --role viewer
docker compose exec app npm run create-user -- --email editor@example.com --name "Editor" --role editor
```

New users created this way (or via the admin UI) have `must_change_password = true`. On their first login they are redirected to `/set-password` and cannot access the dashboard until they set a permanent password. Share the temporary password you specified out-of-band (Signal, 1Password, etc).

### List users

```bash
docker compose exec app npm run list-users
```

### Change a user role

```bash
docker compose exec app npm run set-role -- --email user@example.com --role editor
```

Valid roles: `viewer`, `editor`, `admin`

---

## 4. Data Backup and Restore

### Manual JSON export

```bash
bash ./scripts/export-runtime.sh
```

Output lands in `./exports/` on the host.

The export contains: `users` (without `password_hash`), `domains`, `practices`, `poam_items`, `practice_history`. After a restore, all users have `must_change_password = true` and must set a new password on first login.

### Import from a JSON export

```bash
bash ./scripts/import-runtime.sh --file exports/export-20250101-120000.json
```

Add `--wipe` to truncate existing data before importing:

```bash
bash ./scripts/import-runtime.sh --file exports/export-20250101-120000.json --wipe
```

Import expects the schema to already exist. If importing to a fresh instance, run `bash ./scripts/bootstrap.sh` first.

### Automated backups

The `backup` container runs nightly at 2 AM. Backups are stored in the `backup_data` Docker volume.

### Evidence file backup

Evidence files live in the `evidence_data` Docker volume at `/data/evidence/` inside the app container. They are not included in the JSON export.

To back up evidence files:

```bash
docker run --rm \
  -v evidence_data:/data \
  -v "$(pwd)/backups":/backup \
  alpine tar czf /backup/evidence-$(date +%Y%m%d).tar.gz /data
```

To restore (replace filename with your actual backup):

```bash
docker run --rm \
  -v evidence_data:/data \
  -v "$(pwd)/backups":/backup \
  alpine tar xzf /backup/evidence-YYYYMMDD.tar.gz -C /
```

Run both the JSON export and the evidence backup for a complete snapshot.

---

## 5. Validation and Smoke Test

Run DB invariant checks (after imports, migrations, or schema changes):

```bash
bash ./scripts/validate-runtime.sh
```

Run post-deploy smoke test:

```bash
bash ./scripts/smoke-test.sh
```

---

## 6. Build and Deploy Updates

Rebuild the app image after code changes:

```bash
docker compose build app
bash ./scripts/start-runtime.sh
```

> **Migrations run automatically on startup.** The Next.js instrumentation hook applies all pending SQL migration files in `scripts/migrations/` before the app begins serving requests. No manual `psql` steps are needed after an upgrade.

After updating schema or seeding data:

```bash
bash ./scripts/seed-runtime.sh
bash ./scripts/validate-runtime.sh
```

---

## 6a. Database Tables Reference

| Table | Purpose |
|---|---|
| `domains` | 14 CMMC + 1 ITAR domain definitions |
| `practices` | 110+ controls with status, risk, SPRS weight |
| `users` | Auth (email, bcrypt hash, role, must_change_password) |
| `practice_evidence` | File and URL attachments |
| `practice_history` | Field-level change audit trail |
| `poam_items` | Plan of Action & Milestones |
| `overlay_packs` | Cloud overlay definitions (4 packs) |
| `overlay_mappings` | Practice → CSP control mapping |
| `overlay_validations` | Inheritance verification evidence |
| `security_events` | Security audit log (login, CSRF, user changes) |
| `revoked_tokens` | Per-token JTI revocation on logout; auto-purged after expiry |
| `login_attempts` | Tracks failed login attempts per email; auto-cleared on successful login; survives restarts |
| `user_invalidations` | Records when a user's tokens were invalidated (on deletion); checked on every API request |
| `schema_migrations` | Tracks which SQL migration files have been applied; prevents double-application |

---

## 7. Overlay Workflow

If overlay mapping data changes in code, reseed the dev database before testing:

```bash
docker compose -p cmmc-dev -f docker-compose.yml -f docker-compose.dev.yml exec app npm run seed
```

Current overlay notes:

- 4 overlay packs available, all off by default
- Seeded mapping counts: M365 GCC High (44), Azure Government (92), Defender (58), Purview (42)
- Fully inherited CSP controls count toward the 110
- Shared controls auto-present as In Progress when raw status is Not Started
- Shared controls require OSC completion before they count as covered
- Validation required controls do not count until validated

---

## 8. Troubleshooting

### Login page does not load

```bash
docker compose ps
docker compose logs app --tail 50
bash ./scripts/start-runtime.sh
```

### Database authentication fails

Check that secrets and the Postgres volume agree. If on a fresh install:

```bash
docker compose down -v
bash ./scripts/bootstrap.sh
```

### User cannot edit

Check role:

```bash
docker compose exec app npm run list-users
```

Promote if needed:

```bash
docker compose exec app npm run set-role -- --email user@example.com --role editor
```

### Import fails with "Schema not ready"

Run bootstrap first:

```bash
bash ./scripts/bootstrap.sh
```

Then retry the import.

### Import fails on unique key conflict

Use `--wipe` to clear existing data:

```bash
bash ./scripts/import-runtime.sh --file exports/export.json --wipe
```

### Overlay numbers look wrong

1. Reseed the dev database after mapping code changes
2. Clear the Next.js cache (`rm -rf .next`) if running in dev
3. Enable the overlay packs on `/overlays`
4. Reload `/overview`

---

## 9. HTTPS / TLS (Production)

The app ships with two nginx configs:

- `nginx.conf` — HTTP only (port 80), for local use or behind a TLS-terminating load balancer
- `nginx-ssl.conf` — HTTPS (ports 80 + 443), Let's Encrypt certs, HSTS, OCSP stapling

### First-time cert issuance

1. Point your domain's DNS A record at the server.
2. Set `DOMAIN` in `.env`:
   ```
   DOMAIN=cmmc.example.com
   ```
3. Issue the cert (port 80 must be open to the internet):
   ```bash
   docker run --rm \
     -v ./certs:/etc/letsencrypt \
     -v ./certs/webroot:/var/www/certbot \
     -p 80:80 \
     certbot/certbot certonly --standalone \
     -d $DOMAIN --agree-tos --no-eff-email -m your@email.com
   ```
4. Start the SSL stack:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
   ```

### Cert renewal

```bash
docker compose -f docker-compose.yml -f docker-compose.ssl.yml run --rm certbot renew
docker compose -f docker-compose.yml -f docker-compose.ssl.yml restart nginx
```

Add this to cron (runs twice daily per Let's Encrypt recommendation):

```
0 3,15 * * * cd /path/to/dashboard && \
  docker compose -f docker-compose.yml -f docker-compose.ssl.yml run --rm certbot renew --quiet && \
  docker compose -f docker-compose.yml -f docker-compose.ssl.yml restart nginx
```

### Self-signed cert (air-gapped / no public DNS)

```bash
mkdir -p certs/live/cmmc
openssl req -x509 -nodes -days 3650 -newkey rsa:4096 \
  -keyout certs/live/cmmc/privkey.pem \
  -out certs/live/cmmc/fullchain.pem \
  -subj "/CN=cmmc.internal"
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

---

## 10. Rule of Thumb

This dashboard is intentionally simple. Use the CLI scripts for infrequent admin tasks. Do not build a management UI unless those tasks become frequent enough to justify the extra surface area.
