from fastapi import APIRouter, HTTPException
from app.services.db import ranking_results_col

router = APIRouter(prefix="/jobs", tags=["ranking-history"])

@router.get("/{job_id}/ranking/runs")
def list_runs(job_id: str):
    runs = list(
        ranking_results_col()
        .find({"job_id": job_id}, {"results": 0})  # exclude big results list
        .sort("created_at", -1)
        .limit(20)
    )
    # convert _id to string
    for r in runs:
        r["id"] = str(r.pop("_id"))
    return {"job_id": job_id, "runs": runs}

@router.get("/{job_id}/ranking/latest")
def latest_run(job_id: str):
    run = ranking_results_col().find_one({"job_id": job_id}, sort=[("created_at", -1)])
    if not run:
        raise HTTPException(status_code=404, detail="No ranking run found for this job")
    run["id"] = str(run.pop("_id"))
    return run
