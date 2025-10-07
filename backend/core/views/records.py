from datetime import datetime
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import viewsets
from django.http import Http404
from django.db import transaction

from core.models import UserAlias, TrainingRecord
from core.serializers.users import UserRowSerializer
from core.serializers.records import (
    TrainingRecordReadSerializer,
    TrainingRecordCreateSerializer,
    TrainingRecordPatchSerializer,
)
from core.permissions import IsAdmin
from core.utils import (
    COMPLETEION_DATE_COL,
    NAME_COL,
    SCORE_COL,
    UID_COL,
    paginate_qs,
    parse_csv,
    parse_xlsx,
    parse_to_aware_datetime,
)
from core.models import Training  # Import here if not already imported


class TrainingRecordViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAdmin]

    def get_object(self):
        pk = self.kwargs.get("pk")
        try:
            record = TrainingRecord.objects.get(pk=pk)
        except TrainingRecord.DoesNotExist:
            raise Http404
        return record

    # GET /training-records
    def list(self, request):
        qs = TrainingRecord.objects.all()

        order_by = request.query_params.get("order_by", "-timestamp")
        if order_by in {
            "timestamp",
            "-timestamp",
            "user_id",
            "-user_id",
            "user_name",
            "-user_name",
            "training",
            "-training",
        }:
            if order_by == "user_id":
                qs = qs.order_by("user__id")
            elif order_by == "-user_name":
                qs = qs.order_by("-user__id")
            elif order_by == "user_name":
                qs = qs.order_by("user__name")
            elif order_by == "-user_name":
                qs = qs.order_by("-user__name")
            elif order_by == "training":
                qs = qs.order_by("training__name")
            elif order_by == "-training":
                qs = qs.order_by("-training__name")
            else:
                qs = qs.order_by(order_by)

        training = request.query_params.get("training")
        if training:
            qs = qs.filter(training_id=training)

        # [from, to)
        start = request.query_params.get("from")
        start = parse_to_aware_datetime(start)
        if start:
            qs = qs.filter(timestamp__gte=start)
        end = request.query_params.get("to")
        end = parse_to_aware_datetime(end)
        if end:
            qs = qs.filter(timestamp__lt=end)

        user_id = request.query_params.get("user_id")
        if user_id:
            qs = qs.filter(user__aliases__id__icontains=user_id).distinct()

        user_name = request.query_params.get("user_name")
        if user_name:
            keywords = user_name.split()
            for kw in keywords:
                qs = qs.filter(user__name__icontains=kw)

        return paginate_qs(qs, request.query_params, 20, TrainingRecordReadSerializer, Response)

    # POST /training-records
    def create(self, request):
        user_id = request.data.get("user")
        alias = UserAlias.objects.filter(id=user_id).first()
        if alias:
            request.data["user"] = alias.user.id
        serializer = TrainingRecordCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record = serializer.save()
        read_serializer = TrainingRecordReadSerializer(record)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    # POST /training-records/batch
    @action(detail=False, methods=["post"], url_path="batch")
    def batch(self, request):
        try:
            training_id = request.data.get("training")
            training = Training.objects.get(pk=training_id)
        except Training.DoesNotExist:
            return Response({"detail": "Training not found."}, status=status.HTTP_404_NOT_FOUND)

        file = request.FILES.get("file")
        if not file:
            return Response(
                {"error": "Please upload a .csv or .xlsx file"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Determine file type
        name = file.name.lower()
        if name.endswith(".csv"):
            parser = parse_csv
        elif name.endswith(".xlsx"):
            parser = parse_xlsx
        else:
            return Response(
                {"error": "Please upload a .csv or .xlsx file"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if training.type == "LMS":
            cols = [UID_COL, NAME_COL, COMPLETEION_DATE_COL, SCORE_COL]
        else:
            cols = [UID_COL, NAME_COL, COMPLETEION_DATE_COL, COMPLETEION_DATE_COL]

        try:
            rows = parser(file, cols)
        except Exception:
            return Response(
                {
                    "error": (
                        "Failed to parse uploaded file. "
                        f"File must include all expected columns: {cols}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():  # rollback everything if any row fails
            for row_idx, user_id, name, date, score in rows:

                alias = UserAlias.objects.filter(id=user_id).first()
                instance = alias.user if alias else None

                serializer = UserRowSerializer(
                    instance=instance,
                    data={"id": user_id, "name": name},
                    partial=True,
                )

                if not serializer.is_valid():
                    transaction.set_rollback(True)

                    # Show first error message
                    message = ""
                    for field, messages in serializer.errors.items():
                        for msg in messages:
                            if field != "non_field_errors":
                                message = f"{field}: {msg}"
                            else:
                                message = msg
                            break

                    return Response(
                        {"error": f"Row {row_idx}: {message}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                user = serializer.save()

                date = parse_to_aware_datetime(date)
                if not date:
                    transaction.set_rollback(True)
                    return Response(
                        {"error": f"Row {row_idx}: Invalid date"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                detail = {}
                if training.type == "LMS":
                    try:
                        score = int(score)
                    except Exception:
                        transaction.set_rollback(True)
                        return Response(
                            {"error": f"Row {row_idx}: Invalid score value"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    detail = {"score": score}

                existing = TrainingRecord.objects.filter(user=user, training=training).first()
                if not existing:
                    TrainingRecord.objects.create(
                        user=user, training=training, timestamp=date, details=detail
                    )
                elif existing.timestamp < date:
                    existing.timestamp = date
                    existing.details = detail
                    existing.save()
                # else: ignore if stored is equally new or newer

        return Response()

    # PATCH /training-records/{id}
    def partial_update(self, request, pk=None):
        record = self.get_object()
        serializer = TrainingRecordPatchSerializer(record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_record = serializer.save()
        read_serializer = TrainingRecordReadSerializer(updated_record)
        return Response(read_serializer.data, status=status.HTTP_200_OK)

    # GET /training-records/{id}
    def retrieve(self, request, pk=None):
        record = self.get_object()
        serializer = TrainingRecordReadSerializer(record)
        return Response(serializer.data)

    # DELETE /training-records/{id}
    def destroy(self, request, pk=None):
        record = self.get_object()
        record.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
