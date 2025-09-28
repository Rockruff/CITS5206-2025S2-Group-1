from datetime import datetime
from typing import Any, Dict

from django.utils.dateparse import parse_date
from rest_framework import serializers, viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import TrainingRecord, Training, User
from ..permissions import IsAdmin  # same permission you use elsewhere


# --------- Serializers (inline) ---------
class TrainingRecordReadSerializer(serializers.ModelSerializer):
    expired = serializers.SerializerMethodField()

    class Meta:
        model = TrainingRecord
        fields = ["id", "user", "training", "timestamp", "details", "expired"]
        read_only_fields = ["id", "timestamp", "expired"]

    def get_expired(self, obj: TrainingRecord) -> bool:
        # model exposes .is_expired property
        return bool(getattr(obj, "is_expired", False))


class TrainingRecordCreateSerializer(serializers.Serializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    training = serializers.PrimaryKeyRelatedField(queryset=Training.objects.all())
    details = serializers.JSONField(required=False, default=dict)

    def create(self, validated_data: Dict[str, Any]) -> TrainingRecord:
        return TrainingRecord.objects.create(**validated_data)


class TrainingRecordPatchSerializer(serializers.Serializer):
    details = serializers.JSONField(required=True)

    def update(self, instance: TrainingRecord, validated_data: Dict[str, Any]) -> TrainingRecord:
        instance.details = validated_data.get("details", instance.details)
        instance.save(update_fields=["details"])
        return instance


# --------- ViewSet ---------
class TrainingRecordViewSet(viewsets.ModelViewSet):
    """
    CRUD for per-user training completions.
    Query params: user, training, expired=true|false, before=YYYY-MM-DD, after=YYYY-MM-DD, order_by=timestamp|-timestamp
    """

    queryset = TrainingRecord.objects.select_related("user", "training").order_by("-timestamp")
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return TrainingRecordCreateSerializer
        if self.action in ("partial_update", "update"):
            return TrainingRecordPatchSerializer
        return TrainingRecordReadSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        user = self.request.query_params.get("user")
        training = self.request.query_params.get("training")
        expired = self.request.query_params.get("expired")
        before = self.request.query_params.get("before")
        after = self.request.query_params.get("after")
        order_by = self.request.query_params.get("order_by")

        if user:
            qs = qs.filter(user_id=user)
        if training:
            qs = qs.filter(training_id=training)

        # date filters (compare by date; timezone handled by DB settings)
        if after:
            d = parse_date(after)
            if d:
                qs = qs.filter(timestamp__date__gte=d)
        if before:
            d = parse_date(before)
            if d:
                qs = qs.filter(timestamp__date__lte=d)

        # order
        if order_by in ("timestamp", "-timestamp"):
            qs = qs.order_by(order_by)

        # expired filter (computed property; do in Python for MVP)
        if expired in ("true", "false"):
            want = expired == "true"
            ids = [r.id for r in qs if bool(getattr(r, "is_expired", False)) is want]
            qs = qs.filter(id__in=ids)

        return qs
