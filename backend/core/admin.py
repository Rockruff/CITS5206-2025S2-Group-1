from django.contrib import admin
from .models import AppUser, UserAlias, UserGroup, Training, TrainingAssignment


@admin.register(AppUser)
class AppUserAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "uwa_id", "role", "username", "email")
    search_fields = ("full_name", "uwa_id", "username", "email")


@admin.register(UserAlias)
class UserAliasAdmin(admin.ModelAdmin):
    list_display = ("alias_uwa_id", "user")
    search_fields = ("alias_uwa_id",)


@admin.register(UserGroup)
class UserGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Training)
class TrainingAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "ttype")
    search_fields = ("name",)


@admin.register(TrainingAssignment)
class TrainingAssignmentAdmin(admin.ModelAdmin):
    list_display = ("training", "group")
