from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.paginator import Paginator

from core.models import User, UserAlias
from core.serializers.users import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserAliasSerializer,
)
from core.permissions import ReadOnlyOrAdmin, IsAdmin
from core.utils import iter_user_rows


# ── Users ───────────────────────────────────────────────────────────────
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("id")
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
            qs = qs.filter(groups__id=group)

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
                user = User.objects.get(uwa_id=user_id)
            except User.DoesNotExist:
                try:
                    # Finally try by primary key
                    user = User.objects.get(pk=user_id)
                except (User.DoesNotExist, ValueError):
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
