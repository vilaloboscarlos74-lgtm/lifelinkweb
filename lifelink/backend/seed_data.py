"""
Script para poblar la base de datos con datos simulados.

Uso:
    cd backend
    pip install faker          # solo la primera vez
    python seed_data.py

Crea ~70 usuarios, ~180 insumos y ~130 solicitudes distribuidos
a lo largo de los últimos 12 meses con una tendencia de crecimiento.
Todos los usuarios de prueba tienen la contraseña: Test1234!
"""

import os
import sys
import random
from datetime import datetime, timezone, timedelta

# Asegurar que el path incluye el directorio backend
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.models.user import User, UserRole, BloodType
from app.models.supply import Supply, SupplyType, SupplyCategory, SupplyCondition, SupplyStatus
from app.models.request import ContactRequest, RequestStatus
from app.database import Base
from app.utils.security import hash_password

try:
    from faker import Faker
    fake = Faker("es_MX")
except ImportError:
    print("ERROR: instala faker primero: pip install faker")
    sys.exit(1)

# ── Conexión ──────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    print("ERROR: define DATABASE_URL en tu .env")
    sys.exit(1)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
Session = sessionmaker(bind=engine)

# ── Helpers ───────────────────────────────────────────────────────────────────
NOW = datetime.now(timezone.utc)
PASSWORD_HASH = hash_password("Test1234!")

CITIES = [
    ("Ciudad de México", "CDMX"),
    ("Guadalajara", "Jalisco"),
    ("Monterrey", "Nuevo León"),
    ("Puebla", "Puebla"),
    ("Tijuana", "Baja California"),
    ("Mérida", "Yucatán"),
    ("León", "Guanajuato"),
    ("Querétaro", "Querétaro"),
    ("Zapopan", "Jalisco"),
    ("Juárez", "Chihuahua"),
]

SUPPLY_TITLES = {
    SupplyType.DONACION: [
        "Silla de ruedas en buen estado",
        "Andadera ortopédica plegable",
        "Cama de hospital manual",
        "Bastón ajustable de aluminio",
        "Muletas axilares adulto",
        "Nebulizador portátil",
        "Oxímetro de pulso",
        "Glucómetro con tiras reactivas",
        "Tensiómetro digital de brazo",
        "Colchón antiescaras",
    ],
    SupplyType.VENTA: [
        "Silla de ruedas eléctrica",
        "Cama articulada eléctrica",
        "Compresor de aire médico",
        "Concentrador de oxígeno 5L",
        "Andadera con ruedas y frenos",
        "Protesis de miembro inferior",
        "Aparato auditivo digital",
        "Bomba de infusión usada",
        "Monitor de signos vitales",
        "Ventilador CPAP",
    ],
    SupplyType.INTERCAMBIO: [
        "Cambio silla por andadera",
        "Intercambio muletas por bastón",
        "Cambio tensiómetro por glucómetro",
        "Intercambio nebulizador pequeño",
        "Cambio oxímetro por termómetro",
    ],
    SupplyType.SOLICITUD: [
        "Necesito silla de ruedas para abuela",
        "Busco cama hospitalaria urgente",
        "Solicito muletas talla adulto",
        "Necesito andadera para rehabilitación",
        "Busco nebulizador para bebé",
        "Solicito colchón antiescaras",
        "Necesito bastón plegable",
        "Busco concentrador de oxígeno",
    ],
}

CATEGORIES = list(SupplyCategory)
CONDITIONS = list(SupplyCondition)
BLOOD_TYPES = list(BloodType)


def random_date_in_month(year: int, month: int) -> datetime:
    """Fecha aleatoria dentro de un mes dado."""
    if month == 12:
        next_month = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        next_month = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    start = datetime(year, month, 1, tzinfo=timezone.utc)
    delta = (next_month - start).days
    return start + timedelta(days=random.randint(0, delta - 1),
                             hours=random.randint(0, 23),
                             minutes=random.randint(0, 59))


def monthly_weights() -> list[tuple[int, int, int]]:
    """
    Devuelve lista de (year, month, weight) para los últimos 12 meses.
    Los meses recientes tienen más peso para simular crecimiento.
    """
    months = []
    for i in range(11, -1, -1):
        d = NOW - timedelta(days=30 * i)
        weight = i + 3          # meses más cercanos = mayor peso
        months.append((d.year, d.month, weight))
    return months


def pick_month(month_weights) -> tuple[int, int]:
    weights = [w for _, _, w in month_weights]
    chosen = random.choices(month_weights, weights=weights, k=1)[0]
    return chosen[0], chosen[1]


# ── Seeding ───────────────────────────────────────────────────────────────────
def seed():
    db = Session()
    try:
        mw = monthly_weights()

        # ── 1. Usuarios ───────────────────────────────────────────────────────
        print("Creando usuarios...")
        users = []
        for _ in range(70):
            year, month = pick_month(mw)
            created = random_date_in_month(year, month)
            city, state = random.choice(CITIES)
            role = random.choices(
                [UserRole.SOLICITANTE, UserRole.DONANTE],
                weights=[60, 40]
            )[0]
            username = fake.user_name()[:48] + str(random.randint(10, 99))
            u = User(
                email=fake.unique.email(),
                username=username,
                hashed_password=PASSWORD_HASH,
                full_name=fake.name(),
                phone=fake.numerify("55########"),
                role=role,
                city=city,
                state=state,
                bio=random.choice([None, fake.sentence(nb_words=8)]),
                is_active=True,
                email_verified=True,
                is_verified=random.random() < 0.3,
                is_blood_donor=random.random() < 0.25,
                blood_type=random.choice([None, *BLOOD_TYPES]),
                rating_avg=round(random.uniform(3.5, 5.0), 1),
            )
            db.add(u)
            db.flush()
            # Ajustar created_at manualmente después del INSERT
            db.execute(
                text("UPDATE users SET created_at = :ts WHERE id = :id"),
                {"ts": created, "id": u.id},
            )
            users.append(u)

        db.commit()
        print(f"  {len(users)} usuarios creados.")

        # ── 2. Insumos ────────────────────────────────────────────────────────
        print("Creando insumos...")
        supplies = []
        type_weights = {
            SupplyType.DONACION: 35,
            SupplyType.VENTA: 30,
            SupplyType.INTERCAMBIO: 15,
            SupplyType.SOLICITUD: 20,
        }
        supply_types = list(type_weights.keys())
        supply_wts = list(type_weights.values())

        for _ in range(180):
            year, month = pick_month(mw)
            created = random_date_in_month(year, month)
            stype = random.choices(supply_types, weights=supply_wts)[0]
            title_pool = SUPPLY_TITLES[stype]
            city, state = random.choice(CITIES)
            owner = random.choice(users)
            price = None
            if stype == SupplyType.VENTA:
                price = round(random.uniform(200, 8000), 2)

            s = Supply(
                title=random.choice(title_pool) + (
                    f" - {fake.word().capitalize()}" if random.random() < 0.4 else ""
                ),
                description=fake.paragraph(nb_sentences=3),
                supply_type=stype,
                category=random.choice(CATEGORIES),
                condition=random.choice(CONDITIONS) if stype != SupplyType.SOLICITUD else None,
                status=random.choices(
                    [SupplyStatus.DISPONIBLE, SupplyStatus.RESERVADO, SupplyStatus.ENTREGADO],
                    weights=[60, 15, 25]
                )[0],
                price=price,
                currency="MXN",
                city=city,
                state=state,
                quantity=random.randint(1, 3),
                is_urgent=random.random() < 0.12,
                views_count=random.randint(0, 150),
                owner_id=owner.id,
            )
            db.add(s)
            db.flush()
            db.execute(
                text("UPDATE supplies SET created_at = :ts WHERE id = :id"),
                {"ts": created, "id": s.id},
            )
            supplies.append(s)

        db.commit()
        print(f"  {len(supplies)} insumos creados.")

        # ── 3. Solicitudes de contacto ────────────────────────────────────────
        print("Creando solicitudes de contacto...")
        available_supplies = [s for s in supplies if s.supply_type != SupplyType.SOLICITUD]
        req_count = 0
        seen_pairs = set()

        for _ in range(130):
            year, month = pick_month(mw)
            created = random_date_in_month(year, month)
            supply = random.choice(available_supplies)
            sender = random.choice(users)
            if sender.id == supply.owner_id:
                continue
            pair = (sender.id, supply.owner_id, supply.id)
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)

            status = random.choices(
                [RequestStatus.PENDIENTE, RequestStatus.ACEPTADA,
                 RequestStatus.RECHAZADA, RequestStatus.COMPLETADA, RequestStatus.CANCELADA],
                weights=[20, 20, 15, 35, 10]
            )[0]

            r = ContactRequest(
                sender_id=sender.id,
                receiver_id=supply.owner_id,
                supply_id=supply.id,
                message=fake.sentence(nb_words=12),
                status=status,
                responded_at=created + timedelta(hours=random.randint(1, 72)) if status != RequestStatus.PENDIENTE else None,
            )
            db.add(r)
            db.flush()
            db.execute(
                text("UPDATE contact_requests SET created_at = :ts WHERE id = :id"),
                {"ts": created, "id": r.id},
            )
            req_count += 1

        db.commit()
        print(f"  {req_count} solicitudes creadas.")
        print("\n✓ Base de datos poblada exitosamente.")
        print("  Contraseña de todos los usuarios de prueba: Test1234!")

    except Exception as e:
        db.rollback()
        print(f"\nERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
