from __future__ import annotations
from qdrant_client import QdrantClient
from qdrant_client.http.models import VectorParams, Distance
from app.core.config import settings

_client = None

def get_qdrant() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(url=settings.QDRANT_URL)
    return _client

def ensure_collection(vector_size: int):
    client = get_qdrant()
    collections = client.get_collections().collections
    names = {c.name for c in collections}
    if settings.QDRANT_COLLECTION not in names:
        client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
        )
