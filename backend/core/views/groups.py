from core.permissions import IsAdmin
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import UserGroup, User
from core.serializers.groups import (
    UserGroupSerializer,
    GroupBatchManageUsersSerializer,
    GroupBatchManageTrainingsSerializer,
)


class UserGroupViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    queryset = UserGroup.objects.all().order_by("-timestamp")
    serializer_class = UserGroupSerializer

    # PATCH /groups/batch/users
    @action(detail=False, methods=["patch"], url_path="batch/users")
    def batch_manage_users(self, request):
        serializer = GroupBatchManageUsersSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            for item in serializer.validated_data:
                group = item["group"]
                group.users.add(*item["add"])
                group.users.remove(*item["remove"])

        return Response()

    # PATCH /groups/batch/trainings
    @action(detail=False, methods=["patch"], url_path="batch/trainings")
    def batch_manage_trainings(self, request):
        serializer = GroupBatchManageTrainingsSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            for item in serializer.validated_data:
                group = item["group"]
                group.trainings.add(*item["add"])
                group.trainings.remove(*item["remove"])

        return Response()
