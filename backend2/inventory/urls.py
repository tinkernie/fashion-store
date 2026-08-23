from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminInventoryViewSet

router = DefaultRouter()
router.register(r"admin/inventory", AdminInventoryViewSet, basename="admin-inventory")

urlpatterns = [
    path("", include(router.urls)),
]
