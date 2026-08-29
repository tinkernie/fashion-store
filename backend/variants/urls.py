from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicVariantViewSet, AdminVariantViewSet

public_router = DefaultRouter()
# Custom route: products/{slug}/variants/ and products/{slug}/variants/{sku}/
public_router.register(
    r"products/(?P<product_slug>[^/.]+)/variants",
    PublicVariantViewSet,
    basename="public-variants",
)

admin_router = DefaultRouter()
admin_router.register(r"admin/variants", AdminVariantViewSet, basename="admin-variants")

urlpatterns = [
    path("", include(public_router.urls)),
    path("", include(admin_router.urls)),
]
