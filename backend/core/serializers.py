
from django.db import transaction
from rest_framework import serializers
from .models import AppUser, UserAlias, UserGroup, Training


# ── Users ───────────────────────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    # Expose the read-only property defined on the model (list of alias IDs)
    uwa_ids = serializers.ReadOnlyField()

    class Meta:
        model = AppUser
        fields = [
            "id",
            "name",
            "role",
            "uwa_ids",
        ]


class UserCreateSerializer(serializers.Serializer):
    # For batch/single create from external sources
    id = serializers.CharField(source="uwa_id", max_length=32)
    name = serializers.CharField(max_length=160)

    def validate(self, attrs):
        uwa_id = attrs.get("uwa_id")
        name = attrs.get("name")

        # If a user with this alias exists, ensure the name matches the canonical user name
        alias = UserAlias.objects.filter(uwa_id=uwa_id).select_related("user").first()
        if alias:
            if alias.user.name != name:
                raise serializers.ValidationError(f"Name mismatch for UWA ID {uwa_id}")
            # Otherwise it's a duplicate row for an already-linked alias -> ignore in view
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        uwa_id = validated_data["uwa_id"]
        name = validated_data["name"]

        alias = UserAlias.objects.filter(uwa_id=uwa_id).select_related("user").first()
        if alias:
            # Already exists and name matched in validate(): return the existing user
            return alias.user

        # Create a new canonical AppUser and its first alias
        user = AppUser.objects.create(name=name)  # role defaults to VIEWER
        UserAlias.objects.create(uwa_id=uwa_id, user=user)
        return user


class UserRoleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = ["role"]


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
