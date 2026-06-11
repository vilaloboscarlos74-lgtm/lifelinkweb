from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, Float,
    ForeignKey, Enum as SQLEnum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class SupplyType(str, enum.Enum):
    DONACION = "donacion"
    VENTA = "venta"
    INTERCAMBIO = "intercambio"
    SOLICITUD = "solicitud"


class SupplyCategory(str, enum.Enum):
    ORTOPEDICO = "ortopedico"
    REHABILITACION = "rehabilitacion"
    DIAGNOSTICO = "diagnostico"
    PROTESIS = "protesis"
    MOBILIARIO = "mobiliario"
    CONSUMIBLES = "consumibles"
    SANGRE = "sangre"
    OTRO = "otro"


class SupplyCondition(str, enum.Enum):
    NUEVO = "nuevo"
    SEMINUEVO = "seminuevo"
    USADO_BUEN_ESTADO = "usado_buen_estado"
    USADO = "usado"


class SupplyStatus(str, enum.Enum):
    DISPONIBLE = "disponible"
    RESERVADO = "reservado"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)

    supplies = relationship("Supply", back_populates="category_rel")


class Supply(Base):
    __tablename__ = "supplies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    supply_type = Column(SQLEnum(SupplyType), nullable=False, index=True)
    category = Column(SQLEnum(SupplyCategory), nullable=False, index=True)
    condition = Column(SQLEnum(SupplyCondition), nullable=True)
    status = Column(SQLEnum(SupplyStatus), default=SupplyStatus.DISPONIBLE, index=True)

    price = Column(Float, nullable=True)
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    currency = Column(String(10), default="MXN")

    address = Column(String(300), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    quantity = Column(Integer, default=1)
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    is_urgent = Column(Boolean, default=False, index=True)
    views_count = Column(Integer, default=0)

    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="supplies")
    category_rel = relationship("Category", back_populates="supplies")
    images = relationship("SupplyImage", back_populates="supply", cascade="all, delete-orphan")
    requests = relationship("ContactRequest", back_populates="supply")
    favorites = relationship("Favorite", backref="supply_obj", cascade="all, delete-orphan")


class SupplyImage(Base):
    __tablename__ = "supply_images"

    id = Column(Integer, primary_key=True, index=True)
    supply_id = Column(Integer, ForeignKey("supplies.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    supply = relationship("Supply", back_populates="images")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    supply_id = Column(Integer, ForeignKey("supplies.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "supply_id", name="uq_favorite_user_supply"),
        Index("ix_favorite_user_id", "user_id"),
    )
