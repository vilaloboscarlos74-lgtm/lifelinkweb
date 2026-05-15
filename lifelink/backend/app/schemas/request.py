from pydantic import BaseModel, field_validator
from typing import Optional, Literal
from datetime import datetime
from app.models.request import RequestStatus
from app.schemas.user import UserPublic


class RequestCreate(BaseModel):
    receiver_id: int
    supply_id: Optional[int] = None
    message: Optional[str] = None


class RequestRespond(BaseModel):
    # Solo se puede aceptar o rechazar — no PENDIENTE, CANCELADA ni COMPLETADA
    status: Literal[RequestStatus.ACEPTADA, RequestStatus.RECHAZADA]
    response_message: Optional[str] = None


class RequestResponse(BaseModel):
    id: int
    sender: UserPublic
    receiver: UserPublic
    supply_id: Optional[int] = None
    status: RequestStatus
    message: Optional[str] = None
    response_message: Optional[str] = None
    created_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None

    class Config:
        from_attributes = True
