#!/bin/sh
# Restore a dump created by scripts/backup-mongo.sh.
# Usage: sh scripts/restore-mongo.sh ./backups/quotahub-YYYYMMDD
set -eu

SRC="${1:?Usage: sh scripts/restore-mongo.sh ./backups/quotahub-YYYYMMDD}"

if [ ! -d "$SRC/quotahub" ]; then
  echo "Expected a quotahub folder inside $SRC" >&2
  exit 1
fi

docker exec quotahub-mongo rm -rf /tmp/restore_temp
docker cp "$SRC" quotahub-mongo:/tmp/restore_temp
docker exec quotahub-mongo sh -c '
  if [ -n "${MONGO_INITDB_ROOT_USERNAME:-}" ]; then
    mongorestore --db quotahub \
      --username "$MONGO_INITDB_ROOT_USERNAME" \
      --password "$MONGO_INITDB_ROOT_PASSWORD" \
      --authenticationDatabase admin \
      /tmp/restore_temp/quotahub
  else
    mongorestore --db quotahub /tmp/restore_temp/quotahub
  fi
  rm -rf /tmp/restore_temp
'

echo "Restore finished from $SRC"
