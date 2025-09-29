# core/serializers/users.py
from django.db import transaction
from rest_framework import serializers
from urllib.parse import quote

from core.models import User, UserAlias, TrainingRecord  # ⬅ added TrainingRecord import


class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    aliases = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()
    # NEW: exposed only when you pass context={"training": <Training instance>}
    completion_status = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "avatar",
            "name",
            "role",
            "aliases",
            "groups",
            "completion_status",
        ]

    def get_avatar(self, obj):
        encoded_name = quote(obj.name)
        return f"https://ui-avatars.com/api/?background=random&name={encoded_name}"

    def get_aliases(self, obj):
        return list(obj.aliases.values_list("id", flat=True))

    def get_groups(self, obj):
        return list(obj.groups.values_list("id", flat=True))

    def get_completion_status(self, obj):
        """
        If the view passes context={"training": <Training>}, return:
          "not_attempted" | "expired" | "failed" | "passed"
        Otherwise return None (keeps the field harmless when not relevant).
        """
        training = self.context.get("training")
        if not training:
            return None

        # Prefer prefetch if the view supplied it:
        #   Prefetch("records", queryset=TrainingRecord.objects.filter(training=training),
        #            to_attr="records_for_training")
        recs = getattr(obj, "records_for_training", None)
        if recs is None:
            record = TrainingRecord.objects.filter(user=obj, training=training).first()
        else:
            record = recs[0] if recs else None

        if not record:
            return "not_attempted"

        if record.is_expired:
            return "expired"

        details = record.details or {}
        # 1) explicit boolean wins
        if isinstance(details.get("completed"), bool):
            return "passed" if details["completed"] else "failed"

        # 2) fallback to score threshold from training.config
        req = training.config.get("completance_score")
        score = details.get("score")
        if isinstance(req, (int, float)) and isinstance(score, (int, float)):
            return "passed" if score >= req else "failed"

        # 3) last resort: record exists and not expired → consider passed
        return "passed"


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
        fields = ["id", "name", "role"]

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
