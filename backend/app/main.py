from fastapi import FastAPI
from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import all_routers
from loguru import logger
from app.services.qdrant_client import ensure_collection
from app.rag.embeddings import get_embedder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

def create_app() -> FastAPI:
    setup_logging(settings.APP_ENV)

    app = FastAPI(
        title="Agentic RAG Hiring Platform",
        version="0.1.0",
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],   # ✅ allows OPTIONS too
        allow_headers=["*"],
    )

    for r in all_routers:
        app.include_router(r)

    # Serve uploaded CV files for HR preview/download.
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/storage", StaticFiles(directory=str(upload_dir)), name="storage")

    @app.on_event("startup")
    async def startup_event():
        logger.info("Backend starting up...")
        logger.info(f"ENV={settings.APP_ENV}")
        embedder = get_embedder()
        dim = embedder.get_sentence_embedding_dimension()
        ensure_collection(dim)
        logger.info(f"Qdrant collection ready: {dim} dims")

    return app


app = create_app()
