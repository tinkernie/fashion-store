from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicProductOptionViewSet, AdminProductOptionViewSet

# Public: nested under products/{slug}/options/
public_router = DefaultRouter()
public_router.register(
    r"products/(?P<product_slug>[^/.]+)/options",
    PublicProductOptionViewSet,
    basename="public-product-options",
)

# Admin: under admin/products/{product_id}/options/
admin_router = DefaultRouter()
admin_router.register(
    r"admin/products/(?P<product_id>[^/.]+)/options",
    AdminProductOptionViewSet,
    basename="admin-product-options",
)

urlpatterns = [
    path("", include(public_router.urls)),
    path("", include(admin_router.urls)),
]
