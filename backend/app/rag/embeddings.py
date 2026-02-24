from __future__ import annotations
from sentence_transformers import SentenceTransformer
import numpy as np

_model = None

def get_embedder() -> SentenceTransformer:
    global _model
    if _model is None:
        # fast + good for demo
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _model

def embed_texts(texts: list[str]) -> list[list[float]]:
    model = get_embedder()
    vecs = model.encode(texts, normalize_embeddings=True)
    if isinstance(vecs, np.ndarray):
        vecs = vecs.tolist()
    return vecs
