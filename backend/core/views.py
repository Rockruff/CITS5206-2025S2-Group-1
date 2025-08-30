from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

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
        qs = super().get_queryset()
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(full_name__icontains=q)
                | Q(uwa_id__icontains=q)
                | Q(username__icontains=q)
            )
        return qs

    @action(
        detail=False, methods=["post"], permission_classes=[IsAdmin], url_path="batch"
    )
    def batch(self, request):
        f = request.FILES.get("file")
        if not f:
            return Response({"detail": "Upload a file with key 'file'."}, status=400)
        created = skipped = 0
        with transaction.atomic():
            try:
                for row in iter_user_rows(f):
                    name, uwa = row["name"], row["uwa_id"]
                    if AppUser.objects.filter(uwa_id=uwa).exists():
                        skipped += 1
                        continue
                    u = AppUser.objects.create(username=uwa, full_name=name, uwa_id=uwa)
                    u.set_password(AppUser.objects.make_random_password())
                    u.save(update_fields=["password"])
                    UserAlias.objects.get_or_create(
                        alias_uwa_id=uwa, defaults={"user": u}
                    )
                    created += 1
            except Exception as e:
                return Response({"detail": f"Import failed: {e}"}, status=400)
        return Response({"created": created, "skipped": skipped}, status=201)

    @action(
        detail=True,
        methods=["patch"],
        permission_classes=[IsAdmin],
        url_path="set-role",
    )
    def set_role(self, request, pk=None):
        u = self.get_object()
        s = UserRoleUpdateSerializer(u, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(UserSerializer(u).data)

    @action(
        detail=False, methods=["post"], permission_classes=[IsAdmin], url_path="merge"
    )
    def merge(self, request):
        src_uwa = request.data.get("from_uwa_id")
        dst_uwa = request.data.get("to_uwa_id")
        if not (src_uwa and dst_uwa):
            return Response(
                {"detail": "from_uwa_id and to_uwa_id required"}, status=400
            )
        if src_uwa == dst_uwa:
            return Response({"detail": "No-op"}, status=200)

        def resolve(uwa):
            try:
                return (
                    UserAlias.objects.select_related("user").get(alias_uwa_id=uwa).user
                )
            except UserAlias.DoesNotExist:
                return AppUser.objects.get(uwa_id=uwa)

        with transaction.atomic():
            try:
                src = resolve(src_uwa)
                dst = resolve(dst_uwa)
            except AppUser.DoesNotExist:
                return Response({"detail": "One or both users not found"}, status=404)
            if src.id == dst.id:
                return Response({"detail": "Already same"}, status=200)
            UserAlias.objects.filter(user=src).update(user=dst)
            # NOTE: if other tables later FK AppUser, update those FKs here
            src.delete()
        return Response({"detail": "Merged", "survivor": UserSerializer(dst).data})


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
