from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProfileViewSet, AdminUserViewSet

user_me_view = UserProfileViewSet.as_view({
    'get': 'list',
    'post': 'create',
    'patch': 'partial_update',
    'put': 'update',
})
user_me_change_phone = UserProfileViewSet.as_view({'post': 'change_phone'})
user_me_confirm_phone = UserProfileViewSet.as_view({'post': 'confirm_phone'})

admin_router = DefaultRouter()
admin_router.register(r"admin/users", AdminUserViewSet, basename="admin-users")

urlpatterns = [
    path("users/me/", user_me_view, name="user-profile-me"),
    path("users/me/change_phone/", user_me_change_phone, name="user-profile-change-phone"),
    path("users/me/confirm_phone/", user_me_confirm_phone, name="user-profile-confirm-phone"),
    path("", include(admin_router.urls)),
]
