import logging


class RequestIDFilter(logging.Filter):
    def filter(self, record):
        try:
            from django.http import HttpRequest
            # Try to get request_id from thread local if available
            record.request_id = getattr(record, "request_id", "-")
            # If record has request, pull id
            if hasattr(record, "request") and hasattr(record.request, "request_id"):
                record.request_id = record.request.request_id
        except Exception:
            pass
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return True
