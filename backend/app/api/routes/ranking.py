from fastapi import APIRouter, HTTPException, Query
from app.models.ranking import RankRunOut
from app.services.ranking import run_ranking

router = APIRouter(prefix="/jobs", tags=["ranking"])

@router.post("/{job_id}/rank", response_model=RankRunOut)
def rank_candidates(
    job_id: str,
    per_candidate_k: int = Query(default=3, ge=1, le=8),
    top_k: int = Query(default=8, ge=1, le=20),
):
    try:
        doc = run_ranking(job_id=job_id, per_candidate_k=per_candidate_k, top_k=top_k)
        # Mongo returns _id; we ignore it
        return {
            "job_id": doc["job_id"],
            "run_id": doc["run_id"],
            "created_at": doc["created_at"],
            "results": doc["results"],
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Ranking failed. Please check logs.")
