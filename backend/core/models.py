from django.db import models

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, AbstractUser
from django.db import models


class AppUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("VIEWER", "Viewer"),
    )

    name = models.CharField(max_length=160)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default="VIEWER")

    # We do not need username or email for this app.
    # Use the primary key to satisfy AbstractBaseUser requirements.
    USERNAME_FIELD = "id"

    @property
    def uwa_ids(self):
        aliases = self.aliases.all()
        return [alias.uwa_id for alias in aliases]

    def __str__(self):
        uwa_ids = self.uwa_ids
        joined = ", ".join(uwa_ids)
        return f"{self.name} ({self.uwa_ids})"


class UserAlias(models.Model):
    """
    Maps multiple external IDs (e.g., duplicate UWA IDs) to a single AppUser.
    """

    uwa_id = models.CharField(max_length=32, unique=True, db_index=True)
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name="aliases")

    def __str__(self):
        return f"{self.uwa_id} -> {self.user_id}"


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
