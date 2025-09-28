from rest_framework import serializers
from core.models import Training
from core.serializers.groups import UserGroupBriefSerializer  # NEW: embed brief group


class TrainingSerializer(serializers.ModelSerializer):
    # NEW: include groups inline in training payloads
    groups = UserGroupBriefSerializer(many=True, read_only=True)

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
            "groups",
        ]


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
            # LMS type requires completance_score
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
        fields = ["name", "description", "expiry", "config"]

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
            # LMS type requires completance_score
            if "completance_score" not in value:
                raise serializers.ValidationError(
                    "LMS training requires 'completance_score' in config"
                )
            if not isinstance(value["completance_score"], (int, float)):
                raise serializers.ValidationError("completance_score must be a number")
        return value
