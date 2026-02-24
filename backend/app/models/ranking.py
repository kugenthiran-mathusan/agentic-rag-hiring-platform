from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class RankedCandidate(BaseModel):
    application_id: str
    candidate_name: str
    rank: int
    total_score: float
    score_breakdown: Dict[str, float]
    label: str
    explanation_bullets: List[str]
    strengths: List[str] = []
    gaps: List[str] = []
    evidence_used: List[Dict[str, Any]] = []

class RankRunOut(BaseModel):
    job_id: str
    run_id: str
    created_at: datetime
    results: List[RankedCandidate]
