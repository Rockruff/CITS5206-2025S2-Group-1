# core/serializers/users.py
from django.db import transaction
from rest_framework import serializers
from urllib.parse import quote

from core.models import User, UserAlias


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ["id", "avatar", "name", "role", "aliases", "groups"]


class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name"]

    def validate_id(self, value):
        if UserAlias.objects.filter(id=value).exists():
            raise serializers.ValidationError("UWA ID is already associated with a user")
        return value

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create(**validated_data)
        user.aliases.create(id=user.id)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "role", "groups"]

    def validate_id(self, value):
        user = self.instance
        if not user.aliases.filter(id=value).exists():
            raise serializers.ValidationError("UWA ID is not one of the user's existing aliases")
        return value


class UserAliasCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id"]

    def validate_id(self, value):
        if UserAlias.objects.filter(id=value).exists():
            raise serializers.ValidationError("UWA ID is already associated with a user")
        return value

    def save(self):
        user = self.instance
        alias_id = self.validated_data["id"]
        user.aliases.create(id=alias_id)
        return user


class UserAliasDeleteSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id"]

    def validate_id(self, value):
        user = self.instance
        if not user.aliases.filter(id=value).exists():
            raise serializers.ValidationError("UWA ID is not one of the user's existing aliases")
        if value == user.id:
            raise serializers.ValidationError("Cannot remove the primary UWA ID of a user")
        return value

    def save(self):
        user = self.instance
        alias_id = self.validated_data["id"]
        alias = user.aliases.get(id=alias_id)
        alias.delete()
        return user


class UserRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name"]

    def validate(self, attrs):
        name = attrs.get("name")
        if self.instance and self.instance.name != name:
            raise serializers.ValidationError(
                "UWA ID already belongs to another user with a different name"
            )
        return attrs

    def save(self):
        if self.instance:
            return self.instance
        user = User.objects.create(**self.validated_data)
        user.aliases.create(id=user.id)
        return user
