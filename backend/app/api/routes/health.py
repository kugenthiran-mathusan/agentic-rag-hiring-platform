from fastapi import APIRouter
from app.core.config import settings
from app.services.mongo import ping_mongo
from app.services.qdrant import ping_qdrant

router = APIRouter()


@router.get("/health")
def health():
    return {
        "status": "ok",
        "env": settings.APP_ENV,
    }


@router.get("/ready")
async def ready():
    mongo_ok = ping_mongo()
    qdrant_ok = await ping_qdrant()

    status = "ready" if (mongo_ok and qdrant_ok) else "not_ready"
    return {
        "status": status,
        "mongo": mongo_ok,
        "qdrant": qdrant_ok,
    }
