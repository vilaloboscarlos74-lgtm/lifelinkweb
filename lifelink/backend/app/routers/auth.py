import logging
import secrets
import base64
import io
from datetime import datetime, timedelta, timezone

import pyotp
import qrcode
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
    create_access_token, create_temp_token, decode_token,
)
from app.utils.email import send_verification_email, send_2fa_enabled_email, send_otp_email, send_reset_password_email
from app.utils.sms import generate_otp, get_otp_expiry, send_sms_otp
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
        "totp_enabled": user.totp_enabled,
        "sms_2fa_enabled": user.sms_2fa_enabled,
        "email_2fa_enabled": user.email_2fa_enabled,
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

    # Si tiene 2FA activo, emitir token temporal
    if user.totp_enabled:
        return {
            "requires_2fa": True,
            "method": "totp",
            "temp_token": create_temp_token(user.id),
        }

    if user.sms_2fa_enabled:
        if not user.phone:
            raise HTTPException(status_code=400, detail="No hay número de teléfono registrado para SMS 2FA")
        otp = generate_otp()
        user.sms_otp = otp
        user.sms_otp_expires = get_otp_expiry()
        db.commit()
        send_sms_otp(user.phone, otp)
        return {
            "requires_2fa": True,
            "method": "sms",
            "temp_token": create_temp_token(user.id),
        }

    if user.email_2fa_enabled:
        otp = generate_otp()
        user.email_otp = otp
        user.email_otp_expires = get_otp_expiry()
        db.commit()
        sent = await send_otp_email(user.email, user.username, otp)
        if not sent:
            raise HTTPException(
                status_code=503,
                detail="No se pudo enviar el código por correo. Contacta al administrador."
            )
        return {
            "requires_2fa": True,
            "method": "email",
            "temp_token": create_temp_token(user.id),
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

    await send_verification_email(user.email, user.username, token)
    return {"message": "Si el correo está registrado, recibirás un nuevo enlace"}


# ── 2FA: CONFIGURAR ───────────────────────────────────────────────────────────
from app.utils.dependencies import get_current_user


@router.post("/2fa/generate")
def generate_2fa(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Genera secreto TOTP + imagen QR para mostrar al usuario."""
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(
        name=current_user.email,
        issuer_name="LifeLink Medical",
    )

    # Generar QR como imagen base64
    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode()

    # Guardar secreto temporalmente (sin activar aún)
    current_user.totp_secret = secret
    db.commit()

    return {
        "secret": secret,
        "uri": uri,
        "qr_code": f"data:image/png;base64,{qr_b64}",
    }


@router.post("/2fa/enable")
async def enable_2fa(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verifica el código TOTP y activa el 2FA."""
    code = payload.get("code", "")
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Primero genera el secreto 2FA")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=400, detail="Código incorrecto")

    current_user.totp_enabled = True
    db.commit()

    await send_2fa_enabled_email(current_user.email, current_user.username)
    return {"message": "2FA activado correctamente"}


@router.post("/2fa/disable")
def disable_2fa(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Desactiva 2FA (requiere código TOTP actual)."""
    code = payload.get("code", "")
    if not current_user.totp_enabled or not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="El 2FA no está activo")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=400, detail="Código incorrecto")

    current_user.totp_enabled = False
    current_user.totp_secret = None
    db.commit()
    return {"message": "2FA desactivado"}


# ── 2FA: VERIFICAR CÓDIGO EN LOGIN ────────────────────────────────────────────
@router.post("/2fa/verify")
@_limit("5/minute")
async def verify_2fa(request: Request, payload: dict, db: Session = Depends(get_db)):
    """
    Recibe { temp_token, code } y devuelve el token de acceso completo
    si el código TOTP es correcto.
    """
    temp_token = payload.get("temp_token", "")
    code = payload.get("code", "")

    decoded = decode_token(temp_token)
    if not decoded or not decoded.get("2fa_pending"):
        raise HTTPException(status_code=401, detail="Token temporal inválido o expirado")

    user = _get_user_or_404(int(decoded["sub"]), db)
    if not user.totp_enabled or not user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA no configurado para este usuario")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(code, valid_window=1):
        raise HTTPException(status_code=401, detail="Código 2FA incorrecto")

    access_token = create_access_token(data={
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value,
    })
    return {"access_token": access_token, "token_type": "bearer", "user": _make_user_payload(user)}


# ── 2FA SMS: CONFIGURAR ───────────────────────────────────────────────────────

@router.post("/2fa/sms/setup")
def sms_2fa_setup(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Envía un OTP de prueba al teléfono del usuario para configurar SMS 2FA."""
    if not current_user.phone:
        raise HTTPException(status_code=400, detail="Debes agregar un número de teléfono a tu perfil primero")

    otp = generate_otp()
    current_user.sms_otp = otp
    current_user.sms_otp_expires = get_otp_expiry()
    db.commit()

    ok = send_sms_otp(current_user.phone, otp)
    if not ok:
        raise HTTPException(status_code=502, detail="No se pudo enviar el SMS. Revisa tu número de teléfono")
    return {"message": f"Código enviado a {current_user.phone}"}


@router.post("/2fa/sms/enable")
def sms_2fa_enable(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verifica el OTP recibido por SMS y activa el 2FA por SMS."""
    code = payload.get("code", "")
    if not current_user.sms_otp or not current_user.sms_otp_expires:
        raise HTTPException(status_code=400, detail="No hay un código pendiente. Llama a /2fa/sms/setup primero")

    expires = current_user.sms_otp_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="El código ha expirado. Solicita uno nuevo")

    if current_user.sms_otp != code:
        raise HTTPException(status_code=400, detail="Código incorrecto")

    current_user.sms_2fa_enabled = True
    current_user.sms_otp = None
    current_user.sms_otp_expires = None
    db.commit()
    return {"message": "2FA por SMS activado correctamente"}


@router.post("/2fa/sms/disable")
def sms_2fa_disable(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Desactiva el 2FA por SMS (requiere contraseña actual)."""
    from app.utils.security import verify_password
    password = payload.get("password", "")
    if not verify_password(password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")
    if not current_user.sms_2fa_enabled:
        raise HTTPException(status_code=400, detail="El 2FA por SMS no está activo")

    current_user.sms_2fa_enabled = False
    db.commit()
    return {"message": "2FA por SMS desactivado"}


# ── 2FA SMS: VERIFICAR EN LOGIN ───────────────────────────────────────────────

# ── 2FA EMAIL: CONFIGURAR ────────────────────────────────────────────────────

@router.post("/2fa/email/setup")
async def email_2fa_setup(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Envía un OTP de prueba al correo del usuario para configurar Email 2FA."""
    otp = generate_otp()
    current_user.email_otp = otp
    current_user.email_otp_expires = get_otp_expiry()
    db.commit()
    try:
        await send_otp_email(current_user.email, current_user.username, otp)
    except Exception as e:
        logger.error(f"Error enviando OTP a {current_user.email}: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"No se pudo enviar el código: {str(e)[:120]}"
        )
    return {"message": f"Código enviado a {current_user.email}"}


@router.post("/2fa/email/enable")
def email_2fa_enable(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verifica el OTP recibido por correo y activa el 2FA por email."""
    code = payload.get("code", "")
    if not current_user.email_otp or not current_user.email_otp_expires:
        raise HTTPException(status_code=400, detail="No hay código pendiente. Llama a /2fa/email/setup primero")

    expires = current_user.email_otp_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="El código ha expirado. Solicita uno nuevo")

    if current_user.email_otp != code:
        raise HTTPException(status_code=400, detail="Código incorrecto")

    current_user.email_2fa_enabled = True
    current_user.email_otp = None
    current_user.email_otp_expires = None
    db.commit()
    return {"message": "2FA por correo activado correctamente"}


@router.post("/2fa/email/disable")
def email_2fa_disable(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Desactiva el 2FA por correo (requiere contraseña actual)."""
    from app.utils.security import verify_password
    password = payload.get("password", "")
    if not verify_password(password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")
    if not current_user.email_2fa_enabled:
        raise HTTPException(status_code=400, detail="El 2FA por correo no está activo")

    current_user.email_2fa_enabled = False
    db.commit()
    return {"message": "2FA por correo desactivado"}


# ── 2FA EMAIL: VERIFICAR EN LOGIN ─────────────────────────────────────────────

@router.post("/2fa/email/send")
@_limit("5/minute")
async def email_2fa_send(request: Request, payload: dict, db: Session = Depends(get_db)):
    """Reenvía el OTP por correo durante el flujo de login."""
    temp_token = payload.get("temp_token", "")
    decoded = decode_token(temp_token)
    if not decoded or not decoded.get("2fa_pending"):
        raise HTTPException(status_code=401, detail="Token temporal inválido o expirado")

    user = _get_user_or_404(int(decoded["sub"]), db)
    if not user.email_2fa_enabled:
        raise HTTPException(status_code=400, detail="Email 2FA no configurado para este usuario")

    otp = generate_otp()
    user.email_otp = otp
    user.email_otp_expires = get_otp_expiry()
    db.commit()
    sent = await send_otp_email(user.email, user.username, otp)
    if not sent:
        raise HTTPException(status_code=503, detail="El servicio de correo no está configurado")
    return {"message": "Código reenviado"}


@router.post("/2fa/email/verify")
@_limit("5/minute")
async def email_2fa_verify(request: Request, payload: dict, db: Session = Depends(get_db)):
    """Verifica el OTP de correo durante el login y devuelve el token de acceso."""
    temp_token = payload.get("temp_token", "")
    code = payload.get("code", "")

    decoded = decode_token(temp_token)
    if not decoded or not decoded.get("2fa_pending"):
        raise HTTPException(status_code=401, detail="Token temporal inválido o expirado")

    user = _get_user_or_404(int(decoded["sub"]), db)
    if not user.email_2fa_enabled:
        raise HTTPException(status_code=400, detail="Email 2FA no configurado para este usuario")

    if not user.email_otp or not user.email_otp_expires:
        raise HTTPException(status_code=400, detail="No hay código pendiente. Usa /2fa/email/send para solicitar uno")

    expires = user.email_otp_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="El código ha expirado")

    if user.email_otp != code:
        raise HTTPException(status_code=401, detail="Código incorrecto")

    user.email_otp = None
    user.email_otp_expires = None
    db.commit()

    access_token = create_access_token(data={
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value,
    })
    return {"access_token": access_token, "token_type": "bearer", "user": _make_user_payload(user)}


@router.post("/2fa/sms/send")
@_limit("5/minute")
async def sms_2fa_send(request: Request, payload: dict, db: Session = Depends(get_db)):
    """Reenvía el OTP por SMS durante el flujo de login (dado temp_token)."""
    temp_token = payload.get("temp_token", "")
    decoded = decode_token(temp_token)
    if not decoded or not decoded.get("2fa_pending"):
        raise HTTPException(status_code=401, detail="Token temporal inválido o expirado")

    user = _get_user_or_404(int(decoded["sub"]), db)
    if not user.sms_2fa_enabled or not user.phone:
        raise HTTPException(status_code=400, detail="SMS 2FA no configurado para este usuario")

    otp = generate_otp()
    user.sms_otp = otp
    user.sms_otp_expires = get_otp_expiry()
    db.commit()
    send_sms_otp(user.phone, otp)
    return {"message": "Código reenviado"}


@router.post("/2fa/sms/verify")
@_limit("5/minute")
async def sms_2fa_verify(request: Request, payload: dict, db: Session = Depends(get_db)):
    """Verifica el OTP de SMS durante el login y devuelve el token de acceso."""
    temp_token = payload.get("temp_token", "")
    code = payload.get("code", "")

    decoded = decode_token(temp_token)
    if not decoded or not decoded.get("2fa_pending"):
        raise HTTPException(status_code=401, detail="Token temporal inválido o expirado")

    user = _get_user_or_404(int(decoded["sub"]), db)
    if not user.sms_2fa_enabled:
        raise HTTPException(status_code=400, detail="SMS 2FA no configurado para este usuario")

    if not user.sms_otp or not user.sms_otp_expires:
        raise HTTPException(status_code=400, detail="No hay código SMS pendiente. Solicita uno con /2fa/sms/send")

    expires = user.sms_otp_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="El código ha expirado")

    if user.sms_otp != code:
        raise HTTPException(status_code=401, detail="Código SMS incorrecto")

    user.sms_otp = None
    user.sms_otp_expires = None
    db.commit()

    access_token = create_access_token(data={
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value,
    })
    return {"access_token": access_token, "token_type": "bearer", "user": _make_user_payload(user)}


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
