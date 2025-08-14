from django.db import transaction
from importing.models import ImportRow, RowStatus
from .models import Person, Department, Category, CategoryScope, UserCategory


def _norm(v):
    return (v or "").strip()


@transaction.atomic
def materialize_people_batch(batch):
    rows = ImportRow.objects.select_for_update().filter(
        batch=batch, status=RowStatus.ACCEPTED
    )
    created, updated = 0, 0
    for r in rows:
        raw = r.raw_json or {}
        email = _norm(raw.get("email") or raw.get("Email"))
        extid = _norm(raw.get("user_id") or raw.get("UWA_ID") or raw.get("staff_id"))
        first = _norm(raw.get("first_name") or raw.get("First Name"))
        last = _norm(raw.get("last_name") or raw.get("Last Name"))
        dept_name = _norm(raw.get("department") or raw.get("Department"))
        cat_names = [
            c.strip() for c in str(raw.get("categories") or "").split(",") if c.strip()
        ]

        person = None
        if email:
            person, created_flag = Person.objects.get_or_create(
                email=email,
                defaults={"external_id": extid, "first_name": first, "last_name": last},
            )
        elif extid:
            person, created_flag = Person.objects.get_or_create(
                external_id=extid, defaults={"first_name": first, "last_name": last}
            )
        else:
            continue  # can’t match → skip safely

        changed = False
        if extid and not person.external_id:
            person.external_id = extid
            changed = True
        if first and not person.first_name:
            person.first_name = first
            changed = True
        if last and not person.last_name:
            person.last_name = last
            changed = True
        if dept_name:
            dept, _ = Department.objects.get_or_create(name=dept_name)
            if person.department_id != dept.id:
                person.department = dept
                changed = True
        if changed:
            person.save()

        for cname in cat_names:
            slug = cname.lower().replace(" ", "-")
            cat, _ = Category.objects.get_or_create(
                slug=slug, defaults={"name": cname, "scope": CategoryScope.USER}
            )
            UserCategory.objects.get_or_create(person=person, category=cat)

        created += int(created_flag)
        updated += int(not created_flag or changed)
    return {"created": created, "updated": updated}
