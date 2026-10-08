#!/usr/bin/env bash
# Nightly PostgreSQL backup with 7-day retention. Run from cron on the host:
#   0 3 * * * /var/www/fashion-store/backend/scripts/backup-postgres.sh
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/fashion-store}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/luxe_db-$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"
docker compose -f "$(dirname "$0")/../docker-compose.yml" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-luxe_user}" "${POSTGRES_DB:-luxe_db}" \
  | gzip > "$FILE"

find "$BACKUP_DIR" -name 'luxe_db-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
echo "backup written: $FILE"

# Restore (test monthly on staging, never blind on prod):
#   gunzip -c /var/backups/fashion-store/luxe_db-<stamp>.sql.gz \
#     | docker compose exec -T postgres psql -U luxe_user luxe_db
