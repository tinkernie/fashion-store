from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProfileViewSet, AdminUserViewSet

router = DefaultRouter()
router.register(r"me", UserProfileViewSet, basename="user-profile")
router.register(r"", AdminUserViewSet, basename="admin-user")

urlpatterns = [
    path("", include(router.urls)),
]
