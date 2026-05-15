from pydantic import BaseModel, EmailStr, Field
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
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=3, max_length=200)
    phone: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
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
    is_verified: bool = False
    rating_avg: float = 0.0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
