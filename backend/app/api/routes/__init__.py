from .health import router as health_router
from .jobs import router as jobs_router
from .applications import router as applications_router
from .retrieval import router as retrieval_router
from .ranking import router as ranking_router
from .rank_history import router as rank_history_router

all_routers = [
    health_router,
    jobs_router,
    applications_router,
    retrieval_router,
    ranking_router,
    rank_history_router,
]
