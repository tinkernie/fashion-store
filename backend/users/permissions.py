from rest_framework import permissions


class IsSelf(permissions.BasePermission):
    """Object-level permission to only allow users to edit their own profile."""

    def has_object_permission(self, request, view, obj):
        return obj == request.user


class IsAdminUserOrSuperuser(permissions.BasePermission):
    """Staff OR superuser (superuser flag does not imply is_staff)."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser))
