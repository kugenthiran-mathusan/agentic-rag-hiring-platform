from pymongo import MongoClient
from pymongo.errors import PyMongoError
from app.core.config import settings

_client = None


def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
    return _client


def ping_mongo() -> bool:
    try:
        client = get_mongo_client()
        client.admin.command("ping")
        return True
    except PyMongoError:
        return False
