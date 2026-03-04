"""
Handle file uploads: store in temp and parse data file columns.
"""
import os
import uuid
from pathlib import Path
from io import StringIO

import pandas as pd
from fastapi import UploadFile

UPLOAD_DIR = Path(os.environ.get("KGM_UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "uploads")))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# In-memory store: upload_id -> { columns, data_path, ontology_path, ontology_preview }
_uploads: dict[str, dict] = {}
# upload_id -> list of { column, mapping_type, ontology_term }
_mappings: dict[str, list] = {}


def _read_columns_from_file(path: Path, filename: str) -> list[str]:
    """Read column names from CSV or Excel file."""
    ext = Path(filename).suffix.lower()
    if ext == ".csv":
        df = pd.read_csv(path, nrows=0)
    elif ext in (".xlsx", ".xls"):
        df = pd.read_excel(path, nrows=0)
    else:
        raise ValueError(f"Unsupported data file type: {ext}")
    return list(df.columns)


async def save_upload(data_file: UploadFile, ontology_file: UploadFile) -> dict:
    """
    Save uploaded files and return upload_id, columns, and ontology preview.
    """
    upload_id = str(uuid.uuid4())
    data_path = UPLOAD_DIR / f"{upload_id}_data{Path(data_file.filename or 'data').suffix}"
    ontology_path = UPLOAD_DIR / f"{upload_id}_ontology{Path(ontology_file.filename or 'ont').suffix}"

    with open(data_path, "wb") as f:
        f.write(await data_file.read())
    with open(ontology_path, "wb") as f:
        f.write(await ontology_file.read())

    columns = _read_columns_from_file(data_path, data_file.filename or "data.csv")
    ontology_preview = _read_ontology_preview(ontology_path)

    _uploads[upload_id] = {
        "columns": columns,
        "data_path": str(data_path),
        "ontology_path": str(ontology_path),
        "ontology_preview": ontology_preview,
    }
    return {
        "upload_id": upload_id,
        "columns": columns,
        "ontology_preview": ontology_preview,
    }


def _read_ontology_preview(path: Path, max_chars: int = 30000) -> str:
    """Read ontology file as text for LLM (truncated)."""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read(max_chars)
    except Exception:
        with open(path, "rb") as f:
            return f.read(max_chars).decode("utf-8", errors="replace")


def get_upload(upload_id: str) -> dict | None:
    return _uploads.get(upload_id)


def save_mapping(upload_id: str, mapping: list[dict]) -> None:
    _mappings[upload_id] = mapping


def get_mapping(upload_id: str) -> list[dict] | None:
    return _mappings.get(upload_id)


def get_data_preview(upload_id: str, max_rows: int = 50, max_chars: int = 30000) -> str:
    """
    Return a text preview of the uploaded data file.

    - For CSV: first max_chars of the file.
    - For Excel: first max_rows converted to CSV text.
    """
    upload = get_upload(upload_id)
    if not upload:
        raise ValueError("Upload not found")

    data_path = Path(upload["data_path"])
    ext = data_path.suffix.lower()

    if ext == ".csv":
        with open(data_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read(max_chars)
    elif ext in (".xlsx", ".xls"):
        df = pd.read_excel(data_path, nrows=max_rows)
        buf = StringIO()
        df.to_csv(buf, index=False)
        text = buf.getvalue()
        return text[:max_chars]
    else:
        raise ValueError(f"Preview not supported for data file type: {ext}")


def get_ontology_preview(upload_id: str, max_chars: int = 30000) -> str:
    """
    Return a text preview of the uploaded ontology file.
    """
    upload = get_upload(upload_id)
    if not upload:
        raise ValueError("Upload not found")

    # Prefer cached preview, but recompute if missing.
    preview = upload.get("ontology_preview")
    if preview:
        return preview[:max_chars]

    ontology_path = Path(upload["ontology_path"])
    preview = _read_ontology_preview(ontology_path, max_chars=max_chars)
    upload["ontology_preview"] = preview
    return preview
