from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and getattr(request.user, "role", None) == "ADMIN"
        )


class ReadOnlyOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            True
            if request.method in SAFE_METHODS
            else IsAdmin().has_permission(request, view)
        )
