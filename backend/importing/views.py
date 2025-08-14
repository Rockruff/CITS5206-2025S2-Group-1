from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from training.services import create_records_for_batch
from .models import ImportBatch, ImportRow, RowStatus, BatchStatus
from .serializers import (
    ImportBatchCreateSerializer,
    ImportBatchSerializer,
    ImportRowSerializer,
)
from .services import stage_rows_from_file, process_pending_rows
from training.services_people_import import materialize_people_batch
from rest_framework.decorators import action
from rest_framework import permissions
from rest_framework.response import Response


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return request.user.is_authenticated
        return request.user.is_staff


class ImportBatchViewSet(viewsets.ModelViewSet):
    queryset = ImportBatch.objects.select_related("uploader").order_by("-received_at")
    permission_classes = [IsStaffOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def materialize_people(self, request, pk=None):
        batch = self.get_object()
        res = materialize_people_batch(batch)
        return Response({"detail": "People materialised", **res})

    def get_serializer_class(self):
        return (
            ImportBatchCreateSerializer
            if self.action == "create"
            else ImportBatchSerializer
        )

    def perform_create(self, serializer):
        batch = serializer.save()
        stage_rows_from_file(batch)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def process(self, request, pk=None):
        batch = self.get_object()
        process_pending_rows(batch)
        return Response({"detail": "Batch processed.", "status": batch.status})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def retry_batch(self, request, pk=None):
        batch = self.get_object()
        with transaction.atomic():
            ImportRow.objects.filter(batch=batch).delete()
            batch.reprocess_count += 1
            batch.last_reprocess_at = timezone.now()
            batch.status = BatchStatus.PENDING
            batch.result_message = ""
            batch.total_rows = batch.accepted_rows = batch.error_rows = (
                batch.skipped_rows
            ) = 0
            batch.save()
        stage_rows_from_file(batch)
        return Response({"detail": "Batch reset and re-staged."})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def retry_failed_rows(self, request, pk=None):
        batch = self.get_object()
        updated = ImportRow.objects.filter(batch=batch, status=RowStatus.ERROR).update(
            status=RowStatus.PENDING,
            error_details="",
            action_taken="",
            processed_at=None,
            retried=True,
        )
        return Response({"detail": f"{updated} failed rows set to PENDING."})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def materialize(self, request, pk=None):
        batch = self.get_object()
        created = create_records_for_batch(batch)
        return Response(
            {"detail": f"Created {created} TrainingRecord(s) from accepted rows."}
        )


class ImportRowViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ImportRow.objects.select_related("batch").all()
    serializer_class = ImportRowSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["batch", "status"]
    ordering_fields = ["row_number", "processed_at"]
