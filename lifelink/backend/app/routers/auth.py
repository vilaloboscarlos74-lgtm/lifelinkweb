import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.utils.security import (
    create_reset_token, decode_reset_token,
    hash_password, verify_password,
    create_access_token,
)
from app.utils.email import send_verification_email, send_reset_password_email
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()

# ── Rate limiting (slowapi) ───────────────────────────────────────────────────
try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    _limiter = Limiter(key_func=get_remote_address)

    def _limit(rate: str):
        return _limiter.limit(rate)
except ImportError:
    # Fallback sin limitación si slowapi no está disponible
    def _limit(_rate: str):
        def decorator(func):
            return func
        return decorator


# ── Helpers ───────────────────────────────────────────────────────────────────
def _make_user_payload(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role.value,
        "avatar_url": user.avatar_url,
        "is_verified": user.is_verified,
        "email_verified": user.email_verified,
    }


def _get_user_or_404(user_id: int, db: Session) -> User:
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


# ── REGISTRO ──────────────────────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@_limit("5/minute")
async def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    email = user.email.lower().strip()
    username = user.username.lower().strip()

    existing = db.query(User).filter(
        or_(User.email == email, User.username == username)
    ).first()
    if existing:
        if existing.email == email:
            raise HTTPException(status_code=400, detail="El correo ya está registrado")
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)

    db_user = User(
        email=email,
        username=username,
        hashed_password=hash_password(user.password),
        full_name=user.full_name.strip(),
        phone=user.phone,
        role=user.role,
        email_verified=False,
        email_verification_token=token,
        email_verification_expires=expires,
    )
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error al crear usuario")

    try:
        await send_verification_email(email, db_user.username, token)
    except Exception as e:
        logger.error(f"No se pudo enviar email de verificación a {email}: {e}")
    return db_user


# ── LOGIN ─────────────────────────────────────────────────────────────────────
@router.post("/login")
@_limit("10/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    login_value = form_data.username.lower().strip()
    user = db.query(User).filter(
        or_(User.username == login_value, User.email == login_value)
    ).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario desactivado")

    token = create_access_token(data={
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value,
    })
    return {"access_token": token, "token_type": "bearer", "user": _make_user_payload(user)}


# ── VERIFICACIÓN DE EMAIL ─────────────────────────────────────────────────────
@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email_verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    now = datetime.now(timezone.utc)
    expires = user.email_verification_expires
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if not expires or now > expires:
        raise HTTPException(status_code=400, detail="Token expirado. Solicita un nuevo enlace")

    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires = None
    db.commit()
    return {"message": "Correo verificado correctamente"}


@router.post("/resend-verification")
@_limit("3/minute")
async def resend_verification(request: Request, email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email.lower().strip()).first()
    if not user:
        # No revelar si el email existe
        return {"message": "Si el correo está registrado, recibirás un nuevo enlace"}
    if user.email_verified:
        return {"message": "Tu correo ya está verificado"}

    token = secrets.token_urlsafe(32)
    user.email_verification_token = token
    user.email_verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    db.commit()

    await send_verification_email(user.email, user.username, token)
    return {"message": "Si el correo está registrado, recibirás un nuevo enlace"}


from app.utils.dependencies import get_current_user


# ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=8)

    @field_validator('password')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError('La contraseña debe tener al menos una mayúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe tener al menos un número')
        return v


@router.post("/forgot-password", status_code=202)
@_limit("3/minute")
async def forgot_password(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if user:
        token = create_reset_token(user.id)
        try:
            await send_reset_password_email(user.email, user.full_name, token)
        except Exception as e:
            logger.error(f"Error enviando email de reset a {email}: {e}")
    return {"detail": "Si el correo existe recibirás un enlace en los próximos minutos."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user_id = decode_reset_token(body.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="El enlace es inválido o ha expirado")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=400, detail="El enlace es inválido o ha expirado")
    user.hashed_password = hash_password(body.password)
    db.commit()
    return {"detail": "Contraseña actualizada correctamente. Ya puedes iniciar sesión."}
