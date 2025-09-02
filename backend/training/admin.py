from django.contrib import admin
from django.core.exceptions import ValidationError
from django.forms.models import BaseInlineFormSet
from django.db import models

from .models import (
    Department,
    Person,
    Position,
    UserPosition,
    Category,
    UserCategory,
    Training,
    TrainingFieldDef,
    TrainingRecord,
    TrainingRecordFieldValue,
    CategoryTrainingRequirement,
    TrainingEvent,
    TrainingAttendance,
)


# ---------- Inline + validation for required dynamic fields ----------
class FieldValueInlineFormset(BaseInlineFormSet):
    def clean(self):
        super().clean()
        record = self.instance
        if not record or not record.training:
            return
        # all active+required defs for this training OR global (training is NULL)
        req_ids = (
            TrainingFieldDef.objects.filter(active=True, required=True)
            .filter(
                models.Q(training__isnull=True) | models.Q(training=record.training)
            )
            .values_list("id", flat=True)
        )
        provided = set()
        for form in self.forms:
            if form.cleaned_data.get("DELETE"):
                continue
            fd = form.cleaned_data.get("field_def")
            if fd:
                provided.add(getattr(fd, "id", fd))
        missing = set(req_ids) - provided
        if missing:
            raise ValidationError(
                {"field_values": "Missing required dynamic fields for this training."}
            )


class FieldValueInline(admin.TabularInline):
    model = TrainingRecordFieldValue
    extra = 0
    formset = FieldValueInlineFormset


@admin.register(TrainingRecord)
class TrainingRecordAdmin(admin.ModelAdmin):
    list_display = (
        "person",
        "training",
        "status",
        "completed_at",
        "expiry_at",
        "source",
    )
    list_filter = ("status", "source", "training")
    search_fields = (
        "person__email",
        "person__external_id",
        "training__code",
        "training__title",
    )
    inlines = [FieldValueInline]


# ---------- The rest of your admins ----------
@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "email",
        "external_id",
        "person_type",
        "department",
        "active",
        "created_at",
    )
    list_filter = ("person_type", "active", "department")
    search_fields = ("email", "external_id", "first_name", "last_name")


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "is_active")
    list_filter = ("is_active",)
    search_fields = ("code", "title")


@admin.register(UserPosition)
class UserPositionAdmin(admin.ModelAdmin):
    list_display = ("person", "position", "start_date", "end_date")
    list_filter = ("position",)
    search_fields = ("person__email", "person__external_id")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "scope", "active")
    list_filter = ("scope", "active")
    search_fields = ("name", "slug")


@admin.register(UserCategory)
class UserCategoryAdmin(admin.ModelAdmin):
    list_display = ("person", "category", "assigned_by", "assigned_at")
    list_filter = ("category",)
    search_fields = ("person__email", "person__external_id")


@admin.register(Training)
class TrainingAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "expiry_mode", "default_expiry_days", "active")
    list_filter = ("expiry_mode", "active")
    search_fields = ("code", "title")
    filter_horizontal = ("categories",)


@admin.register(TrainingFieldDef)
class TrainingFieldDefAdmin(admin.ModelAdmin):
    list_display = ("training", "key", "label", "data_type", "required", "active")
    list_filter = ("data_type", "required", "active", "training")
    search_fields = ("key", "label")


@admin.register(TrainingRecordFieldValue)
class TrainingRecordFieldValueAdmin(admin.ModelAdmin):
    list_display = (
        "record",
        "field_def",
        "value_text",
        "value_number",
        "value_date",
        "value_boolean",
    )
    search_fields = ("record__person__email", "field_def__key")


@admin.register(CategoryTrainingRequirement)
class CTRAdmin(admin.ModelAdmin):
    list_display = (
        "category",
        "training",
        "required",
        "frequency_days",
        "valid_if_any_in_group",
        "active",
    )
    list_filter = ("required", "active", "category", "training")


@admin.register(TrainingEvent)
class TrainingEventAdmin(admin.ModelAdmin):
    list_display = (
        "training",
        "title",
        "start_at",
        "location",
        "external_system",
        "external_event_id",
    )
    list_filter = ("external_system", "training")
    search_fields = ("title", "external_event_id")


@admin.register(TrainingAttendance)
class TrainingAttendanceAdmin(admin.ModelAdmin):
    list_display = ("event", "person", "status", "checked_in_at", "source")
    list_filter = ("status", "source", "event")
    search_fields = ("person__email", "person__external_id")
