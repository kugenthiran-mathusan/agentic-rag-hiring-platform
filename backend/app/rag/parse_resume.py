from __future__ import annotations
import io
import re
from pathlib import Path
import pdfplumber
import fitz  # PyMuPDF
from docx import Document

def _clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def extract_text_from_pdf(path: str) -> str:
    # Try pdfplumber first (good for many PDFs)
    try:
        chunks = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                t = page.extract_text() or ""
                if t.strip():
                    chunks.append(t)
        text = "\n".join(chunks)
        if text.strip():
            return _clean_text(text)
    except Exception:
        pass

    # Fallback PyMuPDF
    doc = fitz.open(path)
    parts = []
    for page in doc:
        parts.append(page.get_text("text") or "")
    return _clean_text("\n".join(parts))

def extract_text_from_docx(path: str) -> str:
    doc = Document(path)
    parts = [p.text for p in doc.paragraphs if p.text and p.text.strip()]
    return _clean_text("\n".join(parts))

def extract_resume_text(path: str, file_type: str) -> str:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"CV file not found: {path}")

    file_type = file_type.lower()
    if file_type == "pdf":
        return extract_text_from_pdf(str(p))
    if file_type == "docx":
        return extract_text_from_docx(str(p))

    raise ValueError("Unsupported file type. Only pdf/docx.")
