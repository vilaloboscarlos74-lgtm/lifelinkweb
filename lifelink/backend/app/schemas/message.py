from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MessageCreate(BaseModel):
    request_id: int
    content: str = Field(..., min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: int
    request_id: int
    sender_id: int
    content: str
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConversationUser(BaseModel):
    id: int
    username: str
    full_name: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    request_id: int
    other_user: ConversationUser
    last_message: Optional[str] = None
    last_message_at: Optional[str] = None
    unread_count: int = 0
