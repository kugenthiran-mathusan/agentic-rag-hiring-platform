from app.services.db import jobs_col, applications_col

def ensure_indexes():
    jobs_col().create_index([("status", 1), ("created_at", -1)])
    applications_col().create_index([("job_id", 1), ("submitted_at", -1)])
    applications_col().create_index([("job_id", 1), ("candidate_email", 1)])
