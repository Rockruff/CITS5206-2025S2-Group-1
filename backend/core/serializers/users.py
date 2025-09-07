from django.db import transaction
from rest_framework import serializers
from core.models import User, UserAlias


class UserSerializer(serializers.ModelSerializer):
    aliases = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "name", "role", "aliases", "groups"]

    def get_aliases(self, obj):
        return list(obj.aliases.values_list("id", flat=True))

    def get_groups(self, obj):
        return list(obj.groups.values_list("id", flat=True))


class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name"]

    def validate_id(self, value):
        if UserAlias.objects.filter(id=value).exists():
            raise serializers.ValidationError(
                "UWA ID is already associated with a user"
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create(**validated_data)
        user.aliases.create(id=user.id)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "role"]

    def validate_id(self, value):
        user = self.instance
        if not user.aliases.filter(id=value).exists():
            raise serializers.ValidationError(
                "UWA ID is not one of the user's existing aliases"
            )
        return value


class UserAliasCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id"]

    def validate_id(self, value):
        if UserAlias.objects.filter(id=value).exists():
            raise serializers.ValidationError(
                "UWA ID is already associated with a user"
            )
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
            raise serializers.ValidationError(
                "UWA ID is not one of the user's existing aliases"
            )
        if value == user.id:
            raise serializers.ValidationError(
                "Cannot remove the primary UWA ID of a user"
            )
        return value

    def save(self):
        user = self.instance
        alias_id = self.validated_data["id"]
        alias = user.aliases.get(id=alias_id)
        alias.delete()
        return user
