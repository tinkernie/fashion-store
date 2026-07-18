from rest_framework import permissions


class IsSelf(permissions.BasePermission):
    """Object-level permission to only allow users to edit their own profile."""

    def has_object_permission(self, request, view, obj):
        return obj == request.user
