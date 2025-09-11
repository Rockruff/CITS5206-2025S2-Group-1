from django.http import Http404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import User, UserAlias
from core.serializers.users import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserAliasCreateSerializer,
    UserAliasDeleteSerializer,
)
from core.permissions import ReadOnlyOrAdmin


class UserViewSet(viewsets.GenericViewSet):
    permission_classes = [ReadOnlyOrAdmin]

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
    def retrieve(self, request):
        user = self.get_object()
        return Response(UserSerializer(user).data)

    # PATCH /users/{id}
    def partial_update(self, request):
        user = self.get_object()
        serializer = UserUpdateSerializer(instance=user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)

    # DELETE /users/{id}
    def destroy(self, request):
        user = self.get_object()
        user.delete()
        return Response()

    # POST /users/{id}/aliases
    # DELETE /users/{id}/aliases
    # Since I want to use the same endpoint for both adding and removing aliases,
    # I will check the request method to determine the action.
    @action(detail=True, methods=["post", "delete"], url_path="aliases")
    def add_alias(self, request):
        user = self.get_object()
        serializer_class = (
            UserAliasCreateSerializer if request.method == "POST" else UserAliasDeleteSerializer
        )
        serializer = serializer_class(instance=user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)
