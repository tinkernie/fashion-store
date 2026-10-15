from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views_geo import GeoViewSet

router = DefaultRouter()
router.register(r"geo", GeoViewSet, basename="geo")

urlpatterns = [
    path("", include(router.urls)),
]
