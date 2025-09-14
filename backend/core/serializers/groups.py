from rest_framework import serializers
from core.models import UserGroup, User

class UserGroupSerializer(serializers.ModelSerializer):
    users = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), many=True, required=False
    )

    class Meta:
        model = UserGroup
        fields = ["id", "name", "description", "users", "timestamp"]
        read_only_fields = ["id", "timestamp"]
