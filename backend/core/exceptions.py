# core/exceptions.py
from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            "error": {
                "code": response.status_code,
                "message": response.data.get("detail", str(exc)),
                "errors": response.data if isinstance(response.data, dict) else None,
            }
        }
    return response