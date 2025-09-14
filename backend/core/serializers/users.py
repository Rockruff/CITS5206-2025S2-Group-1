
from django.db import transaction
from rest_framework import serializers
from core.models import User, UserAlias, UserGroup


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
        # Ensure UWA ID is 8 digits (validator on model also does this)
        if not re.match(r"^\d{8}$", value):
            raise serializers.ValidationError("Invalid UWA ID")
        if User.objects.filter(id=value).exists():
            raise serializers.ValidationError("UWA ID already exists")
        return value

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create(**validated_data)
        # Save initial alias (primary ID as alias)
        UserAlias.objects.create(user=user, id=user.id)
        return user


class UserUpdateSerializer(serializers.Serializer):
    # Update name and role; ID change happens via PATCH with id field (must be an alias)
    id = serializers.CharField(required=False)
    name = serializers.CharField(required=False, allow_blank=False)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=False)

    def validate(self, attrs):
        user = self.instance
        if "id" in attrs:
            new_id = attrs["id"]
            # Must be one of existing aliases
            if not user.aliases.filter(id=new_id).exists():
                raise serializers.ValidationError({"id": "ID must be one of the user's aliases"})
        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        user = self.instance
        if "name" in self.validated_data:
            user.name = self.validated_data["name"]
        if "role" in self.validated_data:
            user.role = self.validated_data["role"]
        if "id" in self.validated_data:
            # change primary UWA ID
            new_id = self.validated_data["id"]
            # Update primary key: we need to set user.id and save; aliases already includes new_id
            user.id = new_id
        user.save()
        return user


class UserAliasCreateSerializer(serializers.Serializer):
    id = serializers.CharField()

    def validate_id(self, value):
        # must be 8 digits
        if not re.match(r"^\d{8}$", value):
            raise serializers.ValidationError("Invalid UWA ID")
        if User.objects.filter(id=value).exists():
            raise serializers.ValidationError("UWA ID already used by another user")
        if UserAlias.objects.filter(id=value).exists():
            raise serializers.ValidationError("UWA ID already used as an alias")
        return value

    @transaction.atomic
    def save(self):
        user: User = self.instance
        alias_id = self.validated_data["id"]
        UserAlias.objects.create(user=user, id=alias_id)
        return user


class UserAliasDeleteSerializer(serializers.Serializer):
    id = serializers.CharField()

    def validate_id(self, value):
        user: User = self.instance
        if not user.aliases.filter(id=value).exists():
            raise serializers.ValidationError("UWA ID is not one of the user's existing aliases")
        if value == user.id:
            raise serializers.ValidationError("Cannot remove the primary UWA ID of a user")
        return value

    @transaction.atomic
    def save(self):
        user: User = self.instance
        alias_id = self.validated_data["id"]
        user.aliases.filter(id=alias_id).delete()
        return user
