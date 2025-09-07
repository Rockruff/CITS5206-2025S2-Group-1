from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import User, UserAlias


@receiver(post_migrate)
def create_hardcoded_admins(sender, **kwargs):
    for name, id, *aliases in [
        ("Christina Fington", "24260355"),
        ("Dani Thomas", "24261923"),
        ("Gayathri Kasunthika Kanakaratne", "24297797"),
        ("Manas Rawat", "24004729"),
        ("Siqi Shen", "24117655"),
        ("Wei Dai", "24076678"),
        ("Zhaodong Shen", "24301655", "00117401"),
    ]:
        (admin_user, _) = User.objects.get_or_create(id=id, name=name, role="ADMIN")
        for id in [id, *aliases]:
            UserAlias.objects.get_or_create(id=id, user=admin_user)
