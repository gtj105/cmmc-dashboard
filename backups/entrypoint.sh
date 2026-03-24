#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# Backup container entrypoint
# Sets up cron schedule and runs in foreground
# ─────────────────────────────────────────────────────────────────
set -eu

BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-0 2 * * *}"  # Default: daily at 2 AM
VERIFY_SCHEDULE="${VERIFY_SCHEDULE:-0 6 * * 0}"  # Default: Sunday at 6 AM

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup service starting..."
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup schedule: ${BACKUP_SCHEDULE}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Verify schedule: ${VERIFY_SCHEDULE}"

# Build environment file for cron (cron doesn't inherit env vars)
ENV_FILE="/tmp/backup.env"
{
  echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-}"
  echo "PGPASSWORD=${POSTGRES_PASSWORD:-}"
} > "${ENV_FILE}"

# Check for Docker secrets as alternative
if [ -f /run/secrets/postgres_password ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Using Docker secret for database password"
fi

# Create cron jobs (backup + weekly verification)
CRON_FILE="/tmp/backup-cron"
{
  echo "${BACKUP_SCHEDULE} . ${ENV_FILE} && /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1"
  echo "${VERIFY_SCHEDULE} . ${ENV_FILE} && /usr/local/bin/verify-backup.sh >> /var/log/backup.log 2>&1"
} > "${CRON_FILE}"

# Install crontab
crontab "${CRON_FILE}"

# Run an initial backup on startup (so you're protected immediately)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running initial backup..."
/usr/local/bin/backup.sh 2>&1 | tee -a /var/log/backup.log || echo "[WARN] Initial backup failed — will retry on schedule"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cron daemon starting."

# Keep container alive with cron in foreground
crond -f -l 6
