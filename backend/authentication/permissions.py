from rest_framework.permissions import BasePermission

class IsTokenValid(BasePermission):
    def has_permission(self, request, view):
        # DRF JWT already authenticates; this is a placeholder.
        return request.user and request.user.is_authenticated