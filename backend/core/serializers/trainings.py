# core/serializers/trainings.py
from rest_framework import serializers
from core.models import Training, UserGroup, User


class TrainingUserStatusSerializer(serializers.ModelSerializer):
    status = serializers.CharField()

    class Meta:
        model = User
        fields = ["id", "status"]


class TrainingSerializer(serializers.ModelSerializer):
    # NEW: include groups in every training payload
    groups = serializers.SerializerMethodField()

    class Meta:
        model = Training
        fields = [
            "id",
            "timestamp",
            "name",
            "description",
            "expiry",
            "type",
            "config",
            "groups",  # <- added
        ]

    def get_groups(self, obj):
        return list(obj.groups.values_list("id", flat=True))


class TrainingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Training
        fields = ["name", "description", "expiry", "type", "config"]

    def validate_name(self, value):
        if Training.objects.filter(name=value).exists():
            raise serializers.ValidationError("Training with this name already exists")
        return value

    def validate_config(self, value):
        training_type = self.initial_data.get("type")
        if training_type == "LMS":
            # Keep current key used elsewhere: 'completance_score'
            if "completance_score" not in value:
                raise serializers.ValidationError(
                    "LMS training requires 'completance_score' in config"
                )
            if not isinstance(value["completance_score"], (int, float)):
                raise serializers.ValidationError("completance_score must be a number")
        return value


class TrainingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Training
        fields = ["name", "description", "expiry", "config", "groups"]

    def validate_name(self, value):
        if (
            self.instance
            and Training.objects.filter(name=value).exclude(id=self.instance.id).exists()
        ):
            raise serializers.ValidationError("Training with this name already exists")
        return value

    def validate_config(self, value):
        training_type = self.instance.type if self.instance else self.initial_data.get("type")
        if training_type == "LMS":
            if "completance_score" not in value:
                raise serializers.ValidationError(
                    "LMS training requires 'completance_score' in config"
                )
            if not isinstance(value["completance_score"], (int, float)):
                raise serializers.ValidationError("completance_score must be a number")
        return value
