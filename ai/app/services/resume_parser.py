import pdfplumber # type: ignore
import os

def parse_resume_file(file_path: str) -> str:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    text = ""
    with pdfplumber.open(file_path) as pdf:
        for p in pdf.pages:
            text += p.extract_text() or ""

    return text.strip()