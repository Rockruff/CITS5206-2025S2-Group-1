from django.conf import settings
from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower
from django.utils import timezone


# -------------------- People / Users --------------------
class PersonType(models.TextChoices):
    STAFF = "staff", "Staff"
    STUDENT = "student", "Student"
    OTHER = "other", "Other"


class Department(models.Model):
    name = models.CharField(max_length=160, unique=True)

    def __str__(self):
        return self.name


class Person(models.Model):
    external_id = models.CharField(
        max_length=64, null=True, blank=True
    )  # UWA ID / StaffNo / StudentNo
    email = models.EmailField(null=True, blank=True)
    first_name = models.CharField(max_length=120, blank=True)
    last_name = models.CharField(max_length=120, blank=True)
    person_type = models.CharField(
        max_length=10, choices=PersonType.choices, default=PersonType.OTHER
    )
    department = models.ForeignKey(
        Department,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="people",
    )
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["external_id"]),
            models.Index(Lower("email"), name="idx_person_email_lower"),
        ]
        constraints = [
            models.UniqueConstraint(
                Lower("email"),
                name="uq_person_email_lower",
                condition=~Q(email__isnull=True),
            ),
            models.UniqueConstraint(
                fields=["external_id"],
                name="uq_person_external_id",
                condition=~Q(external_id__isnull=True),
            ),
        ]

    def __str__(self):
        return self.email or self.external_id or f"Person {self.pk}"


class Position(models.Model):
    code = models.CharField(max_length=32, unique=True)  # e.g., PROF, HOD
    title = models.CharField(max_length=160)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} — {self.title}"


class UserPosition(models.Model):
    person = models.ForeignKey(
        Person, on_delete=models.CASCADE, related_name="position_history"
    )
    position = models.ForeignKey(
        Position, on_delete=models.PROTECT, related_name="holders"
    )
    start_date = models.DateField()  # history key
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = [("person", "position", "start_date")]
        indexes = [models.Index(fields=["person", "start_date"])]


# -------------------- Categories (trainings / users) --------------------
class CategoryScope(models.TextChoices):
    TRAINING = "training", "Training"
    USER = "user", "User"
    BOTH = "both", "Both"


class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    scope = models.CharField(
        max_length=10, choices=CategoryScope.choices, default=CategoryScope.TRAINING
    )
    active = models.BooleanField(default=True)

    class Meta:
        indexes = [models.Index(fields=["scope", "active"])]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "scope"], name="uq_category_name_scope"
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.scope})"


class UserCategory(models.Model):
    person = models.ForeignKey(
        Person, on_delete=models.CASCADE, related_name="categories"
    )
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="user_members"
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("person", "category")]


# -------------------- Trainings --------------------
class ExpiryMode(models.TextChoices):
    NONE = "none", "No expiry"
    FIXED_DAYS = "fixed_days", "Fixed days from completion"
    PER_RECORD = "per_record", "Stored per record"


class Training(models.Model):
    code = models.CharField(max_length=50, unique=True)  # e.g., HSW-FIRE-101
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)

    expiry_mode = models.CharField(
        max_length=20, choices=ExpiryMode.choices, default=ExpiryMode.NONE
    )
    default_expiry_days = models.PositiveIntegerField(null=True, blank=True)

    categories = models.ManyToManyField(
        Category, related_name="trainings", blank=True
    )  # scope in ('training','both')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} — {self.title}"


# Dynamic field definitions (admin-defined)
class FieldDataType(models.TextChoices):
    TEXT = "text", "Text"
    NUMBER = "number", "Number"
    DATE = "date", "Date"
    BOOLEAN = "boolean", "Boolean"
    SELECT = "select", "Select"
    JSON = "json", "JSON"


class TrainingFieldDef(models.Model):
    training = models.ForeignKey(
        Training,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="field_defs",
    )
    key = models.SlugField(max_length=64)  # machine key
    label = models.CharField(max_length=120)
    data_type = models.CharField(
        max_length=10, choices=FieldDataType.choices, default=FieldDataType.TEXT
    )
    required = models.BooleanField(default=False)
    options = models.JSONField(
        null=True, blank=True
    )  # for SELECT or regex/min/max hints
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["training", "key"], name="uq_fielddef_training_key"
            )
        ]

    def __str__(self):
        return f"{self.training.code if self.training else 'GLOBAL'}:{self.key}"


# -------------------- Training Records --------------------
class TrainingRecordStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    VALID = "valid", "Valid"
    EXPIRED = "expired", "Expired"
    REVOKED = "revoked", "Revoked"


class TrainingRecordSource(models.TextChoices):
    LMS = "lms", "LMS"
    TRYBOOKING = "trybooking", "TryBooking"
    BULK_UPLOAD = "bulk_upload", "Bulk upload"
    MANUAL = "manual", "Manual"


class TrainingRecord(models.Model):
    person = models.ForeignKey(
        Person, on_delete=models.CASCADE, related_name="training_records"
    )
    training = models.ForeignKey(
        Training, on_delete=models.CASCADE, related_name="records"
    )

    completed_at = models.DateTimeField(null=True, blank=True)
    expiry_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=TrainingRecordStatus.choices,
        default=TrainingRecordStatus.PENDING,
    )
    source = models.CharField(
        max_length=20,
        choices=TrainingRecordSource.choices,
        default=TrainingRecordSource.MANUAL,
    )
    notes = models.TextField(blank=True)
    evidence = models.JSONField(null=True, blank=True)

    # provenance
    import_row = models.ForeignKey(
        "importing.ImportRow",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_training_records",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["person", "training"]),
            models.Index(fields=["status"]),
            models.Index(fields=["expiry_at"]),
        ]

    def __str__(self):
        return f"{self.person} • {self.training} • {self.status}"


class TrainingRecordFieldValue(models.Model):
    record = models.ForeignKey(
        TrainingRecord, on_delete=models.CASCADE, related_name="field_values"
    )
    field_def = models.ForeignKey(
        TrainingFieldDef, on_delete=models.PROTECT, related_name="values"
    )
    value_text = models.TextField(null=True, blank=True)
    value_number = models.DecimalField(
        max_digits=20, decimal_places=4, null=True, blank=True
    )
    value_date = models.DateField(null=True, blank=True)
    value_boolean = models.BooleanField(null=True, blank=True)
    value_json = models.JSONField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["record", "field_def"], name="uq_record_fielddef"
            ),
            models.CheckConstraint(
                name="ck_fieldvalue_has_value",
                check=(
                    Q(value_text__isnull=False)
                    | Q(value_number__isnull=False)
                    | Q(value_date__isnull=False)
                    | Q(value_boolean__isnull=False)
                    | Q(value_json__isnull=False)
                ),
            ),
        ]


# -------------------- Requirements per user category --------------------
class CategoryTrainingRequirement(models.Model):
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="training_requirements"
    )
    training = models.ForeignKey(
        Training, on_delete=models.CASCADE, related_name="category_requirements"
    )
    required = models.BooleanField(default=True)
    frequency_days = models.PositiveIntegerField(
        null=True, blank=True
    )  # renew every N days
    valid_if_any_in_group = models.CharField(max_length=64, blank=True)  # OR-group key
    grace_period_days = models.PositiveIntegerField(null=True, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        unique_together = [("category", "training")]


# -------------------- Events & Attendance (TryBooking-ready) --------------------
class ExternalSystem(models.TextChoices):
    TRYBOOKING = "trybooking", "TryBooking"


class TrainingEvent(models.Model):
    training = models.ForeignKey(
        Training, on_delete=models.CASCADE, related_name="events"
    )
    title = models.CharField(max_length=200, blank=True)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    external_system = models.CharField(
        max_length=20, choices=ExternalSystem.choices, blank=True
    )
    external_event_id = models.CharField(max_length=64, blank=True)
    external_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or f"{self.training.code} @ {self.start_at:%Y-%m-%d}"


class AttendanceStatus(models.TextChoices):
    REGISTERED = "registered", "Registered"
    CHECKED_IN = "checked_in", "Checked in"
    NO_SHOW = "no_show", "No show"


class TrainingAttendance(models.Model):
    event = models.ForeignKey(
        TrainingEvent, on_delete=models.CASCADE, related_name="attendances"
    )
    person = models.ForeignKey(
        Person, on_delete=models.CASCADE, related_name="attendances"
    )
    status = models.CharField(
        max_length=20,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.REGISTERED,
    )
    checked_in_at = models.DateTimeField(null=True, blank=True)
    source = models.CharField(
        max_length=20, default="manual"
    )  # 'trybooking','scan','manual'
    evidence = models.JSONField(null=True, blank=True)

    class Meta:
        unique_together = [("event", "person")]
        indexes = [models.Index(fields=["status", "event"])]


# -------------------- Helpers --------------------
def compute_expiry(training: Training, completed_at):
    if not completed_at:
        return None
    if training.expiry_mode == ExpiryMode.NONE:
        return None
    if training.expiry_mode == ExpiryMode.FIXED_DAYS and training.default_expiry_days:
        return completed_at + timezone.timedelta(days=training.default_expiry_days)
    return None  # PER_RECORD -> caller sets expiry_at
