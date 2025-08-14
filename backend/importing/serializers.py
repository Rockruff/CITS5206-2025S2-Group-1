from rest_framework import serializers
from .models import ImportBatch, ImportRow
import hashlib


class ImportBatchCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportBatch
        fields = ["id", "template_used", "template_version", "uploaded_file"]

    def create(self, validated_data):
        req = self.context["request"]
        batch = ImportBatch.objects.create(
            uploader=req.user,
            template_used=validated_data["template_used"],
            template_version=validated_data.get("template_version", ""),
            uploaded_file=validated_data.get("uploaded_file"),
            status="pending",
        )
        f = batch.uploaded_file
        if f and hasattr(f, "open"):
            h = hashlib.sha256()
            for chunk in f.chunks():
                h.update(chunk)
            batch.file_sha256 = h.hexdigest()
            batch.save(update_fields=["file_sha256"])
        return batch


class ImportBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportBatch
        fields = "__all__"
        read_only_fields = fields


class ImportRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportRow
        fields = "__all__"
        read_only_fields = fields
