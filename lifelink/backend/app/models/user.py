from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DONANTE = "donante"
    SOLICITANTE = "solicitante"


class BloodType(str, enum.Enum):
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.SOLICITANTE, nullable=False)

    # Perfil
    avatar_url = Column(String(500), nullable=True)
    bio = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)

    # Donación de sangre
    blood_type = Column(SQLEnum(BloodType), nullable=True)
    is_blood_donor = Column(Boolean, default=False)

    # Estado
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # Calificación
    rating_avg = Column(Float, default=0.0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    supplies = relationship("Supply", back_populates="owner")
    sent_requests = relationship(
        "ContactRequest",
        foreign_keys="ContactRequest.sender_id",
        back_populates="sender"
    )
    received_requests = relationship(
        "ContactRequest",
        foreign_keys="ContactRequest.receiver_id",
        back_populates="receiver"
    )
    notifications = relationship("Notification", back_populates="user")
    reviews_given = relationship(
        "Review",
        foreign_keys="Review.reviewer_id",
        back_populates="reviewer"
    )
    reviews_received = relationship(
        "Review",
        foreign_keys="Review.reviewed_id",
        back_populates="reviewed"
    )
