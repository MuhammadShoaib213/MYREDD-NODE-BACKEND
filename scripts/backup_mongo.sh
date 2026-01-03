#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   MONGODB_URI="mongodb://user:pass@host:27017/db" \
#   BACKUP_DIR="/var/backups/myredd" \
#   RCLONE_REMOTE="gdrive" \
#   RCLONE_PATH="myredd-backups" \
#   RCLONE_KEEP_DAYS="14" \
#   ./backup_mongo.sh
#
# Suggested cron (daily at 2am):
#   0 2 * * * root MONGODB_URI="..." BACKUP_DIR="/var/backups/myredd" RCLONE_REMOTE="gdrive" RCLONE_PATH="myredd-backups" /path/to/backup_mongo.sh

if [[ -z "${MONGODB_URI:-}" ]]; then
  echo "MONGODB_URI is required"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/myredd}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"
RCLONE_PATH="${RCLONE_PATH:-myredd-backups}"
RCLONE_KEEP_DAYS="${RCLONE_KEEP_DAYS:-}"
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%F)"
ARCHIVE="${BACKUP_DIR}/mongo_${STAMP}.gz"

mongodump --uri="$MONGODB_URI" --archive="$ARCHIVE" --gzip

# Keep last 7 days
find "$BACKUP_DIR" -type f -name "mongo_*.gz" -mtime +7 -delete

if [[ -n "$RCLONE_REMOTE" ]]; then
  if command -v rclone >/dev/null 2>&1; then
    rclone copy "$BACKUP_DIR" "${RCLONE_REMOTE}:${RCLONE_PATH}"
    if [[ -n "$RCLONE_KEEP_DAYS" ]]; then
      rclone delete "${RCLONE_REMOTE}:${RCLONE_PATH}" --min-age "${RCLONE_KEEP_DAYS}d"
    fi
  else
    echo "rclone not found; skipping remote backup copy"
  fi
fi

echo "Backup created: $ARCHIVE"
