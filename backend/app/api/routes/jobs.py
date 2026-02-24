from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.models.job import JobCreate, JobOut
from app.services import jobs as job_service
from app.services.db import jobs_col
from app.utils.ids import oid_str, to_oid

router = APIRouter(prefix="/jobs", tags=["jobs"])

# Demo HR id (later replace with real auth)
DEMO_HR_ID = "hr_demo_001"

@router.post("", response_model=JobOut)
def create_job(payload: JobCreate):
    doc = job_service.create_job(DEMO_HR_ID, payload.model_dump())
    return {
        "id": oid_str(doc["_id"]),
        "title": doc["title"],
        "jd_text": doc["jd_text"],
        "company": doc.get("company"),
        "location": doc.get("location"),
        "status": doc["status"],
        "created_at": doc["created_at"],
        "closed_at": doc.get("closed_at"),
    }

@router.get("", response_model=list[JobOut])
def list_jobs():
    docs = job_service.list_open_jobs()
    return [{
        "id": oid_str(d["_id"]),
        "title": d["title"],
        "jd_text": d["jd_text"],
        "company": d.get("company"),
        "location": d.get("location"),
        "status": d["status"],
        "created_at": d["created_at"],
        "closed_at": d.get("closed_at"),
    } for d in docs]

@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: str):
    doc = job_service.get_job(to_oid(job_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": oid_str(doc["_id"]),
        "title": doc["title"],
        "jd_text": doc["jd_text"],
        "company": doc.get("company"),
        "location": doc.get("location"),
        "status": doc["status"],
        "created_at": doc["created_at"],
        "closed_at": doc.get("closed_at"),
    }

@router.patch("/{job_id}/close")
def close_job(job_id: str):
    ok = job_service.close_job(to_oid(job_id))
    if not ok:
        raise HTTPException(status_code=400, detail="Job not found or already closed")
    return {"status": "closed", "job_id": job_id}

@router.delete("/{job_id}")
def delete_job(job_id: str):
    ok = job_service.delete_closed_job(to_oid(job_id))
    if not ok:
        raise HTTPException(status_code=400, detail="Job not found or job must be closed before deletion")
    return {"status": "deleted", "job_id": job_id}


@router.get("/hr/jobs")
def list_jobs_for_hr():
    jobs = list(jobs_col().find().sort("created_at", -1))

    out = []
    for j in jobs:
        out.append({
            "id": str(j["_id"]),
            "title": j["title"],
            "company": j.get("company"),
            "location": j.get("location"),
            "status": j["status"],
            "created_at": j["created_at"],
        })

    return out
