from django.db import transaction
from django.http import Http404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import User, UserAlias
from core.models import UserGroup
from core.models import Training, TrainingRecord
from core.serializers.users import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserAliasCreateSerializer,
    UserAliasDeleteSerializer,
    UserRowSerializer,
)
from core.permissions import IsAuthenticated, IsAdmin

from core.utils import NAME_COL, UID_COL
from core.utils import parse_csv, parse_xlsx


class UserViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdmin]

    def get_object(self):
        pk = self.kwargs.get("pk")
        try:
            alias = UserAlias.objects.get(id=pk)
        except UserAlias.DoesNotExist:
            raise Http404
        return alias.user

    # POST /users
    def create(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data)

    # GET /users/{id}
    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        return Response(UserSerializer(user).data)

    # GET /users
    def list(self, request):
        qs = User.objects.all()

        # Filters
        role = request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)

        id_kw = request.query_params.get("id")
        if id_kw:
            qs = qs.filter(aliases__id__icontains=id_kw).distinct()

        name_kw = request.query_params.get("name")
        if name_kw:
            keywords = name_kw.split()
            for kw in keywords:
                qs = qs.filter(name__icontains=kw)

        group_id = request.query_params.get("group")
        if group_id:
            qs = qs.filter(groups__id=group_id)

        # Ordering
        order_by = request.query_params.get("order_by", "id")
        if order_by not in {"id", "-id", "name", "-name", "role", "-role"}:
            return Response({"error": "Invalid order_by field"}, status=400)
        qs = qs.order_by(order_by)

        # Pagination
        try:
            page = int(request.query_params.get("page", "1"))
            page_size = int(request.query_params.get("page_size", "10"))
            assert page >= 1 and page_size >= 1
        except Exception:
            return Response({"error": "Invalid pagination parameters"}, status=400)

        total_items = qs.count()
        total_pages = (total_items + page_size - 1) // page_size
        start = (page - 1) * page_size
        end = start + page_size
        items = [UserSerializer(u).data for u in qs[start:end]]

        return Response(
            {
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "total_items": total_items,
                "items": items,
            }
        )

    # PATCH /users/{id}
    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = UserUpdateSerializer(instance=user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)

    # DELETE /users/{id}
    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.id == request.user.id:
            return Response(
                {"error": "Cannot delete current user"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.delete()
        return Response()

    # GET /users/me
    @action(
        detail=False,
        methods=["get"],
        url_path="me",
        permission_classes=[IsAuthenticated],
    )
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    @action(detail=True, methods=["put"], url_path="groups")
    def set_groups(self, request, *args, **kwargs):
        """
        Replace this user's group memberships with the given list of group UUIDs.
        Body: { "groups": ["<uuid>", ...] }
        """
        user = self.get_object()
        group_ids = request.data.get("groups", [])
        if not isinstance(group_ids, list):
            return Response({"error": "groups must be a list of UUIDs"}, status=400)

        # Validate IDs exist; you can soften this if you prefer
        groups = list(UserGroup.objects.filter(id__in=group_ids))
        if len(groups) != len(set(group_ids)):
            return Response({"error": "one or more groups not found"}, status=400)

        # This works because the M2M is defined on UserGroup with related_name="groups"
        user.groups.set(groups)  # replace all memberships at once
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

    # POST /users/{id}/aliases
    # DELETE /users/{id}/aliases
    # Since I want to use the same endpoint for both adding and removing aliases,
    # I will check the request method to determine the action.
    @action(detail=True, methods=["post", "delete"], url_path="aliases")
    def add_alias(self, request, *args, **kwargs):
        user = self.get_object()
        serializer_class = (
            UserAliasCreateSerializer if request.method == "POST" else UserAliasDeleteSerializer
        )
        serializer = serializer_class(instance=user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)

    # POST /users/batch
    @action(detail=False, methods=["post"], url_path="batch")
    def batch(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"error": "Please upload a .csv or .xlsx file"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Determine file type
        name = file.name.lower()
        if name.endswith(".csv"):
            parser = parse_csv
        elif name.endswith(".xlsx"):
            parser = parse_xlsx
        else:
            return Response(
                {"error": "Please upload a .csv or .xlsx file"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cols = [UID_COL, NAME_COL]
            rows = parser(file, cols)
        except Exception:
            return Response(
                {
                    "error": (
                        "Failed to parse uploaded file. "
                        f"File must include all expected columns: {cols}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []

        with transaction.atomic():  # rollback everything if any row fails
            for row_idx, user_id, name in rows:
                alias = UserAlias.objects.filter(id=user_id).first()
                instance = alias.user if alias else None

                serializer = UserRowSerializer(
                    instance=instance,
                    data={"id": user_id, "name": name},
                    partial=True,
                )

                if not serializer.is_valid():
                    transaction.set_rollback(True)

                    # Show first error message
                    message = ""
                    for field, messages in serializer.errors.items():
                        for msg in messages:
                            if field != "non_field_errors":
                                message = f"{field}: {msg}"
                            else:
                                message = msg
                            break

                    return Response(
                        {"error": f"Row {row_idx}: {message}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                user = serializer.save()
                created.append(user)

        return Response(UserSerializer(created, many=True).data)

    # GET /users/{id}/trainings
    @action(detail=True, methods=["get"], url_path="trainings")
    def trainings(self, request, *args, **kwargs):
        """
        List all trainings visible to this user via their groups, plus completion status.
        """
        user = self.get_object()

        # Trainings linked to any group that the user belongs to
        user_group_ids = user.groups.values_list("id", flat=True)
        trainings = (
            Training.objects.filter(groups__id__in=user_group_ids)
            .distinct()
            .prefetch_related("groups")
            .order_by("name")
        )

        results = []

        for training in trainings:
            record = TrainingRecord.objects.filter(user=user, training=training)
            if not record:
                results.append({"training": training.id, "status": "PENDING"})
            else:
                results.append({"training": training.id, "status": record.status})

        return Response(results)
