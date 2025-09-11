from datetime import timedelta, timezone
from django.db import models
from django.core.validators import RegexValidator, MinValueValidator
from django.contrib.auth.models import AbstractBaseUser
from uuid import uuid4


class HasUwaId(models.Model):
    id = models.CharField(
        primary_key=True,
        max_length=15,
        validators=[RegexValidator(regex=r"^\d{8}$")],  # Only 8-digit for now
    )

    class Meta:
        abstract = True


class User(HasUwaId, AbstractBaseUser):
    ROLE_CHOICES = (("ADMIN", "Admin"), ("VIEWER", "Viewer"))

    # Full Name
    name = models.CharField(max_length=127)
    # User Role
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default="VIEWER")

    # We do not need username or email for this app.
    # Use the primary key to satisfy AbstractBaseUser requirements.
    USERNAME_FIELD = "id"


class UserAlias(HasUwaId):
    # Target User
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="aliases")


class UserGroup(models.Model):
    # Group ID
    id = models.UUIDField(primary_key=True, default=uuid4)
    # Created At
    timestamp = models.DateTimeField(auto_now_add=True)
    # Group Name (Unique)
    name = models.CharField(max_length=127, unique=True)
    # Group Description
    description = models.CharField(max_length=255, default="")
    # Group Members
    users = models.ManyToManyField(User, related_name="groups")


class Training(models.Model):
    TYPE_CHOICES = (
        ("LMS", "LMS"),
        ("TRYBOOKING", "TryBooking"),
        ("EXTERNAL", "External"),
    )

    # Training ID
    id = models.UUIDField(primary_key=True, default=uuid4)
    # Created At
    timestamp = models.DateTimeField(auto_now_add=True)
    # Traing Name
    name = models.CharField(max_length=127, unique=True)
    # Training Description
    description = models.CharField(max_length=255, default="")
    # Training Type
    type = models.CharField(max_length=15, choices=TYPE_CHOICES)
    # Training Record Expiry (Number of Days, 0 == No Expiry)
    expiry = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    # Dynamic Configuration Object
    config = models.JSONField(default=dict)
    # Associated Groups
    groups = models.ManyToManyField(UserGroup, related_name="trainings")


class TrainingRecord(models.Model):
    # Training Record ID
    id = models.UUIDField(primary_key=True, default=uuid4)
    # Source User
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="records")
    # Source Training
    training = models.ForeignKey(Training, on_delete=models.CASCADE, related_name="records")
    # Completed at
    timestamp = models.DateTimeField(auto_now_add=True)
    # Dynamic payload (scores, certificates, external references, etc.)
    details = models.JSONField(default=dict)

    @property
    def is_expired(self):
        training_expiry = self.training.expiry
        expiry_date = self.timestamp + timedelta(days=training_expiry)
        return (training_expiry > 0) and (timezone.now() > expiry_date)


class TrainingRecordAttachment(models.Model):
    # File Name
    name = models.CharField(max_length=255)
    # File Hash (used to locate the actual file on storage)
    sha256 = models.CharField(max_length=64, db_index=True)
    # File Type (could be used by frontend for preview)
    type = models.CharField(max_length=127)
    # Associated Training Record
    record = models.ForeignKey(TrainingRecord, on_delete=models.CASCADE, related_name="attachments")

    @property
    def path(self):
        # To be adapted later
        return f"/media/{self.sha256}"
