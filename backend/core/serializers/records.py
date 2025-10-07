from ..models import TrainingRecord
from rest_framework import serializers


# --------- Serializers (inline) ---------
class TrainingRecordReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingRecord
        fields = ["id", "user", "training", "timestamp", "details", "status"]
        read_only_fields = ["id", "user", "training", "status"]


class TrainingRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingRecord
        fields = ["user", "training", "timestamp", "details"]

    def validate(self, data):
        training = data["training"]

        if TrainingRecord.objects.filter(user=data["user"], training=data["training"]).exists():
            raise serializers.ValidationError(
                f"User {data['user'].name} is already assigned to training {data['training'].name}"
            )

        training = data["training"]
        details = data.get("details", {})
        if training.type == "LMS":
            score = details.get("score")
            if not isinstance(score, (int, float)):
                raise serializers.ValidationError("'score' must be a number")
        return data

    def create(self, validated_data):
        return TrainingRecord.objects.create(**validated_data)


class TrainingRecordPatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingRecord
        fields = ["timestamp", "details"]

    def validate(self, data):
        training = self.instance.training
        details = data.get("details", {})
        if training.type == "LMS":
            score = details.get("score")
            if not isinstance(score, (int, float)):
                raise serializers.ValidationError("'score' must be a number")
        return data
