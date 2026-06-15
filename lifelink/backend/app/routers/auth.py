import base64
import io
import logging
import secrets
from datetime import datetime, timedelta, timezone

import pyotp
import qrcode
import qrcode.image.pil
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
    create_temp_token, decode_token,
    hash_password, verify_password,
    create_access_token,
)
from app.utils.email import (
    send_verification_email, send_reset_password_email,
    send_otp_email, send_2fa_enabled_email,
)
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
        "email_2fa_enabled": user.email_2fa_enabled,
        "totp_enabled": user.totp_enabled,
    }


def _generate_otp(user: User, db) -> str:
    otp = f"{secrets.randbelow(1_000_000):06d}"
    user.email_otp = otp
    user.email_otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()
    return otp


def _mask_email(email: str) -> str:
    local, domain = email.split("@", 1)
    visible = local[:2] if len(local) >= 2 else local[:1]
    return f"{visible}{'*' * max(len(local) - 2, 3)}@{domain}"


def _verify_otp(user: User, otp: str) -> None:
    now = datetime.now(timezone.utc)
    expires = user.email_otp_expires
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    # Verificar expiración primero para dar el mensaje correcto
    if not user.email_otp or not expires or now > expires:
        raise HTTPException(status_code=400, detail="El código ha expirado. Solicita uno nuevo.")
    if user.email_otp != otp.strip():
        raise HTTPException(status_code=400, detail="Código incorrecto")


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

    # TOTP tiene prioridad sobre email 2FA (más seguro, sin dependencia de red)
    if user.totp_enabled:
        temp_token = create_temp_token(user.id)
        return {
            "requires_2fa": True,
            "temp_token": temp_token,
            "method": "totp",
        }

    # 2FA por email
    if user.email_2fa_enabled:
        otp = _generate_otp(user, db)
        try:
            await send_otp_email(user.email, user.username, otp)
        except Exception as e:
            logger.error(f"Error enviando OTP a {user.email}: {e}")
            raise HTTPException(
                status_code=503,
                detail="No se pudo enviar el código de verificación. Verifica la configuración de email o intenta más tarde.",
            )
        temp_token = create_temp_token(user.id)
        return {
            "requires_2fa": True,
            "temp_token": temp_token,
            "method": "email",
            "masked_email": _mask_email(user.email),
        }

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

    try:
        await send_verification_email(user.email, user.username, token)
    except Exception as e:
        logger.error(f"Error enviando verificación a {user.email}: {e}")
        raise HTTPException(
            status_code=503,
            detail="No se pudo enviar el correo. Verifica que el servidor de email esté configurado."
        )
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


# ── 2FA — VERIFICAR OTP EN LOGIN ──────────────────────────────────────────────
class TwoFALoginRequest(BaseModel):
    temp_token: str
    otp: str


@router.post("/2fa/verify")
@_limit("5/minute")
async def verify_2fa_login(
    request: Request, body: TwoFALoginRequest, db: Session = Depends(get_db)
):
    payload = decode_token(body.temp_token)
    if not payload or not payload.get("2fa_pending"):
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    user = db.get(User, int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario no encontrado")

    _verify_otp(user, body.otp)

    user.email_otp = None
    user.email_otp_expires = None
    db.commit()

    token = create_access_token(data={
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value,
    })
    return {"access_token": token, "token_type": "bearer", "user": _make_user_payload(user)}


# ── 2FA — REENVIAR OTP DE LOGIN ──────────────────────────────────────────────
class ResendOTPRequest(BaseModel):
    temp_token: str


@router.post("/2fa/resend-otp")
@_limit("2/minute")
async def resend_2fa_otp(
    request: Request, body: ResendOTPRequest, db: Session = Depends(get_db)
):
    payload = decode_token(body.temp_token)
    if not payload or not payload.get("2fa_pending"):
        raise HTTPException(status_code=400, detail="Token inválido o expirado. Inicia sesión de nuevo.")

    user = db.get(User, int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario no encontrado")
    if not user.email_2fa_enabled:
        raise HTTPException(status_code=400, detail="Este usuario no tiene 2FA activo")

    otp = _generate_otp(user, db)
    try:
        await send_otp_email(user.email, user.username, otp)
    except Exception as e:
        logger.error(f"Error reenviando OTP a {user.email}: {e}")
        raise HTTPException(status_code=503, detail="No se pudo reenviar el código. Intenta de nuevo.")
    return {"message": "Código reenviado correctamente"}


# ── 2FA — ACTIVAR (paso 1: enviar OTP) ───────────────────────────────────────
@router.post("/2fa/enable")
@_limit("3/minute")
async def enable_2fa_send_otp(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.email_2fa_enabled:
        raise HTTPException(status_code=400, detail="El 2FA por email ya está activado")

    otp = _generate_otp(current_user, db)
    try:
        await send_otp_email(current_user.email, current_user.username, otp)
    except Exception as e:
        logger.error(f"Error enviando OTP de activación a {current_user.email}: {e}")
        raise HTTPException(status_code=503, detail="No se pudo enviar el código. Verifica la configuración del servicio de email.")
    return {"message": "Código enviado a tu correo. Tienes 10 minutos para confirmarlo."}


# ── 2FA — ACTIVAR (paso 2: confirmar OTP) ────────────────────────────────────
class OTPRequest(BaseModel):
    otp: str


@router.post("/2fa/confirm-enable")
@_limit("5/minute")
async def enable_2fa_confirm(
    request: Request,
    body: OTPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verify_otp(current_user, body.otp)

    current_user.email_2fa_enabled = True
    current_user.email_otp = None
    current_user.email_otp_expires = None
    db.commit()

    try:
        await send_2fa_enabled_email(current_user.email, current_user.username)
    except Exception as e:
        logger.error(f"Error enviando confirmación 2FA a {current_user.email}: {e}")

    return {"message": "Verificación en dos pasos activada correctamente", "email_2fa_enabled": True}


# ── 2FA — DESACTIVAR ──────────────────────────────────────────────────────────
class DisableTwoFARequest(BaseModel):
    password: str


@router.post("/2fa/disable")
async def disable_2fa(
    body: DisableTwoFARequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.email_2fa_enabled:
        raise HTTPException(status_code=400, detail="El 2FA no está activado")
    if not verify_password(body.password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    current_user.email_2fa_enabled = False
    current_user.email_otp = None
    current_user.email_otp_expires = None
    db.commit()
    return {"message": "Verificación en dos pasos desactivada", "email_2fa_enabled": False}


# ── TOTP — CONFIGURAR (genera secreto + QR) ───────────────────────────────────
@router.post("/totp/setup")
async def totp_setup(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="El autenticador TOTP ya está activado")

    secret = pyotp.random_base32()
    current_user.totp_secret = secret
    db.commit()

    issuer = "LifeLink Medical"
    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name=issuer,
    )

    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode()

    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_b64}",
        "uri": uri,
    }


# ── TOTP — CONFIRMAR ACTIVACIÓN ───────────────────────────────────────────────
class TOTPCodeRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)


@router.post("/totp/confirm-enable")
async def totp_confirm_enable(
    body: TOTPCodeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="El autenticador ya está activado")
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Primero configura el autenticador desde /totp/setup")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(body.code.strip(), valid_window=1):
        raise HTTPException(status_code=400, detail="Código incorrecto. Verifica que la hora de tu dispositivo sea correcta.")

    current_user.totp_enabled = True
    db.commit()
    return {"message": "Autenticador TOTP activado correctamente", "totp_enabled": True}


# ── TOTP — VERIFICAR EN LOGIN ─────────────────────────────────────────────────
class TOTPVerifyRequest(BaseModel):
    temp_token: str
    code: str = Field(..., min_length=6, max_length=6)


@router.post("/totp/verify")
@_limit("5/minute")
async def totp_verify_login(
    request: Request,
    body: TOTPVerifyRequest,
    db: Session = Depends(get_db),
):
    payload = decode_token(body.temp_token)
    if not payload or not payload.get("2fa_pending"):
        raise HTTPException(status_code=400, detail="Token inválido o expirado. Inicia sesión de nuevo.")

    user = db.get(User, int(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario no encontrado")
    if not user.totp_enabled or not user.totp_secret:
        raise HTTPException(status_code=400, detail="TOTP no está activado en esta cuenta")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(body.code.strip(), valid_window=1):
        raise HTTPException(status_code=400, detail="Código incorrecto. Recuerda que los códigos se renuevan cada 30 segundos.")

    token = create_access_token(data={
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value,
    })
    return {"access_token": token, "token_type": "bearer", "user": _make_user_payload(user)}


# ── TOTP — DESACTIVAR ─────────────────────────────────────────────────────────
class TOTPDisableRequest(BaseModel):
    password: str
    code: str = Field(..., min_length=6, max_length=6)


@router.post("/totp/disable")
async def totp_disable(
    body: TOTPDisableRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="El autenticador TOTP no está activado")
    if not verify_password(body.password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(body.code.strip(), valid_window=1):
        raise HTTPException(status_code=400, detail="Código del autenticador incorrecto")

    current_user.totp_enabled = False
    current_user.totp_secret = None
    db.commit()
    return {"message": "Autenticador TOTP desactivado", "totp_enabled": False}
