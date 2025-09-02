from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import UserGroup
from .serializers import UserGroupSerializer, UserSerializer

class UserGroupViewSet(viewsets.ModelViewSet):
    queryset = UserGroup.objects.all()
    serializer_class = UserGroupSerializer

    @action(detail=True, methods=["post"])
    def add_user(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get("user_id")
        try:
            user = User.objects.get(id=user_id)
            group.users.add(user)
            return Response({"message": f"User {user.username} added to {group.name}"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
