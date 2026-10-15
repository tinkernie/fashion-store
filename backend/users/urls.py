from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProfileViewSet, AdminUserViewSet, UserAddressViewSet

user_me_view = UserProfileViewSet.as_view({
    'get': 'list',
    'post': 'create',
    'patch': 'partial_update',
    'put': 'update',
})
user_me_change_phone = UserProfileViewSet.as_view({'post': 'change_phone'})
user_me_confirm_phone = UserProfileViewSet.as_view({'post': 'confirm_phone'})
user_addresses_view = UserAddressViewSet.as_view({'get': 'list', 'post': 'create'})
user_address_detail_view = UserAddressViewSet.as_view({'patch': 'partial_update', 'delete': 'destroy'})
user_address_default_view = UserAddressViewSet.as_view({'post': 'set_default'})

admin_router = DefaultRouter()
admin_router.register(r"admin/users", AdminUserViewSet, basename="admin-users")

urlpatterns = [
    path("users/me/", user_me_view, name="user-profile-me"),
    path("users/me/change_phone/", user_me_change_phone, name="user-profile-change-phone"),
    path("users/me/confirm_phone/", user_me_confirm_phone, name="user-profile-confirm-phone"),
    path("users/me/addresses/", user_addresses_view, name="user-addresses"),
    path("users/me/addresses/<uuid:pk>/", user_address_detail_view, name="user-address-detail"),
    path("users/me/addresses/<uuid:pk>/default/", user_address_default_view, name="user-address-default"),
    path("", include(admin_router.urls)),
]
