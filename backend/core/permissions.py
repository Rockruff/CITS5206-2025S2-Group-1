from rest_framework.permissions import BasePermission
from rest_framework.permissions import IsAuthenticated


class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return True
        if not super().has_permission(request, view):
            return False
        return getattr(request.user, "role", None) == "ADMIN"
