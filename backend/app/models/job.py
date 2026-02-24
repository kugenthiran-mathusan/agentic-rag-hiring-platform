from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class JobCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    jd_text: str = Field(min_length=50)
    company: Optional[str] = Field(default=None, max_length=120)
    location: Optional[str] = Field(default=None, max_length=120)

class JobOut(BaseModel):
    id: str
    title: str
    jd_text: str
    company: Optional[str] = None
    location: Optional[str] = None
    status: Literal["open", "closed"]
    created_at: datetime
    closed_at: Optional[datetime] = None
