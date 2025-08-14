from django.utils import timezone
from django.db import transaction
from training.models import (
    Person,
    Training,
    TrainingRecord,
    TrainingRecordSource,
    compute_expiry,
    ExpiryMode,
)


def _norm(s):
    return (s or "").strip()


def upsert_person_from_row(raw):
    email = _norm(raw.get("email") or raw.get("Email"))
    ext = _norm(raw.get("user_id") or raw.get("UWA_ID") or raw.get("staff_id"))
    first = (_norm(raw.get("first_name") or raw.get("First Name")))[:120]
    last = (_norm(raw.get("last_name") or raw.get("Last Name")))[:120]
    if email:
        obj, _ = Person.objects.get_or_create(
            email=email,
            defaults={"external_id": ext, "first_name": first, "last_name": last},
        )
    elif ext:
        obj, _ = Person.objects.get_or_create(
            external_id=ext, defaults={"first_name": first, "last_name": last}
        )
    else:
        return None
    if ext and not obj.external_id:
        obj.external_id = ext
        obj.save(update_fields=["external_id"])
    return obj


def get_or_create_training(raw):
    code = _norm(raw.get("training_code") or raw.get("code"))
    title = _norm(raw.get("training") or raw.get("course"))
    if code:
        t = Training.objects.filter(code=code).first()
        if t:
            return t
        return Training.objects.create(code=code, title=title or code)
    if title:
        code = title.upper().replace(" ", "-")[:50]
        t, _ = Training.objects.get_or_create(code=code, defaults={"title": title})
        return t
    return None


@transaction.atomic
def create_records_for_batch(batch):
    from importing.models import ImportRow, RowStatus

    qs = ImportRow.objects.select_for_update().filter(
        batch=batch, status=RowStatus.ACCEPTED
    )
    created = 0
    for row in qs:
        raw = row.raw_json or {}
        person = upsert_person_from_row(raw)
        training = get_or_create_training(raw)
        if not (person and training):
            continue

        completed_at = raw.get("completed_at") or raw.get("completion_date")
        if isinstance(completed_at, str):
            try:
                completed_at = timezone.datetime.fromisoformat(completed_at)
            except Exception:
                completed_at = timezone.now()

        rec = TrainingRecord.objects.create(
            person=person,
            training=training,
            completed_at=completed_at,
            source=TrainingRecordSource.BULK_UPLOAD,
            import_row=row,
            status="valid",
        )
        if training.expiry_mode == ExpiryMode.FIXED_DAYS:
            rec.expiry_at = compute_expiry(training, rec.completed_at)
            rec.save(update_fields=["expiry_at"])
        created += 1
    return created
