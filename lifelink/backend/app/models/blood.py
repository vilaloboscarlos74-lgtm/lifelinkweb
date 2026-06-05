from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
    ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class BloodDonorRecord(Base):
    """Expediente médico del donante de sangre."""
    __tablename__ = "blood_donor_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Datos físicos
    weight_kg = Column(Float, nullable=True)
    birth_date = Column(DateTime(timezone=True), nullable=True)

    # Exclusiones permanentes (NOM-253-SSA1-2012)
    has_hiv = Column(Boolean, default=False, nullable=False)
    has_hepatitis_b = Column(Boolean, default=False, nullable=False)
    has_hepatitis_c = Column(Boolean, default=False, nullable=False)
    has_sifilis = Column(Boolean, default=False, nullable=False)
    has_chagas = Column(Boolean, default=False, nullable=False)
    has_cancer = Column(Boolean, default=False, nullable=False)
    has_diabetes_insulin = Column(Boolean, default=False, nullable=False)
    has_epilepsy = Column(Boolean, default=False, nullable=False)

    # Exclusiones temporales
    had_recent_tattoo = Column(Boolean, default=False, nullable=False)
    had_recent_piercing = Column(Boolean, default=False, nullable=False)
    is_pregnant = Column(Boolean, default=False, nullable=False)
    had_recent_surgery = Column(Boolean, default=False, nullable=False)
    is_breastfeeding = Column(Boolean, default=False, nullable=False)

    # Historial de donaciones
    last_donation_date = Column(DateTime(timezone=True), nullable=True)
    total_donations = Column(Integer, default=0, nullable=False)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="blood_donor_record")
    donations = relationship("BloodDonation", back_populates="record", cascade="all, delete-orphan")


class BloodDonation(Base):
    """Historial de cada donación de sangre."""
    __tablename__ = "blood_donations"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("blood_donor_records.id", ondelete="CASCADE"), nullable=False)

    donation_date = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    record = relationship("BloodDonorRecord", back_populates="donations")
