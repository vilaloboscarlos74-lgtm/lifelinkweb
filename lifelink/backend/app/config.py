from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Base de datos
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/lifelink_db"

    # JWT
    SECRET_KEY: str = "cambiar_esta_clave_en_produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    TEMP_TOKEN_EXPIRE_MINUTES: int = 5  # Para flujo 2FA

    # App
    APP_NAME: str = "LifeLink Medical"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    FRONTEND_URL: str = "http://localhost:5173"

    # Uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 5_242_880  # 5MB

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Email SMTP (Gmail: smtp.gmail.com:587, Outlook: smtp.office365.com:587)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@lifelink.mx"
    FROM_NAME: str = "LifeLink Medical"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
