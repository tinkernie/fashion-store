# config/celery.py — Celery app + Beat schedule (Redis broker)
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("config")
# Reads CELERY_* from django.conf.settings (namespace=CELERY)
# e.g. CELERY_BROKER_URL, CELERY_RESULT_BACKEND, CELERY_TASK_ALWAYS_EAGER
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Beat Schedule — two required periodic tasks (spec):
# 1) expire_reservations_task / release_expired_reservations — every 5 min
# 2) cleanup_expired_tokens — every 24h (deletes tokens >48h old)
# NOTE (ISSUE-02): When CELERY_BEAT_SCHEDULER=DatabaseScheduler, this dict is the
# bootstrap/fallback. At runtime the DB table django_celery_beat_periodictask is
# source of truth. After first migrate, create PeriodicTask rows via admin or data
# migration, or run beat with --scheduler django_celery_beat.schedulers:DatabaseScheduler
# to sync. Keeping the dict ensures eager/CI and non-DB scheduler still work.
app.conf.beat_schedule = {
    "expire-reservations-every-5-minutes": {
        "task": "inventory.tasks.expire_reservations_task",
        "schedule": crontab(minute="*/5"),
    },
    "cleanup-expired-otps-every-24-hours": {
        "task": "authentication.tasks.cleanup_expired_otps",
        "schedule": crontab(hour=2, minute=0),
    },
}
# Note: inventory.tasks.release_expired_reservations is an alias for
# expire_reservations_task (same service call) — available for manual .delay()
# without an extra beat entry to avoid double-execution every 5 min.


