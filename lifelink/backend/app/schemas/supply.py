from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import datetime
from app.models.supply import SupplyType, SupplyCategory, SupplyCondition, SupplyStatus
from app.schemas.user import UserPublic


class SupplyCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    supply_type: SupplyType
    category: SupplyCategory
    condition: Optional[SupplyCondition] = None
    price: Optional[float] = Field(None, ge=0)
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    currency: str = Field("MXN", max_length=10)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    quantity: int = Field(1, ge=1, le=9999)
    brand: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    is_urgent: bool = False

    @model_validator(mode="after")
    def price_required_for_sale(self) -> "SupplyCreate":
        if self.supply_type == SupplyType.VENTA and (self.price is None or self.price <= 0):
            raise ValueError("El precio es obligatorio y debe ser mayor a 0 para publicaciones de venta")
        return self


class SupplyUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=5000)
    supply_type: Optional[SupplyType] = None
    category: Optional[SupplyCategory] = None
    condition: Optional[SupplyCondition] = None
    status: Optional[SupplyStatus] = None
    price: Optional[float] = Field(None, ge=0)
    budget_min: Optional[float] = Field(None, ge=0)
    budget_max: Optional[float] = Field(None, ge=0)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    quantity: Optional[int] = Field(None, ge=1, le=9999)
    is_urgent: Optional[bool] = None


class SupplyImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool

    class Config:
        from_attributes = True


class SupplyResponse(BaseModel):
    id: int
    title: str
    description: str
    supply_type: SupplyType
    category: SupplyCategory
    condition: Optional[SupplyCondition] = None
    status: SupplyStatus
    price: Optional[float] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    currency: str = "MXN"
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    quantity: int
    brand: Optional[str] = None
    model: Optional[str] = None
    is_urgent: bool
    views_count: int = 0
    owner: UserPublic
    images: List[SupplyImageResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SupplyList(BaseModel):
    items: List[SupplyResponse]
    total: int
    page: int
    pages: int
