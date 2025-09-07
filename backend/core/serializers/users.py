from django.db import transaction
from rest_framework import serializers
from core.models import User, UserAlias


# ── Users ───────────────────────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    # Map fields to match API documentation
    id = serializers.CharField(source="uwa_id", read_only=True)
    name = serializers.CharField(source="full_name", read_only=True)
    aliases = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "role",
            "aliases",
            "groups",
        ]
        read_only_fields = ["id", "name", "role", "aliases", "groups"]

    def get_aliases(self, obj):
        """Return all UWA ID aliases for the user"""
        # Get all aliases for the user
        alias_ids = list(obj.aliases.values_list("alias_uwa_id", flat=True))
        # If no aliases exist, at least include the user's primary UWA ID
        if not alias_ids and obj.uwa_id:
            alias_ids = [obj.uwa_id]
        return alias_ids

    def get_groups(self, obj):
        """Return list of user group IDs the user belongs to"""
        return list(obj.groups.values_list("id", flat=True))


class UserCreateSerializer(serializers.ModelSerializer):
    # Fields required by API documentation
    id = serializers.CharField(source="uwa_id", write_only=True)
    name = serializers.CharField(source="full_name")

    class Meta:
        model = User
        fields = ["id", "name"]

    def validate_id(self, value):
        """Validate that UWA ID doesn't already exist"""
        if UserAlias.objects.filter(alias_uwa_id=value).exists():
            raise serializers.ValidationError("UWA ID already exists")
        return value

    @transaction.atomic
    def create(self, validated_data):
        uwa_id = validated_data.pop("uwa_id")
        full_name = validated_data.get("full_name")

        # Create user with UWA ID as username
        user = User.objects.create(username=uwa_id, full_name=full_name, uwa_id=uwa_id)

        # Create alias
        UserAlias.objects.create(alias_uwa_id=uwa_id, user=user)

        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """User profile update serializer - matches PATCH /users/{user_id} API"""

    id = serializers.CharField(source="uwa_id", required=False)
    name = serializers.CharField(source="full_name", required=False)

    class Meta:
        model = User
        fields = ["id", "name", "role"]

    def validate_id(self, value):
        """Validate new UWA ID - must be one of user's aliases"""
        if value:
            # Check if this ID exists as an alias for this user
            if not UserAlias.objects.filter(
                alias_uwa_id=value, user=self.instance
            ).exists():
                # If not, check if it's used by another user
                existing_alias = UserAlias.objects.filter(alias_uwa_id=value).first()
                if existing_alias:
                    raise serializers.ValidationError("UWA ID already exists")
        return value

    def update(self, instance, validated_data):
        # If updating UWA ID, it must be one of user's existing aliases
        new_uwa_id = validated_data.pop("uwa_id", None)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if new_uwa_id and new_uwa_id != instance.uwa_id:
            # Verify this is one of the user's aliases
            if not UserAlias.objects.filter(
                alias_uwa_id=new_uwa_id, user=instance
            ).exists():
                raise serializers.ValidationError(
                    "ID must be one of the user's aliases"
                )

            # Update primary UWA ID
            instance.uwa_id = new_uwa_id
            instance.username = new_uwa_id

        instance.save()
        return instance


class UserAliasSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="alias_uwa_id")

    class Meta:
        model = UserAlias
        fields = ["id"]

    def validate_id(self, value):
        if UserAlias.objects.filter(alias_uwa_id=value).exists():
            raise serializers.ValidationError("UWA ID already exists")
        return value
