from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class RequestStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    ACEPTADA = "aceptada"
    RECHAZADA = "rechazada"
    CANCELADA = "cancelada"
    COMPLETADA = "completada"


class ContactRequest(Base):
    __tablename__ = "contact_requests"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    supply_id = Column(Integer, ForeignKey("supplies.id", ondelete="SET NULL"), nullable=True)

    status = Column(SQLEnum(RequestStatus), default=RequestStatus.PENDIENTE, index=True)
    message = Column(Text, nullable=True)
    response_message = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    responded_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_cr_sender_id", "sender_id"),
        Index("ix_cr_receiver_id", "receiver_id"),
        Index("ix_cr_sender_receiver", "sender_id", "receiver_id"),
    )

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_requests")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_requests")
    supply = relationship("Supply", back_populates="requests")
    messages = relationship("Message", backref="request", cascade="all, delete-orphan")
