import httpx
from app.core.config import settings


async def ping_qdrant() -> bool:
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{settings.QDRANT_URL}/healthz")
            return r.status_code == 200
    except Exception:
        return False
