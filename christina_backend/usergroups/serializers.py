from rest_framework import serializers
from .models import UserGroup
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]

class UserGroupSerializer(serializers.ModelSerializer):
    users = UserSerializer(many=True, read_only=True)
    user_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), write_only=True, required=False
    )

    class Meta:
        model = UserGroup
        fields = ["id", "name", "description", "users", "user_ids"]

    def create(self, validated_data):
        user_ids = validated_data.pop("user_ids", [])
        group = UserGroup.objects.create(**validated_data)
        group.users.set(user_ids)
        return group

    def update(self, instance, validated_data):
        user_ids = validated_data.pop("user_ids", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if user_ids is not None:
            instance.users.set(user_ids)
        return instance
