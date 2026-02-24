from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class EvidenceItem(BaseModel):
    chunk_index: Optional[int] = None
    chunk_text: str
    score: float

class EvidencePackOut(BaseModel):
    job_id: str
    per_candidate_k: int
    evidence: Dict[str, List[EvidenceItem]]  # application_id -> evidence list
