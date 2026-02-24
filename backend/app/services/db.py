from app.core.config import settings
from app.services.mongo import get_mongo_client

def get_db():
    client = get_mongo_client()
    return client[settings.MONGO_DB]

def jobs_col():
    return get_db()["jobs"]

def applications_col():
    return get_db()["applications"]

def ranking_results_col():
    return get_db()["ranking_results"]
