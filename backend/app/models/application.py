from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal
from datetime import datetime

class ApplyCreate(BaseModel):
    candidate_name: str = Field(min_length=2, max_length=80)
    candidate_email: Optional[EmailStr] = None
    candidate_phone: Optional[str] = Field(default=None, max_length=30)

class ApplicationOut(BaseModel):
    id: str
    job_id: str
    candidate_name: str
    candidate_email: Optional[str] = None
    cv_file_url: str
    cv_file_type: Literal["pdf", "docx"]
    processing_status: Literal["submitted","parsed","embedded","ranked","failed"]
    submitted_at: datetime
    error_message: Optional[str] = None
