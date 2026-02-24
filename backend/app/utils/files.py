import os
from fastapi import UploadFile

ALLOWED_EXTS = {".pdf", ".docx"}

def validate_cv_file(file: UploadFile) -> str:
    filename = (file.filename or "").lower()
    ext = os.path.splitext(filename)[1]
    if ext not in ALLOWED_EXTS:
        raise ValueError("Only PDF or DOCX files are allowed.")
    return ext.lstrip(".")  # "pdf" or "docx"
