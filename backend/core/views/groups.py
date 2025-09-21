from core.permissions import IsAdmin
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import UserGroup, User
from core.serializers.groups import UserGroupSerializer


class UserGroupViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    """
    API endpoints for creating, updating, editing, deleting user groups,
    and adding users to groups.
    """
    queryset = UserGroup.objects.all().order_by("-timestamp")
    serializer_class = UserGroupSerializer

    # POST /groups/{id}/add_user/
    @action(detail=True, methods=["post"])
    def add_user(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get("user_id")

        try:
            user = User.objects.get(pk=user_id)
            group.users.add(user)
            return Response({"status": "user added"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_400_BAD_REQUEST)
