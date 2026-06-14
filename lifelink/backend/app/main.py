from fastapi import FastAPI, Request, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.utils.dependencies import get_current_admin
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from sqlalchemy import text
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
    alerts,
    reports,
    ai,
)
import app.models.blood   # noqa: F401 — registra tablas en Base.metadata
import app.models.alert   # noqa: F401 — registra tablas en Base.metadata
import app.models.report  # noqa: F401 — registra tablas en Base.metadata

settings = get_settings()


# ==========================================
# STARTUP / SHUTDOWN
# ==========================================
def _run_migrations():
    """Ejecuta migraciones DDL en SQLAlchemy 2.x.
    Cada sentencia corre en su propia transacción para que un fallo
    no bloquee el resto. PostgreSQL 12+ permite ALTER TYPE en transacciones."""
    ddl_statements = [
        "ALTER TYPE supplytype ADD VALUE IF NOT EXISTS 'SOLICITUD'",
        "ALTER TABLE supplies ADD COLUMN IF NOT EXISTS budget_min FLOAT",
        "ALTER TABLE supplies ADD COLUMN IF NOT EXISTS budget_max FLOAT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_2fa_enabled BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_otp VARCHAR(6)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_otp_expires TIMESTAMPTZ",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_2fa_enabled BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp VARCHAR(6)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp_expires TIMESTAMPTZ",
        "ALTER TABLE blood_donor_records ADD COLUMN IF NOT EXISTS tattoo_date TIMESTAMPTZ",
        "ALTER TABLE blood_donor_records ADD COLUMN IF NOT EXISTS piercing_date TIMESTAMPTZ",
        "ALTER TABLE blood_donor_records ADD COLUMN IF NOT EXISTS surgery_date TIMESTAMPTZ",
        "ALTER TABLE supplies ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ",
    ]

    # AUTOCOMMIT evita que ALTER TYPE quede dentro de una transacción implícita
    try:
        with engine.execution_options(isolation_level="AUTOCOMMIT").connect() as conn:
            for sql in ddl_statements:
                try:
                    conn.execute(text(sql))
                    logger.info(f"Migración OK: {sql[:70]}")
                except Exception as e:
                    logger.warning(f"Migración omitida ({sql[:60]}): {e}")
    except Exception as e:
        logger.error(f"No se pudo abrir conexión para migraciones: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        logger.info("Iniciando LifeLink API...")
        Base.metadata.create_all(bind=engine)
        _run_migrations()
        logger.info("Base de datos conectada, tablas y migraciones aplicadas")
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
app.include_router(alerts.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(ai.router, prefix="/api")


# ==========================================
# ESTADÍSTICAS PÚBLICAS
# ==========================================
@app.get("/api/stats")
def public_stats(db=None):
    from app.database import get_db as _get_db
    from sqlalchemy import func, case
    from app.models.user import User
    from app.models.supply import Supply, SupplyType, SupplyStatus
    from app.models.request import ContactRequest, RequestStatus
    db = next(_get_db())
    try:
        users_total = db.query(func.count(User.id)).scalar() or 0
        blood_donors = db.query(func.count(User.id)).filter(User.is_blood_donor == True).scalar() or 0
        supplies_total = db.query(func.count(Supply.id)).scalar() or 0
        donations = db.query(func.count(Supply.id)).filter(Supply.supply_type == SupplyType.DONACION).scalar() or 0
        available = db.query(func.count(Supply.id)).filter(Supply.status == SupplyStatus.DISPONIBLE).scalar() or 0
        completed = db.query(func.count(ContactRequest.id)).filter(ContactRequest.status == RequestStatus.COMPLETADA).scalar() or 0
        return {
            "users": users_total,
            "blood_donors": blood_donors,
            "supplies": supplies_total,
            "donations": donations,
            "available": available,
            "completed_requests": completed,
        }
    finally:
        db.close()


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


# ==========================================
# MIGRATIONS MANUAL (admin fallback)
# ==========================================
@app.post("/api/admin/run-migrations")
def run_migrations_manual(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Ejecuta las migraciones DDL manualmente. Solo para administradores autenticados."""
    from app.database import get_db as _get_db
    from app.utils.dependencies import get_current_admin as _get_admin
    results = []
    ddl = [
        "ALTER TYPE supplytype ADD VALUE IF NOT EXISTS 'SOLICITUD'",
        "ALTER TABLE supplies ADD COLUMN IF NOT EXISTS budget_min FLOAT",
        "ALTER TABLE supplies ADD COLUMN IF NOT EXISTS budget_max FLOAT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_2fa_enabled BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_otp VARCHAR(6)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_otp_expires TIMESTAMPTZ",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_2fa_enabled BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp VARCHAR(6)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp_expires TIMESTAMPTZ",
    ]
    try:
        with engine.execution_options(isolation_level="AUTOCOMMIT").connect() as conn:
            for sql in ddl:
                try:
                    conn.execute(text(sql))
                    results.append({"sql": sql[:60], "status": "ok"})
                except Exception as e:
                    results.append({"sql": sql[:60], "status": "skipped", "reason": str(e)})
    except Exception as e:
        return {"error": str(e), "results": results}
    return {"results": results}