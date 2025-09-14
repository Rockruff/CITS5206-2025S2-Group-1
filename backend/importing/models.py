from django.conf import settings
from django.db import models
from django.contrib.postgres.indexes import GinIndex
from django.contrib.auth.models import User


class BatchStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"
    PARTIAL = "partial", "Partial"


class RowStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    SKIPPED = "skipped", "Skipped"
    ERROR = "error", "Error"
    PROCESSED = "processed", "Processed"


class ImportBatch(models.Model):
    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="import_batches",
    )
    template_used = models.CharField(max_length=255)
    template_version = models.CharField(max_length=50, blank=True)
    uploaded_file = models.FileField(
        upload_to="uploads/imports/%Y/%m/%d/", null=True, blank=True
    )
    file_sha256 = models.CharField(max_length=64, blank=True)
    received_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=BatchStatus.choices, default=BatchStatus.PENDING
    )
    result_message = models.TextField(blank=True)
    total_rows = models.PositiveIntegerField(default=0)
    accepted_rows = models.PositiveIntegerField(default=0)
    error_rows = models.PositiveIntegerField(default=0)
    skipped_rows = models.PositiveIntegerField(default=0)
    reprocess_count = models.PositiveIntegerField(default=0)
    last_reprocess_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-received_at"]
        indexes = [
            models.Index(fields=["status", "received_at"]),
            models.Index(fields=["template_used"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["file_sha256"], name="uq_import_batches_sha256"
            )
        ]

    def __str__(self):
        return f"Batch {self.pk} ({self.template_used})"


class ImportRow(models.Model):
    batch = models.ForeignKey(
        ImportBatch, on_delete=models.CASCADE, related_name="rows"
    )
    row_number = models.PositiveIntegerField()
    raw_json = models.JSONField()
    normalized_data = models.JSONField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=RowStatus.choices, default=RowStatus.PENDING
    )
    error_details = models.TextField(blank=True)
    action_taken = models.CharField(max_length=255, blank=True)
    related_app_label = models.CharField(max_length=100, blank=True)
    related_model = models.CharField(max_length=100, blank=True)
    related_object_pk = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    retried = models.BooleanField(default=False)

    class Meta:
        ordering = ["row_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["batch", "row_number"], name="uq_batch_row_number"
            )
        ]
        indexes = [
            models.Index(fields=["batch", "status"]),
            GinIndex(name="gin_raw_json", fields=["raw_json"]),
        ]

    def __str__(self):
        return f"Batch {self.batch_id} Row {self.row_number}"

class UserGroup(models.Model):
    name = models.CharField(max_length=100, unique=True)
    users = models.ManyToManyField(User, related_name="user_groups", blank=True)

    def __str__(self):
        return self.name