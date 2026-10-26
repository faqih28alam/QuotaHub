#!/bin/sh
# Dump MongoDB to ./backups/quotahub-YYYYMMDD (or $BACKUP_DIR).
# The dump is written under /tmp in the container, then copied out.
# It is not stored inside the Mongo data volume.
# Set COS_BUCKET to also upload with coscli.
set -eu

STAMP=$(date +%Y%m%d)
DEST_ROOT="${BACKUP_DIR:-./backups}"
DEST="${DEST_ROOT}/quotahub-${STAMP}"

mkdir -p "$DEST_ROOT"
rm -rf "$DEST"

docker exec quotahub-mongo sh -c '
  rm -rf /tmp/quotahub-backup
  if [ -n "${MONGO_INITDB_ROOT_USERNAME:-}" ]; then
    mongodump --db quotahub \
      --username "$MONGO_INITDB_ROOT_USERNAME" \
      --password "$MONGO_INITDB_ROOT_PASSWORD" \
      --authenticationDatabase admin \
      --out /tmp/quotahub-backup
  else
    mongodump --db quotahub --out /tmp/quotahub-backup
  fi
'

docker cp quotahub-mongo:/tmp/quotahub-backup "$DEST"
docker exec quotahub-mongo rm -rf /tmp/quotahub-backup

echo "Backup written to $DEST"

if [ -n "${COS_BUCKET:-}" ]; then
  if ! command -v coscli >/dev/null 2>&1; then
    echo "coscli is not installed, but COS_BUCKET is set." >&2
    exit 1
  fi
  coscli sync "$DEST" "cos://${COS_BUCKET}/quotahub/${STAMP}/"
  echo "Uploaded to cos://${COS_BUCKET}/quotahub/${STAMP}/"
fi
