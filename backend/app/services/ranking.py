from __future__ import annotations

from datetime import datetime
import uuid
from bson import ObjectId

from app.core.config import settings
from app.services.db import jobs_col, applications_col, ranking_results_col
from app.rag.retriever import retrieve_evidence_for_job
from app.rag.evaluator import evaluate_candidate_with_gemini, EVAL_PROMPT_VERSION
from app.utils.fingerprint import make_fingerprint


def _mark_ranked_applications(job_id: str, run_id: str, app_ids: list[str]) -> None:
    if not app_ids:
        return

    applications_col().update_many(
        {
            "job_id": job_id,
            "_id": {"$in": [ObjectId(app_id) for app_id in app_ids]},
            "processing_status": {"$in": ["embedded", "ranked"]},
        },
        {"$set": {"processing_status": "ranked", "ranked_at": datetime.utcnow(), "latest_run_id": run_id}},
    )


def run_ranking(job_id: str, per_candidate_k: int = 3, top_k: int = 8):
    # 1) Load job (JD)
    job = jobs_col().find_one({"_id": ObjectId(job_id)})
    if not job:
        raise ValueError("Job not found.")

    jd_text = job.get("jd_text", "") or ""
    if not jd_text.strip():
        raise ValueError("Job description (jd_text) is empty.")

    # 2) Load embedded applications (RAG-ready)
    apps = list(applications_col().find({
        "job_id": job_id,
        "processing_status": {"$in": ["embedded", "ranked"]}
    }))

    app_ids = [str(a["_id"]) for a in apps]

    # 3) Fingerprint for idempotency (JD + embedded app ids)
    fingerprint = make_fingerprint(jd_text, app_ids)

    # 4) Return cached latest run if nothing changed
    latest = ranking_results_col().find_one(
        {"job_id": job_id},
        sort=[("created_at", -1)]
    )
    if latest and latest.get("fingerprint") == fingerprint:
        cached_app_ids = [r.get("application_id") for r in latest.get("results", []) if r.get("application_id")]
        _mark_ranked_applications(job_id=job_id, run_id=latest.get("run_id", ""), app_ids=cached_app_ids)
        return latest

    # 5) Retrieve evidence from Qdrant (JD -> chunks per application)
    evidence_pack = retrieve_evidence_for_job(
        job_id=job_id,
        jd_text=jd_text,
        top_k=top_k,
        per_candidate_k=per_candidate_k,
    )

    # 6) Evaluate each candidate with Gemini
    results = []
    for a in apps:
        app_id = str(a["_id"])
        candidate_name = a.get("candidate_name", "Unknown Candidate")

        evidence_items = evidence_pack.get(app_id, [])

        eval_out = evaluate_candidate_with_gemini(
            jd_text=jd_text,
            candidate_name=candidate_name,
            evidence_items=evidence_items,
            model=settings.GEMINI_MODEL,
        )

        # ensure numeric
        total_score = float(eval_out.get("total_score", 0))

        results.append({
            "application_id": app_id,
            "candidate_name": candidate_name,
            "total_score": total_score,
            "score_breakdown": eval_out.get("score_breakdown", {"skills": 0, "experience": 0, "role_fit": 0}),
            "label": eval_out.get("label", "Weak Fit"),
            "strengths": eval_out.get("strengths", []),
            "gaps": eval_out.get("gaps", []),
            "explanation_bullets": eval_out.get("explanation_bullets", []),
            "evidence_used": eval_out.get("evidence_used", []),
        })

    # 7) Sort + assign ranks
    results.sort(key=lambda x: x["total_score"], reverse=True)
    for i, r in enumerate(results, start=1):
        r["rank"] = i

    # 8) Store run (audit trail)
    run_id = uuid.uuid4().hex
    run_doc = {
        "job_id": job_id,
        "run_id": run_id,
        "created_at": datetime.utcnow(),
        "per_candidate_k": per_candidate_k,
        "top_k": top_k,
        "llm_provider": "gemini",
        "model": settings.GEMINI_MODEL,
        "prompt_version": EVAL_PROMPT_VERSION,
        "fingerprint": fingerprint,
        "results": results,
    }
    ranking_results_col().insert_one(run_doc)

    # 9) Update applications status -> ranked (only those we ranked)
    ranked_app_ids = [r["application_id"] for r in results if r.get("application_id")]
    _mark_ranked_applications(job_id=job_id, run_id=run_id, app_ids=ranked_app_ids)

    return run_doc
