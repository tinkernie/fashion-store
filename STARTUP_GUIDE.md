# Fashion Store — System Startup Guide

Comprehensive guide for launching the full-stack Fashion Store platform locally using PostgreSQL, Redis, Django REST Framework, Celery, and Next.js.

---

## 1. System Architecture Overview

The system consists of 5 coordinated layers:

| Layer | Technology | Default Port | Responsibility |
| :--- | :--- | :--- | :--- |
| **Relational Database** | PostgreSQL 16 (Docker) | `5432` | Primary relational storage (`luxe_db`) |
| **Cache & Queue Broker**| Redis 7 (Docker) | `6379` | Cache (`db 1`), Celery message broker (`db 0`) |
| **Backend API** | Django 4.2 / DRF | `8000` | REST API, Business logic, ORM, Auth |
| **Background Tasks** | Celery Worker & Beat | Background | Async SMS dispatch, cart timeouts, inventory releases |
| **Frontend Web App** | Next.js 16 (React 19) | `3000` | MAVi storefront, SSR/SSG catalog, customer dashboard |

---

## 2. Prerequisites

1. **Docker Desktop for Windows**: Installed and running with WSL2 backend.
2. **Python Environment**: Python 3.12+ (dedicated virtual environment located in `backend\.venv`).
3. **Node.js**: Node 18+ and `npm` installed.

---

## 3. Environment Variables Configuration

Ensure [`backend/.env`](backend/.env) is configured for PostgreSQL and Redis:

```env
SECRET_KEY=local-dev-secret-key-fashion-store-mavi-posh-2026
DEBUG=True

# Database Configuration (PostgreSQL)
DB_ENGINE=postgres
POSTGRES_DB=luxe_db
POSTGRES_USER=luxe_user
POSTGRES_PASSWORD=change-me
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_CONN_MAX_AGE=60

# Network & CORS
ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
FRONTEND_URL=http://localhost:3000

# Redis & Celery
REDIS_URL=redis://127.0.0.1:6379/1
CACHE_REDIS_URL=redis://127.0.0.1:6379/1
CELERY_BROKER_URL=redis://127.0.0.1:6379/0
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/0

# Dev flags
ALLOW_DUMMY_GATEWAY=True
```

> **Offline Fallback Note**: To run without Docker/PostgreSQL for quick offline edits, set `DB_ENGINE=sqlite`.

---

## 4. Startup Sequence (Step-by-Step)

### Step 1: Start Infrastructure (Docker Containers)
Open PowerShell and start the PostgreSQL and Redis containers:

```powershell
cd backend
docker compose up -d postgres redis
```

Verify that both containers are running and healthy:
```powershell
docker compose ps
```

---

### Step 2: Database Initialization (First Time or After Schema Changes)
Activate the virtual environment and apply migrations:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1

# Apply all schema migrations to PostgreSQL
python manage.py migrate

# Initialize notification templates
python manage.py init_notification_templates

# Seed demo catalog data (categories, products, variants, collections)
python seed_data.py

# Create an administrator account (Username must be an Iranian phone number format, e.g. 09120000000)
python manage.py createsuperuser
```

---

### Step 3: Run Backend Services (3 Dedicated Terminals)

#### Terminal 1 — Django REST API
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 8000
```
*API Base URL*: `http://127.0.0.1:8000/api/`  
*Admin Panel*: `http://127.0.0.1:8000/admin/`  
*Swagger Documentation*: `http://127.0.0.1:8000/api/schema/swagger-ui/`

#### Terminal 2 — Celery Worker
> **Windows Requirement**: Celery requires `-P solo` pool execution on Windows to avoid process fork issues.
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
celery -A config worker -l info -P solo -Q default,sms,inventory,media
```

#### Terminal 3 — Celery Beat Scheduler
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

---

### Step 4: Run Frontend Storefront (Terminal 4)

```powershell
cd frontend
npm run dev
```
*Storefront URL*: `http://localhost:3000`

---

## 5. Verification & Smoke Test Checklist

Once all services are running, verify system health:

1. **PostgreSQL Connectivity**:
   ```powershell
   docker exec -it backend-postgres-1 pg_isready -U luxe_user
   ```
2. **API Catalog Endpoint**:
   ```powershell
   curl http://127.0.0.1:8000/api/products/
   ```
   *Expected response*: HTTP 200 with JSON product listing.
3. **Frontend Landing Page**:
   Open `http://localhost:3000` in your browser. Verify MAVi Mediterranean Azure branding, hero banners, and Persian typography load without console errors.
4. **Authentication Flow**:
   Request an OTP for `09120000000`:
   ```powershell
   curl -X POST http://127.0.0.1:8000/api/auth/otp/request/ -H "Content-Type: application/json" -d '{\"phone_number\":\"09120000000\"}'
   ```
   *Note*: When `SMS_IR_API_KEY` is unset, SMS dispatch is mocked to the backend console and database (`auth_otp_code` table).

---

## 6. Orderly Shutdown Sequence

To avoid orphaned workers or corrupted lock files, terminate in reverse order:

1. **Stop Celery Beat**: `Ctrl + C` in Terminal 3.
2. **Stop Celery Worker**: `Ctrl + C` in Terminal 2.
3. **Stop Django API**: `Ctrl + C` in Terminal 1.
4. **Stop Next.js**: `Ctrl + C` in Terminal 4.
5. **Stop Docker Infrastructure**:
   ```powershell
   cd backend
   docker compose stop postgres redis
   ```

To remove containers while keeping database volumes intact:
```powershell
docker compose down
```

To wipe all database volumes and start completely fresh:
```powershell
docker compose down -v
```

---

## 7. Troubleshooting & FAQ

### 1. `docker: The term 'docker' is not recognized`
If newly installed, the current shell session may not have refreshed `PATH`. Update `$env:Path` or restart the terminal:
```powershell
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
```

### 2. `open //./pipe/docker_engine: The system cannot find the file specified`
Docker Desktop is installed but the background engine is not running. Launch Docker Desktop from Start Menu or:
```powershell
Start-Process "C:\Users\Mahdi\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
```

### 3. Celery worker crashes on Windows with `ValueError: not enough values to unpack`
Always specify `-P solo` when launching Celery worker on Windows:
```powershell
celery -A config worker -l info -P solo -Q default,sms,inventory,media
```

### 4. Database port conflict on `5432`
If a local PostgreSQL service is already running on the host, either stop the local service (`Stop-Service postgresql*`) or map to a different host port in [`backend/.env`](backend/.env) (e.g. `POSTGRES_PORT=5433`).
