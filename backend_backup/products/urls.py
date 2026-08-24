from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicProductViewSet, AdminProductViewSet

public_router = DefaultRouter()
public_router.register(r"", PublicProductViewSet, basename="public-product")

admin_router = DefaultRouter()
admin_router.register(r"admin/products", AdminProductViewSet, basename="admin-product")

urlpatterns = [
    path("products/", include(public_router.urls)),
    path("", include(admin_router.urls)),
]
