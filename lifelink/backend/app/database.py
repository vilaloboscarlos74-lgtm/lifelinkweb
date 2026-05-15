from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,       # verifica conexión antes de usarla
    pool_size=10,             # conexiones persistentes
    max_overflow=20,          # conexiones extra bajo carga
    pool_timeout=30,          # espera máx 30s por una conexión libre
    pool_recycle=1800,        # recicla conexiones cada 30 min (evita conexiones obsoletas)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
