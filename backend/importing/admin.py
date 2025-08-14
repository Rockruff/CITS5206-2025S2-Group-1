from django.contrib import admin
from .models import ImportBatch, ImportRow


@admin.register(ImportBatch)
class ImportBatchAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "uploader",
        "template_used",
        "status",
        "total_rows",
        "accepted_rows",
        "error_rows",
        "received_at",
        "processed_at",
    )
    list_filter = ("status", "template_used")
    search_fields = ("result_message", "template_used", "file_sha256")


@admin.register(ImportRow)
class ImportRowAdmin(admin.ModelAdmin):
    list_display = ("batch", "row_number", "status", "processed_at", "action_taken")
    list_filter = ("status",)
    search_fields = ("error_details", "action_taken", "related_object_pk")
