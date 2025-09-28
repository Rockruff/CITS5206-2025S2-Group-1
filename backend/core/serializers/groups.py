from rest_framework import serializers
from core.models import UserGroup, User, Training


class UserGroupSerializer(serializers.ModelSerializer):
    users = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), many=True, required=False
    )

    class Meta:
        model = UserGroup
        fields = ["id", "name", "description", "users", "timestamp"]
        read_only_fields = ["id", "timestamp"]


class GroupBatchManageUsersSerializer(serializers.Serializer):
    group = serializers.PrimaryKeyRelatedField(queryset=UserGroup.objects.all())
    add = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        required=False,
        default=list,
    )
    remove = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        required=False,
        default=list,
    )


class GroupBatchManageTrainingsSerializer(serializers.Serializer):
    group = serializers.PrimaryKeyRelatedField(queryset=UserGroup.objects.all())
    add = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Training.objects.all()),
        required=False,
        default=list,
    )
    remove = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Training.objects.all()),
        required=False,
        default=list,
    )


class UserGroupBriefSerializer(serializers.ModelSerializer):
    """Lightweight group for embedding inside other payloads."""

    class Meta:
        model = UserGroup
        fields = ["id", "name", "description", "timestamp"]
        read_only_fields = ["id", "timestamp"]
