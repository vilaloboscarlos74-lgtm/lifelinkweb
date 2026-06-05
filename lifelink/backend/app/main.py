from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import os

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    _limiter = Limiter(key_func=get_remote_address)
    _RATE_LIMIT_ENABLED = True
except ImportError:
    _RATE_LIMIT_ENABLED = False

logger = logging.getLogger(__name__)

from app.config import get_settings
from app.database import engine, Base

from app.routers import (
    auth,
    users,
    supplies,
    requests,
    notifications,
    messages,
    admin,
    reviews,
    blood,
)
import app.models.blood  # noqa: F401 — registra tablas en Base.metadata

settings = get_settings()


# ==========================================
# STARTUP / SHUTDOWN
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        logger.info("Iniciando LifeLink API...")
        Base.metadata.create_all(bind=engine)
        logger.info("Base de datos conectada y tablas verificadas")
    except Exception as e:
        logger.error(f"Error al iniciar la aplicación: {e}")
        raise

    yield

    logger.info("Cerrando LifeLink API...")


# ==========================================
# APP
# ==========================================
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## LifeLink API

    Plataforma para intercambio de insumos médicos,
    donaciones y solicitudes de apoyo médico.

    Características:
    - Autenticación JWT con 2FA TOTP
    - Verificación de correo electrónico
    - Rate limiting (protección contra fuerza bruta)
    - Gestión de usuarios
    - Publicación de insumos
    - Solicitudes médicas
    - Sistema de notificaciones
    - Mensajería
    - Administración
    """,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# ==========================================
# RATE LIMITING (slowapi)
# ==========================================
if _RATE_LIMIT_ENABLED:
    app.state.limiter = _limiter
    app.add_exception_handler(
        RateLimitExceeded,
        lambda request, exc: JSONResponse(
            status_code=429,
            content={"detail": "Demasiadas solicitudes. Intenta de nuevo en un momento."},
        ),
    )


# ==========================================
# CORS
# ==========================================
origins = [
    origin.strip()
    for origin in settings.ALLOWED_ORIGINS.split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# STATIC FILES
# ==========================================
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount(
    "/uploads",
    StaticFiles(directory=settings.UPLOAD_DIR),
    name="uploads"
)


# ==========================================
# ROUTERS
# ==========================================
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(supplies.router, prefix="/api")
app.include_router(requests.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(blood.router, prefix="/api")


# ==========================================
# ROOT
# ==========================================
@app.get("/")
def root():
    return {
        "message": "🚑 LifeLink API funcionando",
        "docs": "/api/docs",
        "version": settings.APP_VERSION
    }


# ==========================================
# HEALTH CHECK
# ==========================================
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }