from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class NotificationType(str, enum.Enum):
    SOLICITUD_NUEVA = "solicitud_nueva"
    SOLICITUD_ACEPTADA = "solicitud_aceptada"
    SOLICITUD_RECHAZADA = "solicitud_rechazada"
    MENSAJE_NUEVO = "mensaje_nuevo"
    RESENA_NUEVA = "resena_nueva"
    SISTEMA = "sistema"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(SQLEnum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    link = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_notification_user_read", "user_id", "is_read"),
    )

    user = relationship("User", back_populates="notifications")
