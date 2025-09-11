from rest_framework import serializers
from core.models import UserGroup, Training
from django.db import transaction


class TrainingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Training
        fields = ["id", "timestamp", "name", "description", "expiry", "type", "config"]


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


class TrainingGroupsPatchSerializer(serializers.Serializer):
    add = serializers.ListField(child=serializers.UUIDField(), required=True)
    remove = serializers.ListField(child=serializers.UUIDField(), required=True)

    def save(self):
        training = self.instance

        add_ids = self.validated_data["add"]
        remove_ids = self.validated_data["remove"]

        with transaction.atomic():
            existing_add_groups = UserGroup.objects.filter(id__in=add_ids)
            training.groups.add(*existing_add_groups)
            existing_remove_groups = UserGroup.objects.filter(id__in=remove_ids)
            training.groups.remove(*existing_remove_groups)

        return training
