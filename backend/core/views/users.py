
import csv
import io
import re
from typing import List, Dict

from django.db import transaction
from django.db.models import Q
from django.http import Http404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import User, UserAlias, UserGroup
from core.serializers.users import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserAliasCreateSerializer,
    UserAliasDeleteSerializer,
)
from core.permissions import ReadOnlyOrAdmin

try:
    import openpyxl
    HAS_XLSX = True
except Exception:
    HAS_XLSX = False


class UserViewSet(viewsets.GenericViewSet):
    queryset = User.objects.all().order_by("id")
    permission_classes = [ReadOnlyOrAdmin]

    def get_object(self):
        # GET by user ID (primary) or alias ID path? Spec uses primary in URL.
        pk = self.kwargs.get(self.lookup_field or "pk")
        try:
            return User.objects.get(id=pk)
        except User.DoesNotExist:
            raise Http404

    # POST /users
    def create(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data)

    # GET /users/{id}
    def retrieve(self, request, pk=None):
        user = self.get_object()
        return Response(UserSerializer(user).data)

    # PATCH /users/{id}
    def partial_update(self, request, pk=None):
        user = self.get_object()
        serializer = UserUpdateSerializer(instance=user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)

    # DELETE /users/{id}
    def destroy(self, request, pk=None):
        user = self.get_object()
        user.delete()
        return Response()

    # GET /users  (list with pagination, filters, ordering)
    def list(self, request):
        qs = User.objects.all()

        # Filters
        role = request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)

        name_kw = request.query_params.get("name")
        if name_kw:
            qs = qs.filter(name__icontains=name_kw)

        group_id = request.query_params.get("group")
        if group_id:
            qs = qs.filter(groups__id=group_id)

        # Ordering
        order_by = request.query_params.get("order_by")
        allowed = {"id": "id", "name": "name", "role": "role"}
        if order_by:
            desc = order_by.startswith("-")
            key = order_by[1:] if desc else order_by
            if key not in allowed:
                return Response({ "error": "Invalid order_by field" }, status=400)
            actual = allowed[key]
            if desc:
                actual = f"-{actual}"
            qs = qs.order_by(actual)

        # Pagination
        try:
            page = int(request.query_params.get("page", "1"))
            page_size = int(request.query_params.get("page_size", "10"))
            assert page >= 1 and page_size >= 1
        except Exception:
            return Response({ "error": "Invalid pagination parameters" }, status=400)

        total_items = qs.count()
        total_pages = (total_items + page_size - 1) // page_size
        start = (page - 1) * page_size
        end = start + page_size
        items = [UserSerializer(u).data for u in qs[start:end]]

        return Response({
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "total_items": total_items,
            "items": items
        })

    # POST /users/{id}/aliases and DELETE /users/{id}/aliases
    @action(detail=True, methods=["post", "delete"], url_path="aliases")
    def aliases_action(self, request, pk=None):
        user = self.get_object()
        serializer_class = UserAliasCreateSerializer if request.method.lower() == "post" else UserAliasDeleteSerializer
        serializer = serializer_class(instance=user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)

    # POST /users/batch
    @action(detail=False, methods=["post"], url_path="batch")
    def batch(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({ "error": "Missing file" }, status=400)

        # Determine file type
        name = file.name.lower()
        try:
            rows = []
            if name.endswith(".csv"):
                text = file.read().decode("utf-8-sig")
                reader = csv.DictReader(io.StringIO(text))
                for r in reader:
                    rows.append(r)
            elif name.endswith(".xlsx"):
                if not HAS_XLSX:
                    return Response({ "error": "XLSX support not available on server" }, status=400)
                wb = openpyxl.load_workbook(file, read_only=True)
                ws = wb.active
                headers = [str(c.value).strip() if c.value is not None else "" for c in next(ws.iter_rows(min_row=1, max_row=1))]
                def normalise(h):
                    return re.sub(r"\W+", "", h).lower()
                header_map = { normalise(h): idx for idx, h in enumerate(headers) }
                for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
                    rec = {}
                    for norm, idx in header_map.items():
                        rec[headers[idx]] = row[idx] if idx < len(row) else None
                    rows.append(rec)
            else:
                return Response({ "error": "Unsupported file type (use .csv or .xlsx)" }, status=400)
        except Exception:
            return Response({ "error": "Failed to parse file" }, status=400)

        def pick(d: Dict, keys: List[str]):
            # keys tested case-insensitive and lenient
            norm = { re.sub(r"\W+", "", k or "").lower(): v for k, v in d.items() }
            id_val = None
            name_val = None
            for k in ["uwaid","id","uw a id","uwahid","uw a_id"]:
                if k in norm:
                    id_val = norm[k]
                    break
            for k in ["name","fullname","full_name"]:
                if k in norm:
                    name_val = norm[k]
                    break
            return (str(id_val).strip() if id_val is not None else None,
                    str(name_val).strip() if name_val is not None else None)

        errors = []
        to_create = []
        skipped = 0
        created = 0

        with transaction.atomic():
            for idx, row in enumerate(rows, start=1):
                uid, uname = pick(row, [])
                if not uid or not re.match(r"^\d{8}$", uid):
                    errors.append({ "row": idx, "msg": "Invalid UWA ID" })
                    continue
                if not uname:
                    errors.append({ "row": idx, "msg": "Missing Name" })
                    continue

                try:
                    existing = User.objects.get(id=uid)
                    if existing.name != uname:
                        errors.append({ "row": idx, "msg": f"Name mismatch for UWA ID {uid}" })
                    else:
                        skipped += 1
                except User.DoesNotExist:
                    u = User(id=uid, name=uname)
                    to_create.append(u)

            if to_create:
                User.objects.bulk_create(to_create)
                # create aliases for new users
                alias_objs = [UserAlias(user=u, id=u.id) for u in to_create]
                UserAlias.objects.bulk_create(alias_objs)
                created = len(to_create)

        return Response({ "errors": errors, "created_count": created, "skipped_count": skipped })
