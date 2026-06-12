import logging
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

logger = logging.getLogger(__name__)

_INSECURE_KEY = "cambiar_esta_clave_en_produccion"


class Settings(BaseSettings):
    # Base de datos
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/lifelink_db"

    # JWT
    SECRET_KEY: str = _INSECURE_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    TEMP_TOKEN_EXPIRE_MINUTES: int = 5

    # App
    APP_NAME: str = "LifeLink Medical"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    FRONTEND_URL: str = "http://localhost:5173"

    # Uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 5_242_880  # 5MB

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Email SMTP (Gmail u otro proveedor)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""
    FROM_NAME: str = "LifeLink Medical"

    # Email via Resend (alternativa a SMTP)
    RESEND_API_KEY: str = ""

    # Twilio SMS (2FA por SMS)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    s = Settings()
    if s.SECRET_KEY == _INSECURE_KEY:
        logger.warning(
            "⚠️  SECRET_KEY no configurada — usando clave insegura. "
            "Define SECRET_KEY en las variables de entorno antes de ir a producción."
        )
    return s
