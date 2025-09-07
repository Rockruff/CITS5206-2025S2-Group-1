from django.db import models
from django.contrib.auth.models import AbstractBaseUser
from uuid import uuid4


class User(AbstractBaseUser):
    ROLE_CHOICES = (("ADMIN", "Admin"), ("VIEWER", "Viewer"))

    # UWA ID
    id = models.CharField(max_length=15, primary_key=True)
    # Full Name
    name = models.CharField(max_length=127)
    # User Role
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default="VIEWER")

    # We do not need username or email for this app.
    # Use the primary key to satisfy AbstractBaseUser requirements.
    USERNAME_FIELD = "id"


class UserAlias(models.Model):
    # Alias UWA ID
    id = models.CharField(max_length=15, primary_key=True)
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
    expiry = models.IntegerField(default=0)
    # Dynamic Configuration Object
    config = models.JSONField(default=dict)
    # Associated Groups
    groups = models.ManyToManyField(UserGroup, related_name="trainings")
