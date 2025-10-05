from core.permissions import IsAdmin
from django.db import transaction
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import UserGroup, User, Training
from core.serializers.groups import (
    UserGroupSerializer,
    GroupBatchManageUsersSerializer,
    GroupBatchManageTrainingsSerializer,
)


# Lightweight training row serializer for the list endpoint
class TrainingRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Training
        fields = ["id", "name"]  # add more fields if needed


class UserGroupViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    queryset = UserGroup.objects.all()
    serializer_class = UserGroupSerializer

    # GET /groups/{id}/trainings/
    @action(detail=True, methods=["get"])
    def trainings(self, request, pk=None):
        group = self.get_object()
        # If your M2M reverse name differs, change to group.training_set.all()
        qs = group.trainings.all()
        data = TrainingRowSerializer(qs, many=True).data
        return Response(data)

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
