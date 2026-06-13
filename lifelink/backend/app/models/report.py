from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class ReportType(str, enum.Enum):
    SUPPLY = "supply"
    USER = "user"


class ReportReason(str, enum.Enum):
    FRAUDE = "fraude"
    CONTENIDO_INAPROPIADO = "contenido_inapropiado"
    INFORMACION_FALSA = "informacion_falsa"
    PRODUCTO_ILEGAL = "producto_ilegal"
    ACOSO = "acoso"
    OTRO = "otro"


class ReportStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    REVISANDO = "revisando"
    RESUELTO = "resuelto"
    DESESTIMADO = "desestimado"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_type = Column(SQLEnum(ReportType), nullable=False, index=True)
    reason = Column(SQLEnum(ReportReason), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.PENDIENTE, index=True)

    # Target: one of these is set depending on report_type
    supply_id = Column(Integer, ForeignKey("supplies.id", ondelete="CASCADE"), nullable=True, index=True)
    reported_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)

    admin_note = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    reporter = relationship("User", foreign_keys=[reporter_id])
    reported_user = relationship("User", foreign_keys=[reported_user_id])
    supply = relationship("Supply", foreign_keys=[supply_id])
