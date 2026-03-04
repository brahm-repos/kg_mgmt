"""
API routes for the Knowledge Graph Management workbench.
"""
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from src.services.upload import (
    get_data_preview,
    get_mapping,
    get_ontology_preview,
    get_upload,
    save_mapping,
)
from src.services.gemini import suggest_mapping
from src.services.generate import generate as generate_code_and_mapping
from src.services.upload import save_upload

router = APIRouter()


@router.get("/info")
def api_info():
    """Return API information."""
    return {
        "name": "Knowledge Graph Management API",
        "version": "0.1.0",
        "endpoints": ["/api/info", "/api/health", "/api/upload", "/api/mapping/suggest", "/api/mapping", "/api/generate"],
    }


@router.get("/health")
def api_health():
    """API-level health check."""
    return {"status": "ok"}


@router.post("/upload")
async def upload_files(
    data_file: UploadFile = File(..., description="CSV or Excel data file"),
    ontology_file: UploadFile = File(..., description="Ontology file (e.g. RDF, OWL, Turtle)"),
):
    """Upload data file and ontology; returns upload_id, columns, and ontology preview."""
    if not data_file.filename and not ontology_file.filename:
        raise HTTPException(400, "data_file and ontology_file required")
    allowed_data = {".csv", ".xlsx", ".xls"}
    allowed_ont = {".rdf", ".owl", ".ttl", ".xml", ".json", ".jsonld", ".n3", ".nt"}
    dext = (data_file.filename or "").lower()
    dext = "." + dext.split(".")[-1] if "." in dext else ""
    oext = (ontology_file.filename or "").lower()
    oext = "." + oext.split(".")[-1] if "." in oext else ""
    if dext not in allowed_data:
        raise HTTPException(400, f"Data file must be CSV or Excel; got {dext or 'unknown'}")
    try:
        result = await save_upload(data_file, ontology_file)
        return result
    except Exception as e:
        raise HTTPException(422, str(e))


class SuggestMappingBody(BaseModel):
    upload_id: str


@router.post("/mapping/suggest")
def mapping_suggest(body: SuggestMappingBody):
    """Use Gemini to suggest column-to-ontology mapping for the given upload."""
    try:
        mapping = suggest_mapping(body.upload_id)
        return {"mapping": mapping}
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


class MappingRow(BaseModel):
    column: str
    mapping_type: str
    ontology_term: str


class SaveMappingBody(BaseModel):
    upload_id: str
    mapping: list[MappingRow]


@router.post("/mapping")
def save_mapping_route(body: SaveMappingBody):
    """Save the user-edited mapping to the server."""
    if not get_upload(body.upload_id):
        raise HTTPException(404, "Upload not found")
    save_mapping(body.upload_id, [m.model_dump() for m in body.mapping])
    return {"status": "saved"}


class GenerateBody(BaseModel):
    upload_id: str


@router.post("/generate")
def generate_route(body: GenerateBody):
    """Generate Python code and intermediate mapping from the saved mapping (Step 3)."""
    try:
        result = generate_code_and_mapping(body.upload_id)
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))


class PreviewBody(BaseModel):
    upload_id: str


@router.post("/preview/data")
def preview_data(body: PreviewBody):
    """Return a text preview of the uploaded data file (CSV/Excel)."""
    if not get_upload(body.upload_id):
        raise HTTPException(404, "Upload not found")
    try:
        content = get_data_preview(body.upload_id)
        return {"content": content}
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/preview/ontology")
def preview_ontology(body: PreviewBody):
    """Return a text preview of the uploaded ontology file."""
    if not get_upload(body.upload_id):
        raise HTTPException(404, "Upload not found")
    try:
        content = get_ontology_preview(body.upload_id)
        return {"content": content}
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))
