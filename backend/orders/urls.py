from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserOrderViewSet, AdminOrderViewSet
from .pos_views import PosViewSet

user_router = DefaultRouter()
user_router.register(r"orders", UserOrderViewSet, basename="user-orders")

admin_router = DefaultRouter()
admin_router.register(r"admin/orders", AdminOrderViewSet, basename="admin-orders")

pos_router = DefaultRouter()
pos_router.register(r"admin/pos", PosViewSet, basename="admin-pos")

urlpatterns = [
    # Exact /invoice.pdf (no trailing slash) — the router's action form
    # (/invoice.pdf/) is also registered below.
    path(
        "admin/orders/<str:pk>/invoice.pdf",
        AdminOrderViewSet.as_view({"get": "invoice_pdf"}),
        name="admin-order-invoice-pdf",
    ),
    path("", include(user_router.urls)),
    path("", include(admin_router.urls)),
    path("", include(pos_router.urls)),
]
