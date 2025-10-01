from datetime import datetime
from typing import Any, Dict

from django.utils.dateparse import parse_date
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from ..models import TrainingRecord, Training, User
from ..permissions import IsAdmin


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

    def validate(self, data):
        # Check if user is already assigned to this training
        if TrainingRecord.objects.filter(user=data["user"], training=data["training"]).exists():
            raise serializers.ValidationError(
                f"User {data['user'].name} is already assigned to training {data['training'].name}"
            )
        return data

    def create(self, validated_data: Dict[str, Any]) -> TrainingRecord:
        return TrainingRecord.objects.create(**validated_data)


class TrainingRecordPatchSerializer(serializers.Serializer):
    details = serializers.JSONField(required=True)

    def update(self, instance: TrainingRecord, validated_data: Dict[str, Any]) -> TrainingRecord:
        instance.details = validated_data.get("details", instance.details)
        instance.save(update_fields=["details"])
        return instance


class TrainingRecordBatchCreateSerializer(serializers.Serializer):
    user_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()), allow_empty=False
    )
    training_id = serializers.PrimaryKeyRelatedField(queryset=Training.objects.all())
    details = serializers.JSONField(required=False, default=dict)

    def validate(self, data):
        user_ids = data["user_ids"]
        training = data["training_id"]

        # Check for existing assignments
        existing_records = TrainingRecord.objects.filter(
            user__in=user_ids, training=training
        ).select_related("user")

        if existing_records.exists():
            existing_users = [record.user.name for record in existing_records]
            raise serializers.ValidationError(
                f"Users {', '.join(existing_users)} are already assigned to training {training.name}"
            )

        return data

    def create(self, validated_data: Dict[str, Any]) -> list[TrainingRecord]:
        user_ids = validated_data["user_ids"]
        training = validated_data["training_id"]
        details = validated_data.get("details", {})

        records = []
        for user in user_ids:
            record = TrainingRecord.objects.create(user=user, training=training, details=details)
            records.append(record)

        return records


# --------- Pagination (per-view) ---------
class TrainingRecordPage(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


# --------- ViewSet ---------
class TrainingRecordViewSet(viewsets.ModelViewSet):
    """
    CRUD for per-user training completions.
    Query params: user, training, expired=true|false, before=YYYY-MM-DD, after=YYYY-MM-DD, order_by=timestamp|-timestamp
    Pagination: page, page_size (max 100)
    """

    pagination_class = TrainingRecordPage  # <-- added
    queryset = TrainingRecord.objects.select_related("user", "training").order_by("-timestamp")
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return TrainingRecordCreateSerializer
        if self.action == "batch_create":
            return TrainingRecordBatchCreateSerializer
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

    # POST /training-records/batch
    @action(detail=False, methods=["post"], url_path="batch")
    def batch_create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        records = serializer.save()

        # Return the created records
        read_serializer = TrainingRecordReadSerializer(records, many=True)
        return Response(read_serializer.data, status=status.HTTP_200_OK)
