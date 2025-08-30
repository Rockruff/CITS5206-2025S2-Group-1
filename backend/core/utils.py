import csv
from io import TextIOWrapper
from openpyxl import load_workbook


def iter_user_rows(uploaded_file):
    # returns rows like {"name": "...", "uwa_id": "..."}
    fname = getattr(uploaded_file, "name", "").lower()
    if fname.endswith(".xlsx"):
        wb = load_workbook(uploaded_file, read_only=True, data_only=True)
        ws = wb.active
        headers = [
            str(c.value or "").strip().lower()
            for c in next(ws.iter_rows(min_row=1, max_row=1))
        ]
        try:
            i_name = headers.index("name")
            i_uwa = next(i for i, h in enumerate(headers) if h in ("uwa id", "uwa_id"))
        except Exception:
            raise ValueError("Missing required columns: Name and UWA ID")
        for row in ws.iter_rows(min_row=2):
            name = row[i_name].value
            uwa = row[i_uwa].value
            if name and uwa:
                yield {"name": str(name).strip(), "uwa_id": str(uwa).strip()}
    else:
        stream = (
            uploaded_file
            if isinstance(uploaded_file, TextIOWrapper)
            else TextIOWrapper(uploaded_file, encoding="utf-8")
        )
        reader = csv.DictReader(stream)
        cols = {(k or "").strip().lower(): k for k in (reader.fieldnames or [])}
        if "name" not in cols or not ({"uwa id", "uwa_id"} & set(cols)):
            raise ValueError("Missing required columns: Name and UWA ID")
        uwa_col = cols.get("uwa id") or cols.get("uwa_id")
        for r in reader:
            name, uwa = r.get(cols["name"]), r.get(uwa_col)
            if name and uwa:
                yield {"name": name.strip(), "uwa_id": uwa.strip()}
