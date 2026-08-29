from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProfileViewSet, AdminUserViewSet

user_router = DefaultRouter()
user_router.register(r"me", UserProfileViewSet, basename="user-profile")
user_router.register(r"", AdminUserViewSet, basename="admin-user")

admin_router = DefaultRouter()
admin_router.register(r"admin/users", AdminUserViewSet, basename="admin-users")

urlpatterns = [
    path("users/", include(user_router.urls)),
    path("", include(admin_router.urls)),
]
