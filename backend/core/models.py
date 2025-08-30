from django.db import models

from django.contrib.auth.models import AbstractUser
from django.db import models


class AppUser(AbstractUser):
    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("MANAGER", "Manager"),
        ("VIEWER", "Viewer"),
    )

    full_name = models.CharField(max_length=160)
    uwa_id = models.CharField(max_length=32, unique=True, db_index=True)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default="VIEWER")

    # AbstractUser already has: username, email, password, is_active, etc.
    REQUIRED_FIELDS = [
        "email",
        "full_name",
        "uwa_id",
    ]  # when createsuperuser via username

    def __str__(self):
        return f"{self.full_name} ({self.uwa_id})"


class UserAlias(models.Model):
    """
    Har external ID (ya duplicate UWA) ko canonical AppUser se map karta.
    Merge easy ho jata: aliases re-point kar do.
    """

    alias_uwa_id = models.CharField(max_length=32, unique=True, db_index=True)
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name="aliases")

    def __str__(self):
        return f"{self.alias_uwa_id} -> {self.user_id}"


class UserGroup(models.Model):
    """
    Groups = bulk membership & bulk training assignments.
    """

    name = models.CharField(max_length=120, unique=True)
    members = models.ManyToManyField(AppUser, related_name="user_groups", blank=True)

    def __str__(self):
        return self.name


class Training(models.Model):
    """
    Trainings:
    - LMS: needs completion_score
    - EXTERNAL: needs proof_fields (JSON definition of fields)
    """

    TYPE_CHOICES = (("LMS", "LMS"), ("EXTERNAL", "External"))

    name = models.CharField(max_length=200, unique=True, db_index=True)
    ttype = models.CharField(max_length=16, choices=TYPE_CHOICES)

    completion_score = models.PositiveIntegerField(null=True, blank=True)  # LMS only
    proof_fields = models.JSONField(null=True, blank=True)  # EXTERNAL only

    groups = models.ManyToManyField(
        UserGroup,
        through="TrainingAssignment",
        related_name="trainings",
    )

    def __str__(self):
        return f"{self.name} [{self.ttype}]"


class TrainingAssignment(models.Model):
    """
    Bridge: which training is assigned to which group.
    Unique per (training, group).
    """

    training = models.ForeignKey(Training, on_delete=models.CASCADE)
    group = models.ForeignKey(UserGroup, on_delete=models.CASCADE)

    class Meta:
        unique_together = (("training", "group"),)

    def __str__(self):
        return f"{self.training_id} -> {self.group_id}"
