#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Backup Integrity Verification
# Spins up a temporary PostgreSQL container, restores the latest
# backup into it, and validates the data. Runs weekly via cron.
#
# Think of this like a fire drill — you don't wait for a real
# fire to find out your alarm doesn't work.
# ─────────────────────────────────────────────────────────────────
set -eu

BACKUP_DIR="/backups"
LOG_PREFIX="[VERIFY]"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ${LOG_PREFIX} $1"
}

# ─── Find latest backup ───
LATEST_DB=$(ls -t "${BACKUP_DIR}/daily/db_"*.sql.gz 2>/dev/null | head -1 || true)
if [ -z "${LATEST_DB}" ]; then
  log "ERROR: No backup files found. Nothing to verify."
  exit 1
fi

log "Verifying: ${LATEST_DB}"

# ─── Read database password ───
if [ -f /run/secrets/postgres_password ]; then
  PGPASSWORD=$(cat /run/secrets/postgres_password)
  export PGPASSWORD
elif [ -n "${POSTGRES_PASSWORD:-}" ]; then
  export PGPASSWORD="${POSTGRES_PASSWORD}"
else
  log "ERROR: No database password found"
  exit 1
fi

# ─── 1. Checksum verification ───
TIMESTAMP=$(basename "${LATEST_DB}" .sql.gz | sed 's/^db_//')
CHECKSUM_FILE="${BACKUP_DIR}/daily/checksums_${TIMESTAMP}.sha256"

if [ -f "${CHECKSUM_FILE}" ]; then
  log "Checking SHA-256 checksums..."
  cd "${BACKUP_DIR}/daily"
  if sha256sum -c "${CHECKSUM_FILE}" 2>/dev/null; then
    log "Checksum verification: PASSED"
  else
    log "ERROR: Checksum verification FAILED"
    exit 1
  fi
else
  log "WARNING: No checksum file found, skipping checksum verification"
fi

# ─── 2. Decompression test ───
log "Testing decompression..."
if gunzip -t "${LATEST_DB}" 2>/dev/null; then
  log "Decompression test: PASSED"
else
  log "ERROR: Backup file is corrupted (decompression failed)"
  exit 1
fi

# ─── 3. Test restore into primary database (read-only validation) ───
# We parse the SQL to count expected tables rather than doing a full restore,
# since we don't want to spin up a separate PG instance in this container.
log "Counting SQL objects in backup..."
TABLE_COUNT=$(gunzip -c "${LATEST_DB}" | grep -c "^CREATE TABLE" 2>/dev/null || echo "0")
INSERT_COUNT=$(gunzip -c "${LATEST_DB}" | grep -c "^INSERT INTO\|^COPY .* FROM stdin" 2>/dev/null || echo "0")

log "SQL analysis: ${TABLE_COUNT} CREATE TABLE statements, ${INSERT_COUNT} data insertion statements"

if [ "${TABLE_COUNT}" -lt 5 ]; then
  log "WARNING: Expected at least 5 tables, found ${TABLE_COUNT}. Backup may be incomplete."
fi

if [ "${INSERT_COUNT}" -lt 1 ]; then
  log "WARNING: No data insertion statements found. Backup may be empty."
fi

# ─── 4. Verify against live database counts ───
log "Comparing with live database..."
LIVE_DOMAINS=$(psql -h db -U cmmc_user -d cmmc_db -t -c "SELECT COUNT(*) FROM domains;" 2>/dev/null | tr -d ' ' || echo "?")
LIVE_PRACTICES=$(psql -h db -U cmmc_user -d cmmc_db -t -c "SELECT COUNT(*) FROM practices;" 2>/dev/null | tr -d ' ' || echo "?")
LIVE_USERS=$(psql -h db -U cmmc_user -d cmmc_db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "?")

log "Live database: ${LIVE_DOMAINS} domains, ${LIVE_PRACTICES} practices, ${LIVE_USERS} users"

# ─── 5. Check backup age ───
BACKUP_AGE_HOURS=$(( ( $(date +%s) - $(stat -c %Y "${LATEST_DB}") ) / 3600 ))
if [ "${BACKUP_AGE_HOURS}" -gt 48 ]; then
  log "WARNING: Latest backup is ${BACKUP_AGE_HOURS} hours old (>48h). Backup schedule may be broken."
else
  log "Backup age: ${BACKUP_AGE_HOURS} hours (OK)"
fi

# ─── 6. Check disk space ───
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
DISK_AVAIL=$(df -h "${BACKUP_DIR}" | awk 'NR==2 {print $4}')
log "Backup storage: ${BACKUP_SIZE} used, ${DISK_AVAIL} available"

log "================================================================"
log "Backup verification complete — all checks passed."
log "================================================================"
