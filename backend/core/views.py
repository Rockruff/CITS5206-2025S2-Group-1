
from django.db import transaction
from django.db.models import Q
from django.core.paginator import Paginator, EmptyPage
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser

from .models import AppUser, UserAlias, UserGroup, Training, TrainingAssignment
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserRoleUpdateSerializer,
    UserGroupSerializer,
    TrainingSerializer,
)
from .permissions import ReadOnlyOrAdmin, IsAdmin
from .utils import iter_user_rows


# ── Users ───────────────────────────────────────────────────────────────
class UserViewSet(viewsets.ModelViewSet):
    queryset = AppUser.objects.all().order_by("id")
    permission_classes = [ReadOnlyOrAdmin]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action == "set_role":
            return UserRoleUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        qs = AppUser.objects.all()

        # --- filters/search ---
        q_name = self.request.query_params.get("name") or self.request.query_params.get("search")
        if q_name:
            qs = qs.filter(
                Q(name__icontains=q_name)
                | Q(aliases__uwa_id__icontains=q_name)
            ).distinct()

        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role.upper())

        group_id = self.request.query_params.get("group")
        if group_id:
            qs = qs.filter(user_groups__id=group_id)

        # --- ordering ---
        order_by = self.request.query_params.get("order_by", "name")
        # map 'name' to model field
        if order_by.lstrip("-") not in {"id", "name", "role"}:
            order_by = "name"
        qs = qs.order_by(order_by)
        return qs

    # Override list to provide the API’s page structure
    def list(self, request, *args, **kwargs):
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 10))
        qs = self.get_queryset()
        paginator = Paginator(qs, page_size)
        try:
            page_obj = paginator.page(page)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages or 1)

        data = UserSerializer(page_obj.object_list, many=True).data
        return Response({
            "page": page,
            "page_size": page_size,
            "total_pages": paginator.num_pages,
            "total_items": paginator.count,
            "items": data,
        })

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[IsAdmin],
        url_path="batch",
        parser_classes=[JSONParser, MultiPartParser, FormParser],
    )
    def batch(self, request):
        """Batch create users.

        Accepts either:
          - JSON body: { "users": [ { "id": "...", "name": "..." }, ... ] }
          - File upload (CSV/XLSX) under key 'file' – parsed by iter_user_rows()
        Rules:
          - Ignore irrelevant columns
          - Only create new users from id and name
          - If ID exists and name mismatches -> error
        """
        created = 0
        errors = []

        if request.FILES.get("file"):
            f = request.FILES["file"]
            try:
                for idx, row in enumerate(iter_user_rows(f), start=1):
                    payload = {"uwa_id": row.get("uwa_id") or row.get("id"), "name": row.get("name")}
                    ser = UserCreateSerializer(data=payload)
                    if ser.is_valid():
                        user = ser.save()
                        # if alias already existed and name matched, treat as no-op
                        if user and UserAlias.objects.filter(uwa_id=payload["uwa_id"]).exists():
                            created += 1
                    else:
                        errors.append({"row": idx, "msg": ser.errors.get("__all__", [str(ser.errors)])[0]})
            except Exception as e:
                return Response({"detail": f"Import failed: {e}"}, status=400)
        else:
            users = request.data.get("users", [])
            if not isinstance(users, list) or not users:
                return Response({"detail": "Provide users[] or upload file"}, status=400)
            for idx, u in enumerate(users, start=1):
                payload = {"uwa_id": u.get("id"), "name": u.get("name")}
                ser = UserCreateSerializer(data=payload)
                if ser.is_valid():
                    ser.save()
                    created += 1
                else:
                    errors.append({"row": idx, "msg": ser.errors.get("__all__", [str(ser.errors)])[0]})

        status_code = 201 if created and not errors else 200
        return Response({"created": created, "errors": errors}, status=status_code)

    @action(detail=True, methods=["patch"], permission_classes=[IsAdmin], url_path="set-role")
    def set_role(self, request, pk=None):
        user = self.get_object()
        ser = UserRoleUpdateSerializer(user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(UserSerializer(user).data)


# ── Groups ──────────────────────────────────────────────────────────────
class UserGroupViewSet(viewsets.ModelViewSet):
    queryset = UserGroup.objects.all().order_by("name")
    serializer_class = UserGroupSerializer
    permission_classes = [ReadOnlyOrAdmin]


# ── Trainings ───────────────────────────────────────────────────────────
class TrainingViewSet(viewsets.ModelViewSet):
    queryset = Training.objects.all().order_by("name")
    serializer_class = TrainingSerializer
    permission_classes = [ReadOnlyOrAdmin]
