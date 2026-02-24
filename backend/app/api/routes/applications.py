from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from bson import ObjectId
from app.models.application import ApplicationOut
from app.services import applications as app_service
from app.utils.ids import oid_str, to_oid
from fastapi import BackgroundTasks
from app.rag.ingest_resume import ingest_application

router = APIRouter(tags=["applications"])

@router.post("/jobs/{job_id}/apply", response_model=ApplicationOut)
def apply_to_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    candidate_name: str = Form(...),
    candidate_email: str | None = Form(default=None),
    candidate_phone: str | None = Form(default=None),
    cv: UploadFile = File(...),
):
    try:
        doc = app_service.apply_to_job(
            
            to_oid(job_id),
            {
                "candidate_name": candidate_name,
                "candidate_email": candidate_email,
                "candidate_phone": candidate_phone,
            },
            cv
        )
        background_tasks.add_task(ingest_application, oid_str(doc["_id"]))

        return {
            "id": oid_str(doc["_id"]),
            "job_id": doc["job_id"],
            "candidate_name": doc["candidate_name"],
            "candidate_email": doc.get("candidate_email"),
            "cv_file_url": doc["cv_file_url"],
            "cv_file_type": doc["cv_file_type"],
            "processing_status": doc["processing_status"],
            "submitted_at": doc["submitted_at"],
            "error_message": doc.get("error_message"),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/jobs/{job_id}/applications", response_model=list[ApplicationOut])
def list_applications(job_id: str):
    docs = app_service.list_applications(job_id)
    return [{
        "id": oid_str(d["_id"]),
        "job_id": d["job_id"],
        "candidate_name": d["candidate_name"],
        "candidate_email": d.get("candidate_email"),
        "cv_file_url": d["cv_file_url"],
        "cv_file_type": d["cv_file_type"],
        "processing_status": d["processing_status"],
        "submitted_at": d["submitted_at"],
        "error_message": d.get("error_message"),
    } for d in docs]
