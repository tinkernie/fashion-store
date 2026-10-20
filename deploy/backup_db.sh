#!/usr/bin/env bash
# =====================================================================
# fashion-store Postgres backup (run ON the VPS; invoked by deploy.sh
# and by the daily cron installed in DEPLOYMENT_GUIDE.md)
#   ./backup_db.sh                 dump to /var/backups/fashion-store
#   ./backup_db.sh /some/dir       dump elsewhere
# Keeps the newest KEEP_DAILY dumps; must run as root.
# =====================================================================
set -euo pipefail

BACKUP_DIR="${1:-/var/backups/fashion-store}"
KEEP_DAILY="${KEEP_DAILY:-14}"
PG_BACKUP_USER="${POSTGRES_USER:-store_user}"
PG_BACKUP_DB="${POSTGRES_DB:-webstore}"
PG_HOST="${POSTGRES_HOST:-127.0.0.1}"
PG_PORT="${POSTGRES_PORT:-5432}"

# password comes from the backend .env (POSTGRES_PASSWORD), never inline here
ENV_FILE="${APP_DIR:-/var/www/fashion-store}/backend/.env"
if [ -f "${ENV_FILE}" ] && [ -z "${POSTGRES_PASSWORD:-}" ]; then
  # shellcheck disable=SC1091
  POSTGRES_PASSWORD="$(grep -E '^POSTGRES_PASSWORD=' "${ENV_FILE}" | cut -d= -f2-)"
  export POSTGRES_PASSWORD
fi
[ -n "${POSTGRES_PASSWORD:-}" ] || { echo "POSTGRES_PASSWORD not found" >&2; exit 1; }

mkdir -p "${BACKUP_DIR}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/${PG_BACKUP_DB}-${STAMP}.sql.gz"

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_BACKUP_USER}" \
  --format=custom --no-owner --no-privileges \
  "${PG_BACKUP_DB}" | gzip -c > "${OUT}"

# integrity probe
if [ "$(stat -c %s "${OUT}")" -lt 512 ]; then
  echo "backup suspiciously small: ${OUT}" >&2; exit 1
fi

# rotated retention
ls -1t "${BACKUP_DIR}"/"${PG_BACKUP_DB}"-*.sql.gz 2>/dev/null | tail -n +$((KEEP_DAILY + 1)) | xargs -r rm -f --

echo "backup ok: ${OUT}"
