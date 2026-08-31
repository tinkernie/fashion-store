# core/pagination.py
from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 20  # M5: reduced from 100 to prevent OFFSET DoS
    # M5: cursor pagination preferred for large tables, but PageNumber kept for compatibility
    # Views using OrderingFilter must define ordering_fields whitelist (see notifications/views.py)
