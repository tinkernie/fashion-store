Only deploy on the server when task done, if the SERVER_ON below is true, if not skip deploying on the server.
SERVER_ON : FALSE

# Production Deployment Guide: Fashion Store on Ubuntu

This guide documents the full setup, production configuration, and troubleshooting history for running the Fashion Store project on an Ubuntu Linux server.

- Target server IP: `37.32.31.95`
- Database: SQLite (`backend/db.sqlite3`)
- Frontend: Next.js 16 (React 19) managed by PM2 on port 3000
- Backend: Django 4.2 REST Framework managed by Gunicorn on port 8000
- Cache and message broker: Redis on port 6379
- Background tasks: Celery Worker and Celery Beat
- Web server and reverse proxy: Nginx on ports 80 (HTTP) and 443 (HTTPS)
- Firewall: Ubuntu UFW (ports 22, 80, 443 open)

---

## 1. Server initialization and networking

### Connect to the server
```bash
ssh root@37.32.31.95
```

### Fix DNS resolution
On some datacenter providers, default DNS configurations fail to resolve external domains like `security.ubuntu.com`. If `apt update` hangs or fails with temporary resolution errors, set static nameservers:

```bash
cat << 'EOF' > /etc/resolv.conf
nameserver 8.8.8.8
nameserver 1.1.1.1
EOF
```

If operating within restricted networks where global DNS is blocked, use domestic resolvers such as Shecan:
```bash
cat << 'EOF' > /etc/resolv.conf
nameserver 178.22.122.100
nameserver 185.51.200.2
EOF
```

### Create swap memory
Next.js builds require significant RAM during compilation. To prevent the build process from crashing with out-of-memory errors, configure a 4 GB swap file:

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Install required packages
```bash
# Update repository lists
apt update && apt upgrade -y

# Core development and runtime tools
apt install -y python3 python3-pip python3-venv python3-dev redis-server nginx git curl ufw

# Node.js 20 LTS and PM2 process manager
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

# Start and enable Redis
systemctl enable --now redis-server
redis-cli ping  # Must return PONG
```

---

## 2. Codebase installation

Clone the project into `/var/www/fashion-store`:

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/tinkernie/fashion-store.git
cd /var/www/fashion-store
```

---

## 3. Backend setup

### Virtual environment and dependencies
```bash
cd /var/www/fashion-store/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Configure static files root
Django requires `STATIC_ROOT` defined to run `collectstatic`. Check `backend/config/settings.py` around line 248. If missing, ensure it is set:

```python
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
```

### Create environment file
Create `/var/www/fashion-store/backend/.env`:

```ini
SECRET_KEY=luxe-secret-prod-key-xyz-9876543210-secure
DEBUG=False
ALLOWED_HOSTS=37.32.31.95,localhost,127.0.0.1
DJANGO_SETTINGS_MODULE=config.settings

# Redis cache and Celery broker
REDIS_URL=redis://127.0.0.1:6379/1
CACHE_REDIS_URL=redis://127.0.0.1:6379/1
CELERY_BROKER_URL=redis://127.0.0.1:6379/0
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/0
CELERY_TASK_ALWAYS_EAGER=False

# Frontend URL and CORS
FRONTEND_URL=http://37.32.31.95
CORS_ALLOWED_ORIGINS=http://37.32.31.95,http://localhost:3000
```

### Run database migrations and static files
```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
# Optional: seed catalog data
python seed_data.py
```

---

## 4. Systemd services for the backend

Create systemd unit files to keep the API server, Celery worker, and Celery beat scheduler running continuously with automatic restarts.

### 1. Gunicorn backend (`/etc/systemd/system/fashion-backend.service`)
```ini
[Unit]
Description=Gunicorn daemon for Fashion Store Backend
After=network.target redis-server.service

[Service]
User=root
WorkingDirectory=/var/www/fashion-store/backend
EnvironmentFile=/var/www/fashion-store/backend/.env
ExecStart=/var/www/fashion-store/backend/venv/bin/gunicorn config.wsgi:application \
          --workers 3 \
          --threads 2 \
          --bind 127.0.0.1:8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 2. Celery worker (`/etc/systemd/system/fashion-celery-worker.service`)
Tasks in this project are explicitly routed across multiple queues (`default`, `emails`, `sms`, `inventory`, `media`). The worker must listen to all of them:

```ini
[Unit]
Description=Celery Worker for Fashion Store
After=network.target redis-server.service

[Service]
User=root
WorkingDirectory=/var/www/fashion-store/backend
EnvironmentFile=/var/www/fashion-store/backend/.env
ExecStart=/var/www/fashion-store/backend/venv/bin/celery -A config worker \
          -l info \
          -Q default,emails,sms,inventory,media \
          --concurrency=2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Celery beat (`/etc/systemd/system/fashion-celery-beat.service`)
```ini
[Unit]
Description=Celery Beat Scheduler for Fashion Store
After=network.target redis-server.service

[Service]
User=root
WorkingDirectory=/var/www/fashion-store/backend
EnvironmentFile=/var/www/fashion-store/backend/.env
ExecStart=/var/www/fashion-store/backend/venv/bin/celery -A config beat \
          -l info \
          --scheduler django_celery_beat.schedulers:DatabaseScheduler
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and start backend services
```bash
systemctl daemon-reload
systemctl enable --now fashion-backend fashion-celery-worker fashion-celery-beat

# Verify all return "active"
systemctl is-active fashion-backend fashion-celery-worker fashion-celery-beat
```

---

## 5. Frontend configuration and the build-time IP trap

### The build-time variable pitfall
Next.js compiles all variables prefixed with `NEXT_PUBLIC_` into the static JavaScript bundles during `next build`. If built with an outdated IP address (such as `85.198.49.43`), the client browser will try to send API requests to that old IP, causing `AxiosError: Network Error` and crashing React hydration.

Additionally, Next.js server-side rendering (SSR) in `app/page.tsx` needs to query the API from inside the server. If it tries to reach its own public IP without NAT loopback support, the request can hang. We solve this by setting an internal API URL for SSR.

Create `/var/www/fashion-store/frontend/.env.production`:
```ini
NEXT_PUBLIC_API_URL=http://37.32.31.95
INTERNAL_API_URL=http://127.0.0.1:8000
```

### Build the frontend
```bash
cd /var/www/fashion-store/frontend
npm install
npm run build
```

---

## 6. The DPI firewall inspection trap and the `/chunks/` fix

### The root problem
In Iran, network-level Deep Packet Inspection (DPI) monitors cleartext HTTP traffic on port 80. When an HTTP GET request contains the path segment `/chunks/`, the firewall intercepts the TCP stream and injects:
```http
HTTP/1.1 302 Found
Location: http://10.10.34.35:80
```
This redirects the browser to the national filter landing page (`Peyvandha`).

Because Next.js bundles all CSS stylesheets and JavaScript modules into `/_next/static/chunks/`, browsers attempting to load the site over plain HTTP were blocked from downloading any assets. This caused two distinct failures:
1. When stylesheets were blocked, the site rendered as raw, unstyled HTML.
2. When JavaScript was blocked, client-side hydration failed. Because `app/template.tsx` wraps the page in a Framer Motion `motion.div` starting at `opacity: 0`, failed hydration left the body hidden at zero opacity, showing only the navbar.

### The solution: Rename `chunks` to `assets` across the build output
Both words (`chunks` and `assets`) have exactly 6 characters. The paths `static/chunks` and `static/assets` both have exactly 13 characters. This means replacing the string across build files preserves exact file byte lengths and source-map alignment without breaking syntax.

Apply the patch to the `.next` directory:
```bash
cd /var/www/fashion-store/frontend/.next

# Symlink static/assets to static/chunks so Nginx can resolve either path
ln -sfn chunks static/assets

# Replace all occurrences inside compiled files
find . -type f \( -name '*.js' -o -name '*.json' -o -name '*.html' -o -name '*.css' \) \
  -exec sed -i 's/static\/chunks/static\/assets/g' {} +
```

### File permissions for Nginx
Nginx worker processes run as `www-data`. When files are created by `root`, Nginx gets `403 Forbidden` if permissions do not allow reading and traversing directories:

```bash
chown -R www-data:www-data /var/www/fashion-store
chmod -R 755 /var/www/fashion-store
```

### Start the frontend with PM2
```bash
cd /var/www/fashion-store/frontend
pm2 start npm --name "fashion-frontend" -- start -- -p 3000
pm2 startup
pm2 save
```

---

## 7. Nginx reverse proxy configuration

Create `/etc/nginx/sites-available/fashion-store`:

```nginx
server {
    listen 80 default_server;
    listen 443 ssl default_server;
    server_name 37.32.31.95 _;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;

    # DPI bypass: serve static/assets from the chunks folder
    location /_next/static/assets/ {
        alias /var/www/fashion-store/frontend/.next/static/chunks/;
        expires 365d;
        access_log off;
    }

    # Backward compatibility for any direct files/ references
    location /_next/static/files/ {
        alias /var/www/fashion-store/frontend/.next/static/chunks/;
        expires 365d;
        access_log off;
    }

    # General Next.js static files (fonts, media)
    location /_next/static/ {
        alias /var/www/fashion-store/frontend/.next/static/;
        expires 365d;
        access_log off;
    }

    # Public folder assets
    location /public/ {
        alias /var/www/fashion-store/frontend/public/;
        expires 30d;
        access_log off;
    }

    # Django collected static files
    location /static/ {
        alias /var/www/fashion-store/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # Product media uploads
    location /media_libm/ {
        alias /var/www/fashion-store/backend/media_libm/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # Django API and Admin
    location ~ ^/(api|admin)/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js frontend application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Self-signed SSL certificate setup
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt \
  -subj "/CN=37.32.31.95"
```

### Activate Nginx and test
```bash
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/fashion-store /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## 8. Firewall setup

Enable UFW on Ubuntu:
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status
```

In your cloud provider dashboard (e.g. ArvanCloud), leave the default security group allowing all inbound/outbound traffic. UFW handles access control on the operating system level, protecting internal ports like Redis (`6379`), Gunicorn (`8000`), and Node.js (`3000`).

---

## 9. Routine code updates and maintenance

When updating code in the future, follow this sequence:

```bash
cd /var/www/fashion-store
git pull origin main

# 1. Update backend
cd /var/www/fashion-store/backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
systemctl restart fashion-backend fashion-celery-worker fashion-celery-beat

# 2. Update frontend
cd /var/www/fashion-store/frontend
npm install
npm run build

# Re-apply the DPI assets patch
cd /var/www/fashion-store/frontend/.next
ln -sfn chunks static/assets
find . -type f \( -name '*.js' -o -name '*.json' -o -name '*.html' -o -name '*.css' \) \
  -exec sed -i 's/static\/chunks/static\/assets/g' {} +

# Fix permissions and restart PM2
chown -R www-data:www-data /var/www/fashion-store
chmod -R 755 /var/www/fashion-store
pm2 restart fashion-frontend --update-env
```

---

## 10. Service management cheat sheet

| Action | Command |
| :--- | :--- |
| View backend logs | `journalctl -u fashion-backend -f` |
| View Celery worker logs | `journalctl -u fashion-celery-worker -f` |
| View Celery beat logs | `journalctl -u fashion-celery-beat -f` |
| View frontend logs | `pm2 logs fashion-frontend` |
| Check service statuses | `systemctl is-active fashion-backend fashion-celery-worker fashion-celery-beat redis-server` |
| Check frontend status | `pm2 status` |
| Check Nginx errors | `tail -f /var/log/nginx/error.log` |
| Check Nginx access | `tail -f /var/log/nginx/access.log` |
