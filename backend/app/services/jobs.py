from datetime import datetime
from app.services.db import applications_col, jobs_col, ranking_results_col
from bson import ObjectId
from app.utils.ids import oid_str

def create_job(hr_id: str, data: dict) -> dict:
    doc = {
        "hr_id": hr_id,
        "title": data["title"],
        "jd_text": data["jd_text"],
        "company": data.get("company"),
        "location": data.get("location"),
        "status": "open",
        "created_at": datetime.utcnow(),
        "closed_at": None,
    }
    res = jobs_col().insert_one(doc)
    doc["_id"] = res.inserted_id
    return doc

def list_open_jobs() -> list[dict]:
    return list(jobs_col().find({"status": "open"}).sort("created_at", -1))

def get_job(job_id: ObjectId) -> dict | None:
    return jobs_col().find_one({"_id": job_id})

def close_job(job_id: ObjectId) -> bool:
    res = jobs_col().update_one(
        {"_id": job_id, "status": "open"},
        {"$set": {"status": "closed", "closed_at": datetime.utcnow()}}
    )
    return res.modified_count == 1

def delete_closed_job(job_id: ObjectId) -> bool:
    job = jobs_col().find_one({"_id": job_id}, {"status": 1})
    if not job or job.get("status") != "closed":
        return False

    job_id_str = str(job_id)

    ranking_results_col().delete_many({"job_id": job_id_str})
    applications_col().delete_many({"job_id": job_id_str})
    res = jobs_col().delete_one({"_id": job_id, "status": "closed"})
    return res.deleted_count == 1
