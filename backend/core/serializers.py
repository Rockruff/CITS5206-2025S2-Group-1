from django.db import transaction
from rest_framework import serializers
from .models import AppUser, UserAlias, UserGroup, Training


# ── Users ───────────────────────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = ["id", "username", "email", "full_name", "uwa_id", "role"]
        read_only_fields = ["id", "uwa_id"]


class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = ["id", "username", "password", "email", "full_name", "uwa_id", "role"]
        read_only_fields = ["id", "role"]
        extra_kwargs = {"password": {"write_only": True}}

    @transaction.atomic
    def create(self, data):
        pwd = data.pop("password", None)
        user = AppUser.objects.create(**data)
        if pwd:
            user.set_password(pwd)
            user.save(update_fields=["password"])
        # ensure alias exists (works even if you kept the signal)
        UserAlias.objects.get_or_create(
            alias_uwa_id=user.uwa_id, defaults={"user": user}
        )
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
