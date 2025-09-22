import csv
from typing import List, Tuple, IO, Sequence
from openpyxl import load_workbook


# Common column names
NAME_COL = "Name"
UID_COL = "UserID"


def parse_xlsx(file: IO[bytes], columns: Sequence[str]) -> List[Tuple[int, ...]]:
    """
    Parse an .xlsx file and return rows as (row_index, ...columns...).
    Example: parse_xlsx(file, [UID_COL, NAME_COL])
    """
    ws = load_workbook(file, read_only=True, data_only=True).active
    headers = next(ws.iter_rows(min_row=1, max_row=1, values_only=True))

    idxs = [headers.index(col) for col in columns]

    return [
        (row_idx, *(str(row[i]).strip() for i in idxs))
        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2)
    ]


def parse_csv(file: IO[bytes], columns: Sequence[str]) -> List[Tuple[int, ...]]:
    """
    Parse a .csv file and return rows as (row_index, ...columns...).
    Example: parse_csv(file, [UID_COL, NAME_COL])
    """
    reader = csv.DictReader(file.read().decode("utf-8").splitlines())
    return [
        (row_idx, *(row[col].strip() for col in columns))
        for row_idx, row in enumerate(reader, start=2)  # start=2 for consistency with Excel
    ]
