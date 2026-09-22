import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "12345"
DEBUG = True  # overridden in dev/prod
ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
    "testserver",
    "*",
]

# ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sitemaps",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "django_filters",
    "drf_spectacular",
    "corsheaders",
    "rest_framework_simplejwt.token_blacklist",
    "django_celery_beat",
    "mptt",
    # Domain apps
    "common",
    "core",
    "authentication",
    "users",
    "categories",
    "store_collections",
    "products",
    "product_options",
    "variants",
    "inventory",
    "cart",
    "wishlist",
    "orders",
    "payments",
    "cms",
    "notifications",
    "analytics",
    "search",
    "coupons",
    "media_libm",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "core.middleware.AuditLogMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": os.environ["POSTGRES_DB"],
#         "USER": os.environ["POSTGRES_USER"],
#         "PASSWORD": os.environ["POSTGRES_PASSWORD"],
#         "HOST": os.environ["POSTGRES_HOST"],
#         "PORT": os.environ.get("POSTGRES_PORT", "5432"),
#         "OPTIONS": {"options": "-c timezone=UTC"},
#     }
# }

AUTH_USER_MODEL = "common.User"  # custom user prepared for full RBAC
AUTHENTICATION_BACKENDS = ["django.contrib.auth.backends.ModelBackend"]

# JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# DRF
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "core.authentication.ResilientJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardPagination",
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

REST_FRAMEWORK.update({
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "500/hour",
        "user": "2000/hour",
        "auth": "30/minute",
        "payment": "60/minute",
        "payment_callback": "120/minute",
        "analytics": "120/minute",
    },
})



SPECTACULAR_SETTINGS = {
    "TITLE": "My COSLIKE-Shop API",
    "DESCRIPTION": "API Documentation",
    "VERSION": "1.0.0",
}

# --- Redis & Cache (django-redis) ---
# Use Redis for cache (related products, product lists, category tree), sessions, and locks.
# Separate DBs: 0=broker, 1=cache/sessions/locks to avoid Celery eviction.
REDIS_URL = os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/1")
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ.get("CACHE_REDIS_URL", REDIS_URL),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "SOCKET_CONNECT_TIMEOUT": 2,
            "SOCKET_TIMEOUT": 2,
            "IGNORE_EXCEPTIONS": True,  # fall back to DB on Redis down
        },
        "KEY_PREFIX": "luxe",
        "TIMEOUT": 3600,  # 1h default for related/filters
    }
}
# Sessions via cache (faster than DB, shared across workers)
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# Celery — Redis as broker, env-driven for 12-factor config
# CELERY_BROKER_URL / CELERY_RESULT_BACKEND default to local Redis; override via .env in production.
# CELERY_TASK_ALWAYS_EAGER=True runs tasks synchronously (no worker needed) — useful for tests/CI.
# Set CELERY_TASK_ALWAYS_EAGER=False (or unset) when running real workers.
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://127.0.0.1:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://127.0.0.1:6379/0")
CELERY_BROKER_TRANSPORT_OPTIONS = {"visibility_timeout": 3600}  # Redis: ack timeout
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_ENABLE_UTC = True
_CELERY_EAGER = os.environ.get(
    "CELERY_TASK_ALWAYS_EAGER", "True" if DEBUG else "False"
).lower() in (
    "true",
    "1",
    "yes",
)
CELERY_TASK_ALWAYS_EAGER = _CELERY_EAGER
CELERY_TASK_EAGER_PROPAGATES = _CELERY_EAGER
# Beat persistence: DatabaseScheduler reads from django_celery_beat_periodictask table.
# app.conf.beat_schedule in config/celery.py is the bootstrap definition — on first
# migrate it should be synced to DB (via migration or admin). DB is source of truth
# at runtime; keep beat_schedule in code as fallback/bootstrap.
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# --- Hardening (ISSUE-04) ---
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_TIME_LIMIT = 300
CELERY_TASK_SOFT_TIME_LIMIT = 240
CELERY_RESULT_EXPIRES = 3600
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True

# --- Queue routing (ISSUE-16) ---
CELERY_TASK_ROUTES = {
    "authentication.tasks.*": {"queue": "emails"},
    "users.tasks.*": {"queue": "emails"},
    "notifications.tasks.send_notification_email": {"queue": "emails"},
    "notifications.tasks.send_sms": {"queue": "sms"},
    "notifications.tasks.*": {"queue": "emails"},
    "inventory.tasks.*": {"queue": "inventory"},
    "media_libm.tasks.*": {"queue": "media"},
}
CELERY_TASK_DEFAULT_QUEUE = "default"
# Celery worker optimization (non-auth)
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000
CELERY_TASK_COMPRESSION = "gzip"


# Security
SECURE_BROWSER_XSS_FILTER = False
SECURE_CONTENT_TYPE_NOSNIFF = False
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
SECURE_PROXY_SSL_HEADER = None
from corsheaders.defaults import default_headers

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-cart-session-key",
]

CORS_ALLOW_CREDENTIALS = True

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static / Media
STATIC_URL = "static/"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
MEDIA_URL = "/media_libm/"
MEDIA_ROOT = BASE_DIR / "media_libm"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
# Cache headers for product/category APIs (CDN friendly)
CACHE_MIDDLEWARE_SECONDS = 300
# Observability - Sentry (optional, set SENTRY_DSN env to enable)
SENTRY_DSN = os.environ.get("SENTRY_DSN", "")
if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        sentry_sdk.init(dsn=SENTRY_DSN, integrations=[DjangoIntegration()], traces_sample_rate=0.1, send_default_pii=False)
    except Exception:
        pass

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {"format": '{"time":"%(asctime)s","level":"%(levelname)s","name":"%(name)s","msg":%(message)s}', "class": "logging.Formatter"},
        "simple": {"format": "%(levelname)s %(name)s %(message)s"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "simple"},
        "access": {"class": "logging.StreamHandler", "formatter": "simple"},
    },
    "loggers": {
        "audit": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "access": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "django.request": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "celery": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}

# S3 / Object Storage
# DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
# AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
# AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
# AWS_STORAGE_BUCKET_NAME = os.environ["AWS_STORAGE_BUCKET_NAME"]
# AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION_NAME", "us-east-1")

DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "noreply@luxe.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# --- Email (env-switched) ---
# DEBUG=True -> console backend (dev/tests). Production must set EMAIL_BACKEND via env.
# Supported: console | smtp | sendgrid | ses
_EMAIL_BACKEND_CHOICE = os.environ.get("EMAIL_BACKEND", "")
if _EMAIL_BACKEND_CHOICE:
    EMAIL_BACKEND = _EMAIL_BACKEND_CHOICE
else:
    EMAIL_BACKEND = (
        "django.core.mail.backends.console.EmailBackend"
        if DEBUG
        else "django.core.mail.backends.smtp.EmailBackend"
    )
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.sendgrid.net")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True").lower() in ("true", "1", "yes")
EMAIL_USE_SSL = os.environ.get("EMAIL_USE_SSL", "False").lower() in ("true", "1", "yes")
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_TIMEOUT = int(os.environ.get("EMAIL_TIMEOUT", "10"))
# SendGrid / SES API keys (optional, for API-based backends)
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY", "")
AWS_SES_REGION = os.environ.get("AWS_SES_REGION", "us-east-1")

# --- SMS (Kavenegar) ---
KAVENEGAR_API_KEY = os.environ.get("KAVENEGAR_API_KEY", "")
SMS_SENDER = os.environ.get("SMS_SENDER", "10008642")
SMS_ENABLED = bool(KAVENEGAR_API_KEY)  # auto-disable if no key (dev logs only)
# Frontend should be https in production
if not DEBUG and FRONTEND_URL.startswith("http://"):
    import warnings

    warnings.warn("FRONTEND_URL should use https:// in production", RuntimeWarning)

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
