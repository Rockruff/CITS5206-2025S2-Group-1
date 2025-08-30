from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import AppUser, UserAlias


@receiver(post_migrate)
def create_hardcoded_admins(sender, **kwargs):
    for name, *uwa_ids in [
        ("Christina Fington", "24260355"),
        ("Dani Thomas", "24261923"),
        ("Gayathri Kasunthika Kanakaratne", "24297797"),
        ("Manas Rawat", "24004729"),
        ("Siqi Shen", "24117655"),
        ("Wei Dai", "24076678"),
        ("Zhaodong Shen", "24301655", "00117401"),
    ]:
        (admin_user, created) = AppUser.objects.get_or_create(name=name, role="ADMIN")
        for uwa_id in uwa_ids:
            (alias, created) = UserAlias.objects.get_or_create(
                uwa_id=uwa_id, user=admin_user
            )
