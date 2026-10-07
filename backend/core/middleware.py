# core/middleware.py
import logging
import uuid

logger = logging.getLogger("audit")
access_logger = logging.getLogger("access")


class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.request_id = request_id
        response = self.get_response(request)
        response["X-Request-ID"] = request_id
        # Access log JSON (safe, no PII email in access log for GDPR)
        try:
            user_id = str(request.user.id) if hasattr(request, "user") and request.user.is_authenticated else "-"
        except Exception:
            user_id = "-"
        access_logger.info(
            '{"request_id":"%s","user_id":"%s","method":"%s","path":"%s","status":%d,"ip":"%s"}',
            request_id,
            user_id,
            request.method,
            request.path,
            response.status_code,
            request.META.get("REMOTE_ADDR", "-"),
        )
        if hasattr(request, "user") and request.user.is_authenticated:
            try:
                logger.info(
                    "request_id=%s user=%s method=%s path=%s status=%d",
                    request_id,
                    getattr(request.user, "phone_number", str(request.user.id)),
                    request.method,
                    request.path,
                    response.status_code,
                )
            except Exception:
                pass
        return response


class RequestIDMiddleware:
    """Alias for AuditLogMiddleware request_id propagation (kept for explicit ordering)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.request_id = request_id
        response = self.get_response(request)
        response["X-Request-ID"] = request_id
        return response
