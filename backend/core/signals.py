from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AppUser, UserAlias


@receiver(post_save, sender=AppUser)
def ensure_default_alias(sender, instance: AppUser, created, **kwargs):
    if not created:
        return
    # If an alias with same UWA already exists for someone else, we skip (unique constraint will block anyway)
    UserAlias.objects.get_or_create(
        alias_uwa_id=instance.uwa_id, defaults={"user": instance}
    )
