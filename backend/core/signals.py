from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import User, UserAlias, Training


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
        if user.role != "ADMIN":
            user.role = "ADMIN"
        user.save()
        for aid in [id, *aliases]:
            UserAlias.objects.get_or_create(id=aid, user=user)


@receiver(post_migrate)
def create_test_trainings(sender, **kwargs):
    for name, type in (
        ("WHS Induction", "LMS"),
        ("WHS Risk Management", "LMS"),
        ("Silica Awareness Training", "EXTERNAL"),
        ("Lab Safety Course", "TRYBOOKING"),
        ("Unsealed Radioisotopes course", "TRYBOOKING"),
        ("Laser Safety Course", "TRYBOOKING"),
        ("Snorkeler Fitness Assessment", "TRYBOOKING"),
        ("Diver Assessment", "TRYBOOKING"),
        ("Dive Supervisor Course", "TRYBOOKING"),
        ("UWA Scientific Diver Course", "TRYBOOKING"),
        ("Camms Training", "EXTERNAL"),
        ("Fire Warden Training", "EXTERNAL"),
        ("First Aid", "EXTERNAL"),
        ("Local Area WHS Induction", "TRYBOOKING"),
    ):
        training, _ = Training.objects.get_or_create(name=name, defaults={"type": type})

        if type == "LMS":
            training.config = {"completance_score": 80}
            training.save()
