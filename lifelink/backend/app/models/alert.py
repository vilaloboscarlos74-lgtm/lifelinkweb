from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.supply import SupplyCategory, SupplyType


class SearchAlert(Base):
    __tablename__ = "search_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    label = Column(String(100), nullable=False)
    query = Column(String(200), nullable=True)
    category = Column(SQLEnum(SupplyCategory), nullable=True)
    supply_type = Column(SQLEnum(SupplyType), nullable=True)
    city = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="search_alerts")
