import random
import logging
from datetime import datetime, timedelta, timezone

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


def generate_otp(length: int = 6) -> str:
    """Genera un código OTP numérico de `length` dígitos."""
    return str(random.randint(10 ** (length - 1), 10**length - 1))


def get_otp_expiry(minutes: int = 10) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)


def send_sms_otp(phone_number: str, otp: str) -> bool:
    """
    Envía el código OTP al número indicado vía Twilio SMS.
    En modo desarrollo (sin credenciales) imprime el código en el log.
    """
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.warning(
            "[DEV] Twilio no configurado. "
            f"OTP para {phone_number}: {otp}"
        )
        return True  # Simula éxito en desarrollo

    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        msg = client.messages.create(
            body=(
                f"LifeLink — Tu código de verificación es: {otp}\n"
                "Válido por 10 minutos. No lo compartas con nadie."
            ),
            from_=settings.TWILIO_FROM_NUMBER,
            to=phone_number,
        )
        logger.info(f"SMS enviado a {phone_number} — SID: {msg.sid}")
        return True
    except Exception as exc:
        logger.error(f"Error enviando SMS a {phone_number}: {exc}")
        return False
