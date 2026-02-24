from __future__ import annotations
from datetime import datetime
from qdrant_client.http.models import PointStruct
from app.services.db import applications_col
from app.services.qdrant_client import get_qdrant
from app.core.config import settings
from app.rag.parse_resume import extract_resume_text
from app.rag.chunking import chunk_text
from app.rag.embeddings import embed_texts
import uuid


def ingest_application(application_id: str):
    col = applications_col()
    app_doc = col.find_one({"_id": __import__("bson").ObjectId(application_id)})
    if not app_doc:
        return

    try:
        # 1) Parse
        resume_text = extract_resume_text(app_doc["cv_file_url"], app_doc["cv_file_type"])
        col.update_one(
            {"_id": app_doc["_id"]},
            {"$set": {"processing_status": "parsed", "resume_text": resume_text}}
        )

        # 2) Chunk
        chunks = chunk_text(resume_text)
        if not chunks:
            raise ValueError("Resume text is empty after parsing.")

        # 3) Embed
        texts = [c.text for c in chunks]
        vectors = embed_texts(texts)

        # 4) Upsert into Qdrant
        qdrant = get_qdrant()
        points = []
        for c, v in zip(chunks, vectors):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{application_id}:{c.chunk_index}"))
            points.append(
                PointStruct(
                    id=point_id,
                    vector=v,
                    payload={
                        "job_id": app_doc["job_id"],
                        "application_id": application_id,
                        "candidate_name": app_doc["candidate_name"],
                        "chunk_index": c.chunk_index,
                        "chunk_text": c.text,
                    },
                )
            )

        qdrant.upsert(collection_name=settings.QDRANT_COLLECTION, points=points)

        # 5) Update status
        col.update_one(
            {"_id": app_doc["_id"]},
            {"$set": {
                "processing_status": "embedded",
                "chunks_count": len(chunks),
                "embedded_at": datetime.utcnow(),
            }}
        )

    except Exception as e:
        col.update_one(
            {"_id": app_doc["_id"]},
            {"$set": {"processing_status": "failed", "error_message": str(e)}}
        )
