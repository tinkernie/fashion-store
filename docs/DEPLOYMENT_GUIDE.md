# Production Deployment Guide: Fashion Store

> **Status: Active & Deployed.** Bootstrapped and running on `185.226.119.184`.
> All services (backend, worker, beat, frontend via PM2, nginx, postgresql, redis, backups)
> are live and serving traffic. Routine updates are managed via `./deploy.sh`.

- Target server: `185.226.119.184` (Ubuntu)
- Domain: **maviposh.com** (+ `www.`)
- Database: **PostgreSQL** (fresh cluster, no data migration — local data was test-only)
- Backend: Django 4.2 + DRF via Gunicorn (systemd, `www-data`, port 8000 internal)
- Background: Celery worker (queues `default,sms,inventory,media`) + beat (systemd)
- Frontend: Next.js 16 via PM2 (port 3000 internal)
- TLS: Let's Encrypt via certbot (HTTPS-only; HSTS on)
- Firewall: UFW — 22, 80, 443 only
- Config: single source of truth `backend/.env` on the server (chmod 600, never committed,
  never uploaded). The tracked `backend/.env.example` is the structural contract.

---

## 0. Two provider-dependent states (temporary, by design)

| Concern | State until provider approval | Flip line after approval |
|---|---|---|
| SMS (OTP) | `SMS_IR_API_KEY=` **empty** → codes are logged server-side only: `journalctl -u fashion-celery-worker -f | grep -i otp` | set real key + line number + templates (`SMS_IR_TEMPLATE_SIGNUP=875605`, `SMS_IR_TEMPLATE_RESET=120372`) in `.env`, `systemctl restart fashion-celery-worker`. Public OTP **login** is blocked by design — login is phone+password only |
| Zarinpal | `ZARINPAL_SANDBOX=True` (host swap only) | `False` + `ZARINPAL_MERCHANT_ID` set + `systemctl restart fashion-backend`. Zarinpal panel IP restriction allows API calls only from `185.226.119.184` — keep sandbox locally, production on server. Amounts are sent as **IRT (Toman)** integers. Gateway return: `GET /api/payments/callbacks/zarinpal/result/` → 302 to `{FRONTEND_URL}/payment-result?order=&status=&ref=&amount=&gateway=` (dummy gateway deleted; checkout can only go Zarinpal) |
| Paid-order SMS | Templated customer (321934) + owner (551115) SMS fire only on the payment-success transition; checkout sends no SMS/email | tune `ORDER_OWNER_PHONE` + template ids in `.env`, `systemctl restart fashion-celery-worker` |

Both states are approvals held by the store owner; neither is a technical unknown.

## 1. Local-provided assets (already in repo `deploy/`)

- `deploy/deploy.sh` — deploy/update runbook (`--dry-run` supported)
- `deploy/backup_db.sh` — `pg_dump` snapshot + retention (14 daily)
- `deploy/nginx/fashion-store.conf` — server block (HTTP side; certbot injects TLS)
- `deploy/systemd/fashion-backend.service` — Gunicorn (www-data, hardened)
- `deploy/systemd/fashion-celery-worker.service` + `fashion-celery-beat.service`
- `deploy/frontend/env.production.example` — frontend build env template

## 2. One-time server bootstrap (the only heavy session)

### 2.1 DNS + TLS prerequisites (owner does, ~10 min)
1. Point an **A record** for `maviposh.com` (and `www.`) to `185.226.119.184`.
   DNS-only / no CDN proxying — ArvanCloud-style proxying breaks Let's Encrypt HTTP-01.
2. Verify: `dig +short maviposh.com` from the server returns the IP **and** from an external
   resolver (`dig @8.8.8.8 +short maviposh.com`), since Let's Encrypt checks from outside.

### 2.2 Packages
```bash
ssh root@185.226.119.184
apt update && apt upgrade -y
apt install -y python3-venv python3-dev build-essential libpq-dev \
               postgresql postgresql-contrib redis-server nginx git curl ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs
npm install -g pm2

# If DNS resolution to Ubuntu mirrors fails (some datacenter resolvers):
cat <<'EOF' > /etc/resolv.conf
nameserver 178.22.122.100
nameserver 185.51.200.2
EOF
```

### 2.3 Swap (frontend builds on 8 GB VPS)
```bash
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 2.4 PostgreSQL fresh cluster
```bash
systemctl enable --now postgresql
sudo -u postgres psql <<'SQL'
CREATE ROLE store_user LOGIN PASSWORD '<RANDOM_DB_PASSWORD>';
CREATE DATABASE webstore OWNER store_user;
SQL
# Optional belt-and-suspenders:
sudo -u postgres psql -c "ALTER SYSTEM SET password_encryption = 'scram-sha-256';"
mkdir -p /var/backups/fashion-store
```

### 2.5 Redis harden (bind-only + password)
```bash
sudo sed -i 's/^# *bind 127\.0\.0\.1/bind 127.0.0.1 -::1/' /etc/redis/redis.conf
REDIS_PASS="$(openssl rand -hex 24)"
echo "requirepass ${REDIS_PASS}" >> /etc/redis/redis.conf
systemctl restart redis-server
# .env URLs become: redis://:${REDIS_PASS}@127.0.0.1:6379/{0,1}
```

### 2.6 Code + service user
```bash
usermod -a -G www-data www-data 2>/dev/null || true
mkdir -p /var/www && cd /var/www
git clone https://github.com/tinkernie/fashion-store.git   # fresh deploys
cd /var/www/fashion-store/backend
python3 -m venv venv
venv/bin/pip install --upgrade pip && venv/bin/pip install -r requirements.txt
```

### 2.7 Server-side `.env` (create with editor on the server; never upload)
```bash
cat > /var/www/fashion-store/backend/.env <<'EOF'
DJANGO_SETTINGS_MODULE=config.settings
SECRET_KEY=<openssl rand -base64 60>
DEBUG=False
ALLOWED_HOSTS=maviposh.com,www.maviposh.com
STATIC_ROOT=/var/www/fashion-store/backend/staticfiles

DB_ENGINE=postgres
POSTGRES_DB=webstore
POSTGRES_USER=store_user
POSTGRES_PASSWORD=<RANDOM_DB_PASSWORD>
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_CONN_MAX_AGE=60

REDIS_URL=redis://:<REDIS_PASS>@127.0.0.1:6379/1
CACHE_REDIS_URL=redis://:<REDIS_PASS>@127.0.0.1:6379/1
CELERY_BROKER_URL=redis://:<REDIS_PASS>@127.0.0.1:6379/0
CELERY_RESULT_BACKEND=redis://:<REDIS_PASS>@127.0.0.1:6379/0
CELERY_TASK_ALWAYS_EAGER=False

SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_PROXY_SSL_HEADER=1
CSRF_TRUSTED_ORIGINS=https://maviposh.com,https://www.maviposh.com

FRONTEND_URL=https://maviposh.com
CORS_ALLOWED_ORIGINS=https://maviposh.com

SMS_IR_API_KEY=
SMS_IR_LINE_NUMBER=300021152280
SMS_IR_TEMPLATE_SIGNUP=875605
SMS_IR_TEMPLATE_RESET=120372
SMS_IR_OTP_TEMPLATE_ID=919633
SMS_IR_TEMPLATE_ORDER_CONFIRMED=321934
SMS_IR_TEMPLATE_OWNER_NEW_ORDER=551115
ORDER_OWNER_PHONE=09199547931
# Zarinpal PG v4 (merchant id from Zarinpal panel; never commit the real value)
ZARINPAL_MERCHANT_ID=<SET-FROM-PANEL>
ZARINPAL_SANDBOX=False
ZARINPAL_CURRENCY=IRT
ZARINPAL_RETURN_PATH=/payment-result
EOF
chmod 600 /var/www/fashion-store/backend/.env
chown root:root /var/www/fashion-store/backend/.env
```
(Leave mock lines' values exactly as §0 — flip lines double as approval-day checklist.)

### 2.8 Django migration + superuser (production cluster)
```bash
cd /var/www/fashion-store/backend
venv/bin/python manage.py check --deploy
venv/bin/python manage.py migrate --noinput
venv/bin/python manage.py collectstatic --noinput
venv/bin/python manage.py createsuperuser
deploy/backup_db.sh   # baseline snapshot on day 0
```

### 2.9 Nginx + units + certbot
```bash
cp deploy/nginx/fashion-store.conf /etc/nginx/sites-available/fashion-store
ln -sf /etc/nginx/sites-available/fashion-store /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

mkdir -p /var/www/certbot
apt install -y certbot python3-certbot-nginx
certbot --nginx -d maviposh.com -d www.maviposh.com --redirect --agree-tos -m <owner_email>

cp deploy/systemd/*.service /etc/systemd/system/
systemctl daemon-reload
# enabled but only `start`ed on trigger day:
systemctl enable fashion-backend fashion-celery-worker fashion-celery-beat

ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable
```

### 2.10 Frontend
```bash
cd /var/www/fashion-store/frontend
cp ../deploy/frontend/env.production.example .env.production
cp ../deploy/frontend/env.production.example .env.production
npm ci && npm run build
pm2 start npm --name fashion-frontend -- start -- -p 3000
pm2 save
```

### 2.11 Cron (daily backups)
```bash
( crontab -l 2>/dev/null; echo '30 3 * * * /var/www/fashion-store/deploy/backup_db.sh >/dev/null 2>&1' ) | crontab -
```

## 3. Trigger day (the flip)
```bash
cd /var/www/fashion-store
git pull origin main
./deploy.sh --dry-run      # print-only sanity pass
./deploy.sh                # backend + services + frontend + probes
systemctl is-active fashion-backend fashion-celery-worker fashion-celery-beat
pm2 status && curl -I https://maviposh.com
```

## 4. Routine updates afterwards (same as trigger, minus bootstrap)
```bash
cd /var/www/fashion-store && git pull origin main && ./deploy.sh
```

## 5. Rollback / restore
- Backend code: `git log --oneline -5` → `git checkout <good_sha>` → `./deploy.sh backend`
- Database: latest snapshot in `/var/backups/fashion-store`;
  `gunzip -c <file>.sql.gz ... restore via pg_restore` — verify with the owner before a live restore
- Frontend: `pm2 restart fashion-frontend --update-env` after a bad build → check `pm2 logs`

## Appendix A. Engine-room facts (debugging value only)

1. **The DPI `/chunks` trap is dead, by TLS.** In HTTP-only days, the Iranian DPI middleware matched the
   cleartext path `/chunks/` and injected `HTTP/1.1 302 Location: http://10.10.34.35:80` (Peyvandha), bricking
   web assets while leaving the page skeleton visible. cached the workarounds were: serve `static/assets` from
   `static/chunks` via alias, and `sed s|static/chunks|static/assets|` over the entire bundle —
   same byte lengths so source maps stayed aligned. With Let's Encrypt HTTPS, assets are transferred encrypted and
   the interceptor can no longer see the path, so these mutations were removed from `deploy.sh`.
2. **The build-time variable trap:** Next.js bakes `NEXT_PUBLIC_*` values at `next build`. If you build with a stale
   domain/IP, browsers will request the API from that stale host (AxiosError: Network Error + failed hydration).
   `frontend/.env.production` made on the server before building keeps this correct (and `deploy.sh` rebuilds on every
   update).
3. **SSR needs the internal URL** (`INTERNAL_API_URL=http://127.0.0.1:8000`) because the frontend server fetching
   its own public IP may not get NAT loopback support on some providers.
4. Whitenoise's manifest storage requires `collectstatic` before subsequent deploys, and settings.py now
   supports `STATIC_ROOT` env; if whitenoise's manifest is missing, requests 500 without a trace at startup,
   so treat collectstatic as a build-step, not a nice-to-have.
5. JWT tokens for sessions and cache sit on Redis DB1; beat scheduler reads messages from DB0; each app uses DB
   separation to avoid cache/spam interference.
6. `_env` bootstrapping note: `backend/config/settings.py` reads `.env` with precedence
   `real env > .env file` (via `os.environ.setdefault`). Systemd `EnvironmentFile=` and manual `export`
   always outrank the on-disk file.
