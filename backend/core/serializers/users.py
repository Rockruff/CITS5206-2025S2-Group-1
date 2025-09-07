from typing import List
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserListItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    role = serializers.CharField()
    aliases = serializers.ListField(child=serializers.CharField(), default=list)
    groups = serializers.ListField(child=serializers.CharField(), default=list)

    @staticmethod
    def _coalesce_id(u) -> str:
        for attr in ("uwa_id", "id", "username"):
            if hasattr(u, attr) and getattr(u, attr):
                return str(getattr(u, attr))
        return str(u.pk)

    @staticmethod
    def _full_name(u) -> str:
        first = getattr(u, "first_name", "") or ""
        last = getattr(u, "last_name", "") or ""
        full = f"{first} {last}".strip()
        if full:
            return full
        for attr in ("full_name", "name"):
            if hasattr(u, attr) and getattr(u, attr):
                return str(getattr(u, attr)).strip()
        return UserListItemSerializer._coalesce_id(u)

    @staticmethod
    def _role(u) -> str:
        if hasattr(u, "role") and getattr(u, "role"):
            return str(getattr(u, "role")).upper()
        if getattr(u, "is_superuser", False) or getattr(u, "is_staff", False):
            return "ADMIN"
        if hasattr(u, "is_admin"):
            return "ADMIN" if getattr(u, "is_admin") else "VIEWER"
        return "VIEWER"

    @staticmethod
    def _aliases(u) -> List[str]:
        if hasattr(u, "aliases"):
            try:
                return [str(getattr(a, "alias", a)) for a in u.aliases.all()]
            except Exception:
                try:
                    vals = getattr(u, "aliases")
                    return [str(v) for v in (vals or [])]
                except Exception:
                    pass
        return [UserListItemSerializer._coalesce_id(u)]

    @staticmethod
    def _group_ids(u) -> List[str]:
        out: List[str] = []
        if hasattr(u, "groups"):
            try:
                out = [str(getattr(g, "id", getattr(g, "pk"))) for g in u.groups.all()]
            except Exception:
                pass
        return out

    def to_representation(self, u):
        return {
            "id": self._coalesce_id(u),
            "name": self._full_name(u),
            "role": self._role(u),
            "aliases": self._aliases(u),
            "groups": self._group_ids(u),
        }
