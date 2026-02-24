import hashlib
import json

def make_fingerprint(jd_text: str, application_ids: list[str]) -> str:
    payload = {
        "jd": jd_text,
        "apps": sorted(application_ids),
    }
    raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()
