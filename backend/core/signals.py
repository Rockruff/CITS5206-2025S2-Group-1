from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import User, UserAlias

DEFAULT_DEV_PASSWORD = "admin@123"  # DEV ONLY


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
        user, _ = User.objects.get_or_create(id=id, defaults={"name": name, "role": "ADMIN"})
        # ensure role
        if getattr(user, "role", "") != "ADMIN":
            user.role = "ADMIN"

        # set a dev password only if none is set yet
        try:
            has_pwd = user.has_usable_password()
        except Exception:
            # if your custom User doesn’t implement this, assume no password
            has_pwd = False

        if not has_pwd:
            user.set_password(DEFAULT_DEV_PASSWORD)

        user.save()

        for aid in [id, *aliases]:
            UserAlias.objects.get_or_create(id=aid, user=user)
