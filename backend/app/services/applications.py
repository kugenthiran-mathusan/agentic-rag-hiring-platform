import os
import uuid
from datetime import datetime
from bson import ObjectId
from fastapi import UploadFile
from app.core.config import settings
from app.services.db import applications_col, jobs_col
from app.utils.files import validate_cv_file

def ensure_upload_dir():
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "cvs"), exist_ok=True)

def save_cv_file(job_id: str, file: UploadFile) -> tuple[str, str]:
    # returns (file_url/path, file_type)
    file_type = validate_cv_file(file)  # pdf/docx
    ensure_upload_dir()

    safe_name = f"{job_id}_{uuid.uuid4().hex}.{file_type}"
    path = os.path.join(settings.UPLOAD_DIR, "cvs", safe_name)

    with open(path, "wb") as f:
        f.write(file.file.read())

    # For demo: store local path as "cv_file_url"
    return path, file_type

def apply_to_job(job_oid: ObjectId, form: dict, file: UploadFile) -> dict:
    job = jobs_col().find_one({"_id": job_oid})
    if not job:
        raise ValueError("Job not found.")
    if job["status"] != "open":
        raise ValueError("Applications are closed for this job.")

    cv_path, cv_type = save_cv_file(str(job_oid), file)

    doc = {
        "job_id": str(job_oid),
        "candidate_name": form["candidate_name"],
        "candidate_email": form.get("candidate_email"),
        "candidate_phone": form.get("candidate_phone"),
        "cv_file_url": cv_path,
        "cv_file_type": cv_type,
        "processing_status": "submitted",
        "submitted_at": datetime.utcnow(),
        "error_message": None,
    }
    res = applications_col().insert_one(doc)
    doc["_id"] = res.inserted_id
    return doc

def list_applications(job_id: str) -> list[dict]:
    return list(applications_col().find({"job_id": job_id}).sort("submitted_at", -1))
