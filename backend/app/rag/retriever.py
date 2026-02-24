from __future__ import annotations
from collections import defaultdict

from app.core.config import settings
from app.rag.embeddings import embed_texts
from app.services.qdrant_client import get_qdrant

from qdrant_client.models import Filter, FieldCondition, MatchValue


def retrieve_evidence_for_job(
    job_id: str,
    jd_text: str,
    top_k: int = 5,
    per_candidate_k: int = 3
):
    """
    Returns evidence grouped per application_id:
    {
      "application_id": [
         {"chunk_index":..., "chunk_text":..., "score":...},
         ...
      ]
    }
    """
    qdrant = get_qdrant()
    jd_vector = embed_texts([jd_text])[0]

    qfilter = Filter(
        must=[
            FieldCondition(
                key="job_id",
                match=MatchValue(value=job_id),
            )
        ]
    )

    res = qdrant.query_points(
        collection_name=settings.QDRANT_COLLECTION,
        query=jd_vector,
        query_filter=qfilter,
        limit=top_k * 50,
        with_payload=True,
        with_vectors=False,
    )

    hits = getattr(res, "points", res)  # safety: some setups return list directly

    grouped = defaultdict(list)

    for h in hits:
        payload = getattr(h, "payload", None) or {}
        app_id = payload.get("application_id")
        if not app_id:
            continue

        grouped[app_id].append({
            "chunk_index": payload.get("chunk_index"),
            "chunk_text": payload.get("chunk_text", ""),
            "score": float(getattr(h, "score", 0.0)),
        })

    evidence_pack = {}
    for app_id, items in grouped.items():
        items_sorted = sorted(items, key=lambda x: x["score"], reverse=True)
        evidence_pack[app_id] = items_sorted[:per_candidate_k]

    return evidence_pack
