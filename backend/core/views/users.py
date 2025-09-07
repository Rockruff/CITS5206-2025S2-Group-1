import csv
import io
from typing import Dict, List, Tuple

from django.contrib.auth import get_user_model
from django.core.paginator import Paginator, EmptyPage
from django.db.models import Q, Value, CharField
from django.db.models.functions import Concat
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from core.serializers.users import UserListItemSerializer

User = get_user_model()

class UsersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        page = int(request.query_params.get("page", 1) or 1)
        page_size = int(request.query_params.get("page_size", 10) or 10)
        page_size = max(1, min(page_size, 100))

        order_by = request.query_params.get("order_by", "name") or "name"
        group = request.query_params.get("group")
        name_kw = (request.query_params.get("name") or "").strip()
        role_filter = (request.query_params.get("role") or "").strip().upper()

        qs = User.objects.all()

        # add name annotation if fields exist
        try:
            qs = qs.annotate(
                name_anno=Concat("first_name", Value(" "), "last_name", output_field=CharField())
            )
        except Exception:
            qs = qs.annotate(name_anno=Value("", output_field=CharField()))

        if name_kw:
            name_q = Q(name_anno__icontains=name_kw)
            for f in ("uwa_id", "email", "username", "id"):
                if hasattr(User, f):
                    name_q |= Q(**{f"{f}__icontains": name_kw})
            qs = qs.filter(name_q)

        if role_filter:
            if hasattr(User, "role"):
                qs = qs.filter(role__iexact=role_filter)
            elif role_filter == "ADMIN":
                qs = qs.filter(Q(is_superuser=True) | Q(is_staff=True))
            elif role_filter == "VIEWER":
                qs = qs.filter(Q(is_superuser=False) & Q(is_staff=False))

        if group and hasattr(User, "groups"):
            qs = qs.filter(groups__id=str(group))

        order_field = order_by.lstrip("-")
        desc = order_by.startswith("-")
        mapping = {"id": "id", "name": "name_anno", "role": "role" if hasattr(User, "role") else "is_staff"}
        db_field = mapping.get(order_field, "name_anno")
        if desc:
            db_field = "-" + db_field
        qs = qs.order_by(db_field)

        paginator = Paginator(qs, page_size)
        try:
            page_obj = paginator.page(page)
        except EmptyPage:
            page = paginator.num_pages or 1
            page_obj = paginator.page(page)

        serializer = UserListItemSerializer(page_obj.object_list, many=True)
        return Response({
            "page": page,
            "page_size": page_size,
            "total_pages": paginator.num_pages,
            "total_items": paginator.count,
            "items": serializer.data,
        })

class UsersBatchCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    REQUIRED_MIN_HEADERS = (
        {"Name", "UWA ID"},
        {"First Name", "Last Name", "Username"},
        {"first_name", "last_name", "uwa_id"},
    )

    def post(self, request):
        created = 0
        errors: List[Dict[str, str]] = []

        if "file" in request.FILES:
            file = request.FILES["file"]
            raw = file.read()
            try:
                text = raw.decode("utf-8-sig")
            except UnicodeDecodeError:
                text = raw.decode("latin-1")
            reader = csv.DictReader(io.StringIO(text))
            headers = set([h.strip() for h in (reader.fieldnames or [])])
            if not any(hdrs.issubset(headers) for hdrs in self.REQUIRED_MIN_HEADERS):
                return Response({"detail": "CSV must include one of: [Name+UWA ID] or [First Name+Last Name+Username] or [first_name+last_name+uwa_id]."}, status=400)
            for idx, row in enumerate(reader, start=2):
                try:
                    user_id, first_name, last_name = self._extract_row(row)
                    if not user_id:
                        errors.append({"row": idx, "msg": "UWA ID is required"})
                        continue
                    existing = self._get_by_identifier(user_id)
                    if existing:
                        if not self._name_matches(existing, first_name, last_name):
                            errors.append({"row": idx, "msg": f"Name mismatch for UWA ID {user_id}"})
                        continue
                    self._create_user(user_id, first_name, last_name)
                    created += 1
                except Exception as e:
                    errors.append({"row": idx, "msg": f"Unexpected error: {e}"})
        else:
            payload = request.data or {}
            items = payload.get("users")
            if not isinstance(items, list) or not items:
                return Response({"detail": "JSON must include 'users': [ ... ]"}, status=400)
            for i, item in enumerate(items, start=1):
                try:
                    user_id = str(item.get("id") or item.get("uwa_id") or "").strip()
                    name = (item.get("name") or "").strip()
                    first, last = self._split_name(name)
                    if not user_id:
                        errors.append({"row": i, "msg": "UWA ID is required"})
                        continue
                    existing = self._get_by_identifier(user_id)
                    if existing:
                        if not self._name_matches(existing, first, last):
                            errors.append({"row": i, "msg": f"Name mismatch for UWA ID {user_id}"})
                        continue
                    self._create_user(user_id, first, last)
                    created += 1
                except Exception as e:
                    errors.append({"row": i, "msg": f"Unexpected error: {e}"})

        status_code = 201 if created > 0 and not errors else (200 if (created > 0 or not errors) else 400)
        return Response({"created": created, "errors": errors}, status=status_code)

    def _extract_row(self, row: Dict[str, str]) -> Tuple[str, str, str]:
        norm = { (k or "").strip().lower(): (v or "").strip() for k, v in row.items() }
        user_id = norm.get("uwa id") or norm.get("user id") or norm.get("userid") or norm.get("username") or norm.get("uwa_id") or norm.get("id") or ""
        name = norm.get("name") or ""
        first = norm.get("first name") or norm.get("first_name") or ""
        last = norm.get("last name") or norm.get("last_name") or ""
        if name and not (first or last):
            first, last = self._split_name(name)
        return user_id, first, last

    @staticmethod
    def _split_name(name: str) -> Tuple[str, str]:
        parts = [p for p in (name or "").split() if p]
        if not parts:
            return "", ""
        if len(parts) == 1:
            return parts[0], ""
        return " ".join(parts[:-1]), parts[-1]

    @staticmethod
    def _name_matches(u, first: str, last: str) -> bool:
        def norm(s): return " ".join((s or "").strip().lower().split())
        have_first = getattr(u, "first_name", "") or getattr(u, "full_name", "") or getattr(u, "name", "")
        have_last = getattr(u, "last_name", "")
        if hasattr(u, "full_name") or hasattr(u, "name") and not hasattr(u, "last_name"):
            target = norm(have_first)
            cand = norm(f"{first} {last}".strip())
            return target == cand if target or cand else True
        return norm(getattr(u, "first_name", "")) == norm(first) and norm(getattr(u, "last_name", "")) == norm(last)

    @staticmethod
    def _get_by_identifier(user_id: str):
        for f in ("uwa_id", "id", "username"):
            try:
                if f == "id":
                    return User.objects.filter(pk=user_id).first() or User.objects.filter(**{f"{f}__iexact": user_id}).first()
                else:
                    found = User.objects.filter(**{f"{f}__iexact": user_id}).first()
                    if found:
                        return found
            except Exception:
                continue
        return None

    @staticmethod
    def _create_user(user_id: str, first: str, last: str):
        kwargs = {}
        if hasattr(User, "uwa_id"):
            kwargs["uwa_id"] = user_id
        elif hasattr(User, "username"):
            kwargs["username"] = user_id
        if hasattr(User, "first_name"):
            kwargs["first_name"] = first
        if hasattr(User, "last_name"):
            kwargs["last_name"] = last
        if hasattr(User, "role") and not getattr(User, "role", None):
            kwargs["role"] = "VIEWER"
        User.objects.create(**kwargs)
