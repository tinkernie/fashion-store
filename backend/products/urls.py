from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PublicProductViewSet,
    AdminProductViewSet,
    PublicReviewViewSet,
    AdminReviewViewSet,
)

public_router = DefaultRouter()
public_router.register(r"", PublicProductViewSet, basename="public-product")

public_review_router = DefaultRouter()
public_review_router.register(
    r"products/(?P<product_slug>[-\w]+)/reviews",
    PublicReviewViewSet,
    basename="public-reviews",
)

admin_router = DefaultRouter()
admin_router.register(r"admin/products", AdminProductViewSet, basename="admin-product")
admin_router.register(r"admin/reviews", AdminReviewViewSet, basename="admin-reviews")

urlpatterns = [
    path("", include(public_review_router.urls)),
    path("products/", include(public_router.urls)),
    path("", include(admin_router.urls)),
]
