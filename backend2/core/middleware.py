# core/middleware.py
import logging

logger = logging.getLogger("audit")


class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if hasattr(request, "user") and request.user.is_authenticated:
            logger.info(
                "user=%s method=%s path=%s status=%d",
                request.user.email,
                request.method,
                request.path,
                response.status_code,
            )
        return response
