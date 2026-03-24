#!/bin/sh
# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Disaster Recovery Restore Script
# Restores database and optionally evidence files from backup
#
# Usage:
#   ./restore.sh                         # Restore latest daily backup
#   ./restore.sh --file daily/db_2026-03-23_02-00-00.sql.gz
#   ./restore.sh --file daily/db_2026-03-23_02-00-00.sql.gz --evidence daily/evidence_2026-03-23_02-00-00.tar.gz
#   ./restore.sh --verify                # Verify latest backup integrity only (no restore)
#   ./restore.sh --list                  # List available backups
# ─────────────────────────────────────────────────────────────────
set -eu

BACKUP_DIR="/backups"
EVIDENCE_DIR="/evidence"
DB_HOST="${DB_HOST:-db}"
DB_USER="${DB_USER:-cmmc_user}"
DB_NAME="${DB_NAME:-cmmc_db}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

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

# ─── Parse arguments ───
ACTION="restore"
DB_FILE=""
EVIDENCE_FILE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --file)
      DB_FILE="${BACKUP_DIR}/$2"
      shift 2
      ;;
    --evidence)
      EVIDENCE_FILE="${BACKUP_DIR}/$2"
      shift 2
      ;;
    --verify)
      ACTION="verify"
      shift
      ;;
    --list)
      ACTION="list"
      shift
      ;;
    *)
      log "Unknown option: $1"
      exit 1
      ;;
  esac
done

# ─── List available backups ───
if [ "${ACTION}" = "list" ]; then
  echo ""
  echo "=== Daily Backups ==="
  if [ -d "${BACKUP_DIR}/daily" ]; then
    ls -lh "${BACKUP_DIR}/daily/db_"*.sql.gz 2>/dev/null | awk '{print $NF, $5}' || echo "  (none)"
  fi
  echo ""
  echo "=== Weekly Backups ==="
  if [ -d "${BACKUP_DIR}/weekly" ]; then
    ls -lh "${BACKUP_DIR}/weekly/db_weekly_"*.sql.gz 2>/dev/null | awk '{print $NF, $5}' || echo "  (none)"
  fi
  echo ""
  exit 0
fi

# ─── Find latest backup if no file specified ───
if [ -z "${DB_FILE}" ]; then
  DB_FILE=$(ls -t "${BACKUP_DIR}/daily/db_"*.sql.gz 2>/dev/null | head -1 || true)
  if [ -z "${DB_FILE}" ]; then
    log "ERROR: No backup files found in ${BACKUP_DIR}/daily/"
    exit 1
  fi
  log "Using latest backup: ${DB_FILE}"

  # Try to find matching evidence file
  DB_TIMESTAMP=$(echo "${DB_FILE}" | sed 's/.*db_\(.*\)\.sql\.gz/\1/')
  POTENTIAL_EVIDENCE="${BACKUP_DIR}/daily/evidence_${DB_TIMESTAMP}.tar.gz"
  if [ -f "${POTENTIAL_EVIDENCE}" ]; then
    EVIDENCE_FILE="${POTENTIAL_EVIDENCE}"
    log "Found matching evidence backup: ${EVIDENCE_FILE}"
  fi
fi

# ─── Verify backup integrity ───
verify_backup() {
  local db_file="$1"
  local dir
  local base_timestamp

  dir=$(dirname "${db_file}")
  # Extract timestamp from filename (handles both db_TIMESTAMP and db_weekly_TIMESTAMP patterns)
  local basename
  basename=$(basename "${db_file}" .sql.gz)
  base_timestamp=$(echo "${basename}" | sed 's/^db_weekly_//' | sed 's/^db_//')

  # Find matching checksum file
  CHECKSUM_FILE=$(ls "${dir}/checksums"*"${base_timestamp}.sha256" 2>/dev/null | head -1 || true)
  if [ -n "${CHECKSUM_FILE}" ]; then
    log "Verifying checksums from ${CHECKSUM_FILE}..."
    cd "${dir}"
    if sha256sum -c "${CHECKSUM_FILE}"; then
      log "Checksum verification PASSED"
      return 0
    else
      log "ERROR: Checksum verification FAILED"
      return 1
    fi
  else
    log "WARNING: No checksum file found for this backup, skipping verification"
    return 0
  fi
}

if [ "${ACTION}" = "verify" ]; then
  if ! verify_backup "${DB_FILE}"; then
    exit 1
  fi
  # Also test that the dump can be parsed
  log "Testing backup file decompression..."
  if gunzip -t "${DB_FILE}" 2>/dev/null; then
    log "Decompression test PASSED"
  else
    log "ERROR: Backup file is corrupted (decompression failed)"
    exit 1
  fi
  log "Backup verification complete — file is intact."
  exit 0
fi

# ─── Restore database ───
log "================================================================"
log "  CMMC Dashboard — Database Restore"
log "  Source: ${DB_FILE}"
log "================================================================"
echo ""
log "WARNING: This will DROP and recreate all tables in ${DB_NAME}."
log "         All current data will be replaced with backup data."
echo ""

# Verify first
if ! verify_backup "${DB_FILE}"; then
  log "Aborting restore due to checksum failure."
  exit 1
fi

log "Restoring database from backup..."
if gunzip -c "${DB_FILE}" | psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" --single-transaction -q; then
  log "Database restore complete."
else
  log "ERROR: Database restore failed!"
  exit 1
fi

# Verify row counts post-restore
log "Post-restore verification:"
DOMAIN_COUNT=$(psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM domains;" 2>/dev/null | tr -d ' ')
PRACTICE_COUNT=$(psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM practices;" 2>/dev/null | tr -d ' ')
USER_COUNT=$(psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
log "  Domains:   ${DOMAIN_COUNT}"
log "  Practices: ${PRACTICE_COUNT}"
log "  Users:     ${USER_COUNT}"

# ─── Restore evidence files ───
if [ -n "${EVIDENCE_FILE}" ] && [ -f "${EVIDENCE_FILE}" ]; then
  log "Restoring evidence files from ${EVIDENCE_FILE}..."
  mkdir -p "${EVIDENCE_DIR}"
  if tar xzf "${EVIDENCE_FILE}" -C "${EVIDENCE_DIR}"; then
    EV_COUNT=$(find "${EVIDENCE_DIR}" -type f | wc -l)
    log "Evidence restore complete (${EV_COUNT} files)."
  else
    log "WARNING: Evidence restore failed."
  fi
fi

log "================================================================"
log "  Restore completed successfully."
log "================================================================"
