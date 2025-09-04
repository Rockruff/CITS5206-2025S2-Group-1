from django.db import transaction
from rest_framework import serializers
from .models import AppUser, UserAlias, UserGroup, Training


# ── Users ───────────────────────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    # Use primary UWA ID as the id field, and expose all UWA IDs as aliases
    id = serializers.SerializerMethodField()
    aliases = serializers.ReadOnlyField(source="uwa_ids")
    group_ids = serializers.SerializerMethodField()

    class Meta:
        model = AppUser
        fields = [
            "id",
            "name",
            "role",
            "aliases",
            "group_ids",
        ]
        read_only_fields = ["id", "role", "aliases", "group_ids"]

    def get_id(self, obj):
        # Return the primary UWA ID as the id field
        uwa_ids = obj.uwa_ids
        return uwa_ids[0] if uwa_ids else None

    def get_group_ids(self, obj):
        return list(obj.user_groups.values_list("id", flat=True))


class UserCreateSerializer(serializers.ModelSerializer):
    uwa_id = serializers.CharField(
        write_only=True
    )  # still accepts UWA ID when creating

    class Meta:
        model = AppUser
        fields = ["id", "name", "role", "uwa_id"]
        read_only_fields = ["id", "role"]

    @transaction.atomic
    def create(self, data):
        uwa_id = data.pop("uwa_id")
        if UserAlias.objects.filter(uwa_id=uwa_id).exists():
            raise serializers.ValidationError({"uwa_id": "UWA ID already exists"})

        user = AppUser.objects.create(**data)
        UserAlias.objects.create(uwa_id=uwa_id, user=user)
        return user


class UserRoleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = ["role"]


class UserAliasSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAlias
        fields = ["uwa_id"]

    def validate_uwa_id(self, value):
        if UserAlias.objects.filter(uwa_id=value).exists():
            raise serializers.ValidationError("UWA ID already exists")
        return value


# ── Groups ──────────────────────────────────────────────────────────────
class UserGroupSerializer(serializers.ModelSerializer):
    members_count = serializers.IntegerField(source="members.count", read_only=True)

    class Meta:
        model = UserGroup
        fields = ["id", "name", "members_count"]


# ── Trainings ───────────────────────────────────────────────────────────
class TrainingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Training
        fields = ["id", "name", "ttype", "completion_score", "proof_fields"]

    def validate(self, attrs):
        t = attrs.get("ttype", getattr(self.instance, "ttype", None))
        if t == "LMS" and not attrs.get("completion_score"):
            raise serializers.ValidationError("completion_score required for LMS")
        if t == "EXTERNAL" and not attrs.get("proof_fields"):
            raise serializers.ValidationError("proof_fields required for EXTERNAL")
        return attrs
