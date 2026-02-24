from bson import ObjectId

def oid_str(x) -> str:
    return str(x) if isinstance(x, ObjectId) else str(x)

def to_oid(id_str: str) -> ObjectId:
    return ObjectId(id_str)
