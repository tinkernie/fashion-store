from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProfileViewSet, AdminUserViewSet

# explicit mapping for /me/ -> supports GET/PATCH/PUT/POST on detail=False (fixes 405)
user_me_view = UserProfileViewSet.as_view({
    'get': 'list',        # GET /api/users/me/
    'post': 'create',     # POST /api/users/me/ (legacy)
    'patch': 'partial_update',  # PATCH /api/users/me/ <- fix
    'put': 'update',      # PUT /api/users/me/
})
user_me_change_email = UserProfileViewSet.as_view({'post': 'change_email'})
user_me_confirm_email = UserProfileViewSet.as_view({'post': 'confirm_email'})

admin_router = DefaultRouter()
admin_router.register(r"admin/users", AdminUserViewSet, basename="admin-users")

urlpatterns = [
    path("users/me/", user_me_view, name="user-profile-me"),
    path("users/me/change_email/", user_me_change_email, name="user-profile-change-email"),
    path("users/me/confirm_email/", user_me_confirm_email, name="user-profile-confirm-email"),
    path("", include(admin_router.urls)),
]
