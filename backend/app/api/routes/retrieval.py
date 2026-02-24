from fastapi import APIRouter, HTTPException, Query
from app.models.retrieval import EvidencePackOut
from app.services.jobs import get_job
from app.utils.ids import to_oid, oid_str
from app.rag.retriever import retrieve_evidence_for_job

router = APIRouter(prefix="/jobs", tags=["retrieval"])

@router.get("/{job_id}/evidence", response_model=EvidencePackOut)
def get_evidence(
    job_id: str,
    per_candidate_k: int = Query(default=3, ge=1, le=8),
    top_k: int = Query(default=5, ge=1, le=20),
):
    job = get_job(to_oid(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    jd_text = job["jd_text"]
    evidence = retrieve_evidence_for_job(
        job_id=job_id,
        jd_text=jd_text,
        top_k=top_k,
        per_candidate_k=per_candidate_k
    )

    return {
        "job_id": job_id,
        "per_candidate_k": per_candidate_k,
        "evidence": evidence
    }
