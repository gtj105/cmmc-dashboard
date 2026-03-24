#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Automated Backup Script
# Runs inside the backup container via cron
# Backs up: PostgreSQL database + evidence files
# Retention: 30 daily + 12 weekly snapshots
# ─────────────────────────────────────────────────────────────────
set -eu

BACKUP_DIR="/backups"
DAILY_DIR="${BACKUP_DIR}/daily"
WEEKLY_DIR="${BACKUP_DIR}/weekly"
EVIDENCE_SRC="/evidence"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# ─── Ensure directories exist ───
mkdir -p "${DAILY_DIR}" "${WEEKLY_DIR}"

# ─── Read database password from Docker secret or env var ───
if [ -f /run/secrets/postgres_password ]; then
  PGPASSWORD=$(cat /run/secrets/postgres_password)
  export PGPASSWORD
elif [ -n "${POSTGRES_PASSWORD:-}" ]; then
  export PGPASSWORD="${POSTGRES_PASSWORD}"
else
  log "ERROR: No database password found (checked /run/secrets/postgres_password and POSTGRES_PASSWORD)"
  exit 1
fi

# ─── 1. Database backup (pg_dump, compressed) ───
DB_FILE="${DAILY_DIR}/db_${TIMESTAMP}.sql.gz"
log "Starting database backup..."
if pg_dump -h db -U cmmc_user -d cmmc_db --no-owner --no-privileges | gzip > "${DB_FILE}"; then
  DB_SIZE=$(du -h "${DB_FILE}" | cut -f1)
  log "Database backup complete: ${DB_FILE} (${DB_SIZE})"
else
  log "ERROR: Database backup failed!"
  rm -f "${DB_FILE}"
  exit 1
fi

# ─── 2. Evidence files backup (tar + gzip) ───
EVIDENCE_FILE="${DAILY_DIR}/evidence_${TIMESTAMP}.tar.gz"
if [ -d "${EVIDENCE_SRC}" ] && [ "$(ls -A "${EVIDENCE_SRC}" 2>/dev/null)" ]; then
  log "Starting evidence backup..."
  if tar czf "${EVIDENCE_FILE}" -C "${EVIDENCE_SRC}" .; then
    EV_SIZE=$(du -h "${EVIDENCE_FILE}" | cut -f1)
    log "Evidence backup complete: ${EVIDENCE_FILE} (${EV_SIZE})"
  else
    log "WARNING: Evidence backup failed, continuing..."
  fi
else
  log "No evidence files found, skipping evidence backup."
fi

# ─── 3. Generate SHA-256 checksums for verification ───
CHECKSUM_FILE="${DAILY_DIR}/checksums_${TIMESTAMP}.sha256"
(
  cd "${DAILY_DIR}"
  sha256sum "db_${TIMESTAMP}.sql.gz" >> "checksums_${TIMESTAMP}.sha256"
  if [ -f "evidence_${TIMESTAMP}.tar.gz" ]; then
    sha256sum "evidence_${TIMESTAMP}.tar.gz" >> "checksums_${TIMESTAMP}.sha256"
  fi
)
log "Checksums written: ${CHECKSUM_FILE}"

# ─── 4. Weekly snapshot (copy Sunday's backup) ───
if [ "${DAY_OF_WEEK}" = "7" ]; then
  log "Sunday — creating weekly snapshot..."
  cp "${DB_FILE}" "${WEEKLY_DIR}/db_weekly_${TIMESTAMP}.sql.gz"
  if [ -f "${EVIDENCE_FILE}" ]; then
    cp "${EVIDENCE_FILE}" "${WEEKLY_DIR}/evidence_weekly_${TIMESTAMP}.tar.gz"
  fi
  cp "${CHECKSUM_FILE}" "${WEEKLY_DIR}/checksums_weekly_${TIMESTAMP}.sha256"
  log "Weekly snapshot created."

  # ─── Prune weekly backups older than 12 weeks (84 days) ───
  find "${WEEKLY_DIR}" -name "*.gz" -mtime +84 -delete 2>/dev/null || true
  find "${WEEKLY_DIR}" -name "*.sha256" -mtime +84 -delete 2>/dev/null || true
  WEEKLY_COUNT=$(find "${WEEKLY_DIR}" -name "db_weekly_*" | wc -l)
  log "Weekly retention: ${WEEKLY_COUNT} snapshots kept (max ~12 weeks)"
fi

# ─── 5. Prune daily backups older than 30 days ───
find "${DAILY_DIR}" -name "*.gz" -mtime +30 -delete 2>/dev/null || true
find "${DAILY_DIR}" -name "*.sha256" -mtime +30 -delete 2>/dev/null || true
DAILY_COUNT=$(find "${DAILY_DIR}" -name "db_*" | wc -l)
log "Daily retention: ${DAILY_COUNT} backups kept (max 30 days)"

# ─── 6. Report disk usage ───
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
log "Total backup storage: ${TOTAL_SIZE}"

log "Backup job completed successfully."
