"""
Use Google Gemini to suggest column-to-ontology mapping.
"""
import json
import os
import re

from src.services.upload import get_upload


def _get_client():
    try:
        from google import genai

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        client = genai.Client(api_key=api_key)
        return client
    except ImportError:
        raise ImportError("Install google-genai: pip install google-genai")


def suggest_mapping(upload_id: str) -> list[dict]:
    """
    Call Gemini to suggest for each data column: mapping_type (entity | property | object_property)
    and ontology_term (URI or label). Returns list of { column, mapping_type, ontology_term }.
    """
    upload = get_upload(upload_id)
    if not upload:
        raise ValueError("Upload not found")

    columns = upload["columns"]
    ontology_preview = upload["ontology_preview"]

    client = _get_client()
    prompt = f"""You are an expert in ontologies and knowledge graphs. Given:
1) A list of column names from a data source (CSV/Excel): {json.dumps(columns)}
2) An ontology file content (excerpt): 
{ontology_preview[:25000]}

For each column, suggest a mapping to the ontology:
- mapping_type: one of "entity" (class/type), "property" (data property), "object_property" (relation to another entity)
- ontology_term: the best-matching class URI, property URI, or relation URI from the ontology (use the actual URI or a compact form like prefix:LocalName)

Respond with a JSON array only, no markdown or explanation. Each element: {{ "column": "<name>", "mapping_type": "entity"|"property"|"object_property", "ontology_term": "<uri or term>" }}
Example: [{{ "column": "name", "mapping_type": "property", "ontology_term": "http://schema.org/name" }}]
"""

    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=prompt,
    )
    text = (response.text or "").strip()
    # Strip markdown code block if present
    if text.startswith("```"):
        text = re.sub(r"^```\w*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)
    try:
        mapping = json.loads(text)
    except json.JSONDecodeError:
        # Try to extract first JSON array
        match = re.search(r"\[[\s\S]*\]", text)
        if match:
            mapping = json.loads(match.group(0))
        else:
            raise ValueError(f"Gemini did not return valid JSON: {text[:500]}")
    if not isinstance(mapping, list):
        mapping = [mapping]
    # Normalize to have all columns
    by_col = {m.get("column", ""): m for m in mapping}
    result = []
    for col in columns:
        m = by_col.get(col, {})
        result.append({
            "column": col,
            "mapping_type": m.get("mapping_type") or "property",
            "ontology_term": m.get("ontology_term") or "",
        })
    return result
