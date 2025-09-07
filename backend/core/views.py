from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.paginator import Paginator

from .models import AppUser, UserAlias, UserGroup, Training, TrainingAssignment
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserAliasSerializer,
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
        if self.action in ["update", "partial_update"]:
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        """Override to support filtering and ordering"""
        qs = super().get_queryset()

        # Name keyword search
        name = self.request.query_params.get("name")
        if name:
            qs = qs.filter(Q(full_name__icontains=name) | Q(uwa_id__icontains=name))

        # Role filter
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)

        # Group filter
        group = self.request.query_params.get("group")
        if group:
            qs = qs.filter(user_groups__id=group)

        # Ordering
        order_by = self.request.query_params.get("order_by", "id")
        if order_by.startswith("-"):
            field = order_by[1:]
            if field in ["id", "name", "role"]:
                order_field = f"-{field}" if field != "name" else "-full_name"
                qs = qs.order_by(order_field)
        else:
            if order_by in ["id", "name", "role"]:
                order_field = order_by if order_by != "name" else "full_name"
                qs = qs.order_by(order_field)

        return qs

    def list(self, request, *args, **kwargs):
        """Custom list with pagination parameters"""
        queryset = self.get_queryset()

        # Get pagination parameters
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 10))

        # Paginate
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        # Serialize data
        serializer = self.get_serializer(page_obj, many=True)

        return Response(
            {
                "page": page,
                "page_size": page_size,
                "total_pages": paginator.num_pages,
                "total_items": paginator.count,
                "items": serializer.data,
            }
        )

    def create(self, request, *args, **kwargs):
        """Create user with proper error handling"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Return same format as GET /users/{user_id}
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

        # Extract first error message for simple error format
        first_error = next(iter(serializer.errors.values()))[0]
        return Response({"error": str(first_error)}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, *args, **kwargs):
        """Get single user by user_id (UWA ID or primary key)"""
        user_id = kwargs.get("pk")

        # Try to find user by UWA ID first, then by primary key
        try:
            # First try to find by UWA ID through alias
            alias = UserAlias.objects.select_related("user").get(alias_uwa_id=user_id)
            user = alias.user
        except UserAlias.DoesNotExist:
            try:
                # Then try by primary UWA ID
                user = AppUser.objects.get(uwa_id=user_id)
            except AppUser.DoesNotExist:
                try:
                    # Finally try by primary key
                    user = AppUser.objects.get(pk=user_id)
                except (AppUser.DoesNotExist, ValueError):
                    return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(user)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Update user profile"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data)

        # Extract first error message for simple error format
        first_error = next(iter(serializer.errors.values()))[0]
        return Response({"error": str(first_error)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """Delete user"""
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"], permission_classes=[IsAdmin])
    def batch(self, request):
        """Batch create users from uploaded file"""
        f = request.FILES.get("file")
        if not f:
            return Response({"error": "Upload a file with key 'file'."}, status=400)

        errors = []
        created = 0

        with transaction.atomic():
            try:
                for row_idx, row in enumerate(iter_user_rows(f)):
                    name, uwa_id = row.get("name"), row.get("uwa_id")

                    if not name or not uwa_id:
                        errors.append({"row": row_idx, "msg": "Missing name or UWA ID"})
                        continue

                    # Check if UWA ID exists
                    existing_alias = UserAlias.objects.filter(
                        alias_uwa_id=uwa_id
                    ).first()
                    if existing_alias:
                        # Check if name matches
                        if existing_alias.user.full_name != name:
                            errors.append(
                                {
                                    "row": row_idx,
                                    "msg": f"Name mismatch for UWA ID {uwa_id}",
                                }
                            )
                        continue

                    # Create new user
                    serializer = UserCreateSerializer(data={"id": uwa_id, "name": name})
                    if serializer.is_valid():
                        serializer.save()
                        created += 1
                    else:
                        errors.append({"row": row_idx, "msg": "Invalid user data"})

            except Exception as e:
                return Response({"error": f"Import failed: {e}"}, status=400)

        if errors:
            return Response({"errors": errors}, status=400)

        return Response({"created": created}, status=201)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def aliases(self, request, pk=None):
        """Add alias to user"""
        user = self.get_object()
        serializer = UserAliasSerializer(data=request.data)

        if serializer.is_valid():
            uwa_id = serializer.validated_data["id"]
            # Check if alias already exists
            if UserAlias.objects.filter(alias_uwa_id=uwa_id).exists():
                return Response({"error": "UWA ID already exists"}, status=400)

            UserAlias.objects.create(alias_uwa_id=uwa_id, user=user)
            return Response(UserSerializer(user).data)

        return Response({"error": "Invalid UWA ID"}, status=400)

    @aliases.mapping.delete
    def remove_alias(self, request, pk=None):
        """Remove alias from user"""
        user = self.get_object()
        uwa_id = request.data.get("id")

        if not uwa_id:
            return Response({"error": "UWA ID is required"}, status=400)

        # Don't allow removing primary UWA ID
        if uwa_id == user.uwa_id:
            return Response({"error": "Cannot remove primary UWA ID"}, status=400)

        try:
            alias = UserAlias.objects.get(alias_uwa_id=uwa_id, user=user)
            alias.delete()
            return Response(UserSerializer(user).data)
        except UserAlias.DoesNotExist:
            return Response({"error": "Alias not found"}, status=404)


# ── User Groups ─────────────────────────────────────────────────────────
class UserGroupViewSet(viewsets.ModelViewSet):
    queryset = UserGroup.objects.all().order_by("id")
    serializer_class = UserGroupSerializer
    permission_classes = [ReadOnlyOrAdmin]

    def get_queryset(self):
        q = self.request.query_params.get("q")
        return (
            super().get_queryset().filter(name__icontains=q)
            if q
            else super().get_queryset()
        )

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated],
        url_path="members",
    )
    def members(self, request, pk=None):
        g = self.get_object()
        q = request.query_params.get("q")
        qs = (
            g.members.filter(Q(full_name__icontains=q) | Q(uwa_id__icontains=q))
            if q
            else g.members.all()
        )
        page = self.paginate_queryset(qs)
        return self.get_paginated_response(UserSerializer(page, many=True).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAdmin],
        url_path="members:add",
    )
    def members_add(self, request, pk=None):
        g = self.get_object()
        ids = request.data.get("user_ids", [])
        if not isinstance(ids, list) or not ids:
            return Response({"detail": "user_ids must be a non-empty list"}, status=400)
        added = []
        for ident in ids:
            user = None
            if isinstance(ident, int):
                user = AppUser.objects.filter(id=ident).first()
            else:
                user = AppUser.objects.filter(uwa_id=ident).first()
                if not user:
                    user = AppUser.objects.create(
                        username=ident, full_name=ident, uwa_id=ident
                    )
                    UserAlias.objects.get_or_create(
                        alias_uwa_id=ident, defaults={"user": user}
                    )
            if user:
                g.members.add(user)
                added.append(user.id)
        return Response({"added": added})

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAdmin],
        url_path="members:remove",
    )
    def members_remove(self, request, pk=None):
        g = self.get_object()
        ids = request.data.get("user_ids", [])
        if not isinstance(ids, list) or not ids:
            return Response({"detail": "user_ids must be a non-empty list"}, status=400)
        removed = []
        for ident in ids:
            user = (
                AppUser.objects.filter(id=ident).first()
                if isinstance(ident, int)
                else AppUser.objects.filter(uwa_id=ident).first()
            )
            if user:
                g.members.remove(user)
                removed.append(user.id)
        return Response({"removed": removed})


# ── Trainings ───────────────────────────────────────────────────────────
class TrainingViewSet(viewsets.ModelViewSet):
    queryset = Training.objects.all().order_by("id")
    serializer_class = TrainingSerializer
    permission_classes = [ReadOnlyOrAdmin]

    def get_queryset(self):
        q = self.request.query_params.get("q")
        return (
            super().get_queryset().filter(name__icontains=q)
            if q
            else super().get_queryset()
        )

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated],
        url_path="groups",
    )
    def groups(self, request, pk=None):
        tr = self.get_object()
        page = self.paginate_queryset(tr.groups.all().order_by("name"))
        return self.get_paginated_response(UserGroupSerializer(page, many=True).data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAdmin],
        url_path="groups:link",
    )
    def groups_link(self, request, pk=None):
        tr = self.get_object()
        ids = request.data.get("group_ids", [])
        if not isinstance(ids, list) or not ids:
            return Response(
                {"detail": "group_ids must be a non-empty list"}, status=400
            )
        linked = []
        for gid in ids:
            grp = UserGroup.objects.filter(id=gid).first()
            if grp:
                TrainingAssignment.objects.get_or_create(training=tr, group=grp)
                linked.append(grp.id)
        return Response({"linked": linked})

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAdmin],
        url_path="groups:unlink",
    )
    def groups_unlink(self, request, pk=None):
        tr = self.get_object()
        ids = request.data.get("group_ids", [])
        if not isinstance(ids, list) or not ids:
            return Response(
                {"detail": "group_ids must be a non-empty list"}, status=400
            )
        for gid in ids:
            TrainingAssignment.objects.filter(training=tr, group_id=gid).delete()
        return Response({"unlinked": ids})
