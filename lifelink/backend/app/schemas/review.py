from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.user import UserPublic


class ReviewCreate(BaseModel):
    request_id: int
    reviewed_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)


class ReviewResponse(BaseModel):
    id: int
    reviewer: UserPublic
    reviewed_id: int
    request_id: int
    rating: int
    comment: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
