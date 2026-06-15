from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from app.models.user import UserRole, BloodType


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=3, max_length=200)
    phone: Optional[str] = None
    role: UserRole = UserRole.SOLICITANTE


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator('password')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError('La contraseña debe tener al menos una mayúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe tener al menos un número')
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    blood_type: Optional[BloodType] = None
    is_blood_donor: Optional[bool] = None


class UserPublic(BaseModel):
    id: int
    username: str
    full_name: str
    avatar_url: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    blood_type: Optional[BloodType] = None
    is_blood_donor: bool = False
    rating_avg: float = 0.0
    is_verified: bool = False
    totp_enabled: bool = False
    contact_supply_id: Optional[int] = None  # populated by /donors/blood only

    @field_validator('is_blood_donor', 'is_verified', 'totp_enabled', mode='before')
    @classmethod
    def coerce_bool(cls, v):
        return bool(v) if v is not None else False

    @field_validator('rating_avg', mode='before')
    @classmethod
    def coerce_float(cls, v):
        return float(v) if v is not None else 0.0

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    blood_type: Optional[BloodType] = None
    is_blood_donor: bool = False
    is_active: bool = True
    is_verified: bool = False
    email_verified: bool = False
    totp_enabled: bool = False
    email_2fa_enabled: bool = False
    rating_avg: float = 0.0
    created_at: Optional[datetime] = None

    # Guard against NULL in DB columns that have Python-side defaults only
    @field_validator('is_blood_donor', 'is_active', 'is_verified', 'email_verified', 'totp_enabled', 'email_2fa_enabled', mode='before')
    @classmethod
    def coerce_bool(cls, v):
        return bool(v) if v is not None else False

    @field_validator('rating_avg', mode='before')
    @classmethod
    def coerce_float(cls, v):
        return float(v) if v is not None else 0.0

    class Config:
        from_attributes = True
