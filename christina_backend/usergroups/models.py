from django.db import models
from django.contrib.auth.models import User

class UserGroup(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    users = models.ManyToManyField(User, related_name="user_groups", blank=True)

    def __str__(self):
        return self.name
