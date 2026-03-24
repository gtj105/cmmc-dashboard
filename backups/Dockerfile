# ─────────────────────────────────────────────────────────────────
# CMMC Dashboard — Backup Service Container
# Alpine-based with PostgreSQL client + cron
# ─────────────────────────────────────────────────────────────────
FROM alpine:3.19

RUN apk add --no-cache \
    postgresql15-client \
    tzdata \
    && rm -rf /var/cache/apk/*

# Create non-root backup user
RUN addgroup -S backup && adduser -S backup -G backup

# Copy scripts
COPY backup.sh /usr/local/bin/backup.sh
COPY restore.sh /usr/local/bin/restore.sh
COPY verify-backup.sh /usr/local/bin/verify-backup.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh /usr/local/bin/verify-backup.sh /usr/local/bin/entrypoint.sh

# Create backup directories
RUN mkdir -p /backups/daily /backups/weekly && chown -R backup:backup /backups

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
