#!/usr/bin/env bash
# =====================================================================
# fashion-store deploy / update script (run ON the VPS)
#   ./deploy.sh            full update (backend + frontend + services)
#   ./deploy.sh backend    backend-only update
#   ./deploy.sh frontend   frontend-only update (includes rebuild)
#   ./deploy.sh --dry-run  print the plan without executing anything
#
# Replaces docs/DEPLOYMENT_GUIDE.md section 9 as an executable runbook.
# HTTPS-only: no DPI /chunks sed patch required anymore (TLS encrypts
# asset paths; the historical patch is documented in the guide appendix).
# =====================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/fashion-store}"
SERVICE_USER="${SERVICE_USER:-www-data}"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"
VENV="${BACKEND_DIR}/venv"
BACKUP_SCRIPT="${APP_DIR}/deploy/backup_db.sh"
BACKEND_UNITS=(fashion-backend fashion-celery-worker fashion-celery-beat)
PM2_APP="${PM2_APP:-fashion-frontend}"

DRY_RUN=false
SCOPE="both"
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    backend) SCOPE="backend" ;;
    frontend) SCOPE="frontend" ;;
    both) SCOPE="both" ;;
    *) echo "unknown argument '$arg'" >&2; exit 64 ;;
  esac
done

log() { printf '[deploy] %s\n' "$*"; }
run() {
  if $DRY_RUN; then log "DRY-RUN: $*"; else "$@"; fi
}

require_file() {
  if $DRY_RUN; then return 0; fi
  test -f "$1" || { echo "missing file: $1" >&2; exit 1; }
}

# --- sanity gates -----------------------------------------------------
if $DRY_RUN; then
  log "dry-run mode; no commands are executed"
else
  [ "$(id -u)" -eq 0 ] || { echo "run as root (sudo ./deploy.sh)" >&2; exit 1; }
fi
require_file "${BACKEND_DIR}/manage.py"
require_file "${BACKEND_DIR}/.env"
if [ "$SCOPE" != "backend" ]; then
  require_file "${FRONTEND_DIR}/package.json"
  require_file "${FRONTEND_DIR}/.env.production"
fi

# --- 1. sync code -----------------------------------------------------
run cd "${APP_DIR}"
run git pull --ff-only origin main

# --- 2. database safety net ------------------------------------------
run "${BACKUP_SCRIPT}" || log "backup_db.sh failed/skipped"

if [ "$SCOPE" != "frontend" ]; then
  # --- 3. backend deps + migrations + static -------------------------
  run ${VENV}/bin/pip install --upgrade pip
  run ${VENV}/bin/pip install -r "${BACKEND_DIR}/requirements.txt"
  run bash -c "cd ${BACKEND_DIR} && ${VENV}/bin/python manage.py migrate --noinput"
  run bash -c "cd ${BACKEND_DIR} && ${VENV}/bin/python manage.py collectstatic --noinput"
  # --- 4. restart backend services ----------------------------------
  for unit in "${BACKEND_UNITS[@]}"; do
    run systemctl restart "${unit}"
  done
  # --- 5. internal health probe (pre-public) ------------------------
  if $DRY_RUN; then
    log "DRY-RUN: curl -fsS http://127.0.0.1:8000/api/schema/ -o /dev/null"
  else
    for attempt in 1 2 3 4 5; do
      if curl -fsS http://127.0.0.1:8000/api/schema/ -o /dev/null; then
        log "backend healthy"
        break
      fi
      [ "$attempt" = 5 ] && { echo "backend did not become healthy" >&2; exit 1; }
      sleep 3
    done
  fi
fi

if [ "$SCOPE" != "backend" ]; then
  # --- 6. frontend rebuild ------------------------------------------
  run bash -c "cd ${FRONTEND_DIR} && npm ci"
  run bash -c "cd ${FRONTEND_DIR} && npm run build"
  # --- 7. restart frontend ------------------------------------------
  run pm2 restart "${PM2_APP}" --update-env
fi

# --- 8. permissions ---------------------------------------------------
run chown -R "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}"
run find "${APP_DIR}" -type d -exec chmod 755 {} +
run find "${APP_DIR}" -type f -exec chmod 644 {} +
run chmod +x "${APP_DIR}/deploy/"*.sh
run chmod 640 "${BACKEND_DIR}/.env"
run chown root:"${SERVICE_USER}" "${BACKEND_DIR}/.env"

log "done. verify: systemctl is-active ${BACKEND_UNITS[*]} && pm2 status"
