"""
Generate Python code and intermediate mapping from column mapping to translate data to ontology.
"""
from src.services.upload import get_upload, get_mapping


def generate(upload_id: str) -> dict:
    """
    Produce Python code and intermediate mapping JSON to transform the data file into ontology-based RDF/triples.
    """
    upload = get_upload(upload_id)
    mapping = get_mapping(upload_id)
    if not upload:
        raise ValueError("Upload not found")
    if not mapping:
        raise ValueError("No mapping saved; save mapping in Step 2 first")

    columns = upload["columns"]
    # Build intermediate mapping structure: list of { column, mapping_type, ontology_term }
    intermediate = {
        "source_columns": columns,
        "mappings": mapping,
    }

    # Generate Python code that uses the mapping to produce triples (skeleton)
    code = _generate_python_code(mapping, upload.get("data_path", "data.csv"))

    return {
        "python_code": code,
        "intermediate_mapping": intermediate,
    }


def _generate_python_code(mapping: list[dict], data_path: str) -> str:
    """Generate a Python script that reads the data file and emits triples from the mapping."""
    lines = [
        '"""',
        "Generated script: map data file to ontology using the configured mapping.",
        '"""',
        "import pandas as pd",
        "",
        "DATA_PATH = " + repr(data_path),
        "MAPPING = " + repr(mapping),
        "",
        "",
        "def main():",
        "    df = pd.read_csv(DATA_PATH) if DATA_PATH.endswith('.csv') else pd.read_excel(DATA_PATH)",
        "    # Build triples from each row using MAPPING",
        "    triples = []",
        "    for _, row in df.iterrows():",
        "        subject_uri = None  # Derive from entity column(s)",
        "        for m in MAPPING:",
        "            col = m.get('column')",
        "            mtype = m.get('mapping_type')",
        "            term = m.get('ontology_term')",
        "            if col not in row or not term:",
        "                continue",
        "            value = row[col]",
        "            if mtype == 'entity':",
        "                subject_uri = value  # Or mint URI from value",
        "            elif mtype == 'property':",
        "                triples.append((subject_uri, term, value))",
        "            elif mtype == 'object_property':",
        "                triples.append((subject_uri, term, value))",
        "        # Append subject type triple if entity mapping exists",
        "    return triples",
        "",
        "",
        "if __name__ == '__main__':",
        "    triples = main()",
        "    for t in triples:",
        "        print(t)",
    ]
    return "\n".join(lines)
