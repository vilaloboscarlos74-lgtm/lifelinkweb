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

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

try:
    from faker import Faker
    fake = Faker("es_MX")
except ImportError:
    print("ERROR: instala faker primero: pip install faker")
    sys.exit(1)

from app.utils.security import hash_password

# ── Conexión ──────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    print("ERROR: define DATABASE_URL en tu .env")
    sys.exit(1)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
Session = sessionmaker(bind=engine)

# ── Constantes con valores EXACTOS de los enums en la BD ─────────────────────
ROLES       = ["SOLICITANTE", "DONANTE"]
BLOOD_TYPES = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"]
CATEGORIES  = ["ORTOPEDICO", "REHABILITACION", "DIAGNOSTICO", "PROTESIS",
               "MOBILIARIO", "CONSUMIBLES", "SANGRE", "OTRO"]
CONDITIONS  = ["NUEVO", "SEMINUEVO", "USADO_BUEN_ESTADO", "USADO"]
STATUSES    = ["DISPONIBLE", "RESERVADO", "ENTREGADO", "CANCELADO"]
# supplytype NO tiene SOLICITUD en la BD
SUPPLY_TYPES = ["DONACION", "VENTA", "INTERCAMBIO"]
REQ_STATUSES = ["PENDIENTE", "ACEPTADA", "RECHAZADA", "CANCELADA", "COMPLETADA"]

PASSWORD_HASH = hash_password("Test1234!")
NOW = datetime.now(timezone.utc)

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
    "DONACION": [
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
    "VENTA": [
        "Silla de ruedas eléctrica",
        "Cama articulada eléctrica",
        "Concentrador de oxígeno 5L",
        "Andadera con ruedas y frenos",
        "Aparato auditivo digital",
        "Monitor de signos vitales",
        "Ventilador CPAP seminuevo",
        "Bomba de infusión portátil",
        "Compresor de aire médico",
        "Caminador con asiento plegable",
    ],
    "INTERCAMBIO": [
        "Cambio silla de ruedas por andadera",
        "Intercambio muletas por bastón",
        "Cambio tensiómetro por glucómetro",
        "Intercambio nebulizador pequeño",
        "Cambio oxímetro por termómetro digital",
        "Intercambio cama hospitalaria por cama articulada",
    ],
}


def random_date_in_month(year: int, month: int) -> datetime:
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    start = datetime(year, month, 1, tzinfo=timezone.utc)
    delta_secs = int((end - start).total_seconds())
    return start + timedelta(seconds=random.randint(0, delta_secs - 1))


def monthly_weights():
    """Últimos 12 meses; los meses más recientes tienen más peso."""
    months = []
    for i in range(11, -1, -1):
        d = NOW - timedelta(days=30 * i)
        months.append((d.year, d.month, i + 3))
    return months


def pick_month(mw):
    weights = [w for _, _, w in mw]
    chosen = random.choices(mw, weights=weights, k=1)[0]
    return chosen[0], chosen[1]


# ── Seeding ───────────────────────────────────────────────────────────────────
def seed():
    db = Session()
    try:
        mw = monthly_weights()

        # ── 1. Usuarios ───────────────────────────────────────────────────────
        print("Creando usuarios...")
        user_ids = []

        for _ in range(70):
            year, month = pick_month(mw)
            created = random_date_in_month(year, month)
            city, state = random.choice(CITIES)
            role = random.choices(ROLES, weights=[60, 40])[0]
            blood_type = random.choice([None] + BLOOD_TYPES)
            username = (fake.user_name()[:46] + str(random.randint(10, 99))).replace(".", "_")

            row = db.execute(text("""
                INSERT INTO users
                    (email, username, hashed_password, full_name, phone, role,
                     city, state, bio, is_active, email_verified, is_verified,
                     is_blood_donor, blood_type, rating_avg, created_at)
                VALUES
                    (:email, :username, :pwd, :full_name, :phone,
                     CAST(:role AS userrole),
                     :city, :state, :bio,
                     TRUE, TRUE, :is_verified,
                     :is_blood_donor,
                     CAST(:blood_type AS bloodtype),
                     :rating, :created_at)
                RETURNING id
            """), {
                "email":          fake.unique.email(),
                "username":       username,
                "pwd":            PASSWORD_HASH,
                "full_name":      fake.name(),
                "phone":          fake.numerify("55########"),
                "role":           role,
                "city":           city,
                "state":          state,
                "bio":            random.choice([None, fake.sentence(nb_words=8)]),
                "is_verified":    random.random() < 0.3,
                "is_blood_donor": random.random() < 0.25,
                "blood_type":     blood_type,
                "rating":         round(random.uniform(3.5, 5.0), 1),
                "created_at":     created,
            })
            user_ids.append(row.scalar())

        db.commit()
        print(f"  {len(user_ids)} usuarios creados.")

        # ── 2. Insumos ────────────────────────────────────────────────────────
        print("Creando insumos...")
        supply_ids = []
        type_weights = [35, 30, 35]   # DONACION, VENTA, INTERCAMBIO

        for _ in range(180):
            year, month = pick_month(mw)
            created = random_date_in_month(year, month)
            stype = random.choices(SUPPLY_TYPES, weights=type_weights)[0]
            title = random.choice(SUPPLY_TITLES[stype])
            if random.random() < 0.4:
                title += f" - {fake.word().capitalize()}"
            city, state = random.choice(CITIES)
            owner_id = random.choice(user_ids)
            price = round(random.uniform(200, 8000), 2) if stype == "VENTA" else None
            status = random.choices(
                STATUSES[:3],       # DISPONIBLE, RESERVADO, ENTREGADO
                weights=[60, 15, 25]
            )[0]

            row = db.execute(text("""
                INSERT INTO supplies
                    (title, description, supply_type, category, condition,
                     status, price, currency, city, state, quantity,
                     is_urgent, views_count, owner_id, created_at)
                VALUES
                    (:title, :desc,
                     CAST(:stype AS supplytype),
                     CAST(:category AS supplycategory),
                     CAST(:condition AS supplycondition),
                     CAST(:status AS supplystatus),
                     :price, 'MXN', :city, :state, :qty,
                     :urgent, :views, :owner_id, :created_at)
                RETURNING id
            """), {
                "title":      title[:200],
                "desc":       fake.paragraph(nb_sentences=3),
                "stype":      stype,
                "category":   random.choice(CATEGORIES),
                "condition":  random.choice(CONDITIONS),
                "status":     status,
                "price":      price,
                "city":       city,
                "state":      state,
                "qty":        random.randint(1, 3),
                "urgent":     random.random() < 0.12,
                "views":      random.randint(0, 150),
                "owner_id":   owner_id,
                "created_at": created,
            })
            supply_ids.append((row.scalar(), owner_id))

        db.commit()
        print(f"  {len(supply_ids)} insumos creados.")

        # ── 3. Solicitudes de contacto ────────────────────────────────────────
        print("Creando solicitudes de contacto...")
        req_count = 0
        seen = set()
        req_status_weights = [20, 20, 15, 10, 35]  # PENDIENTE ACEPTADA RECHAZADA CANCELADA COMPLETADA

        for _ in range(150):
            year, month = pick_month(mw)
            created = random_date_in_month(year, month)
            supply_id, owner_id = random.choice(supply_ids)
            sender_id = random.choice(user_ids)
            if sender_id == owner_id:
                continue
            key = (sender_id, owner_id, supply_id)
            if key in seen:
                continue
            seen.add(key)

            status = random.choices(REQ_STATUSES, weights=req_status_weights)[0]
            responded = (created + timedelta(hours=random.randint(1, 72))
                         if status != "PENDIENTE" else None)

            db.execute(text("""
                INSERT INTO contact_requests
                    (sender_id, receiver_id, supply_id, message, status, responded_at, created_at)
                VALUES
                    (:sender, :receiver, :supply, :msg,
                     CAST(:status AS requeststatus),
                     :responded, :created_at)
            """), {
                "sender":     sender_id,
                "receiver":   owner_id,
                "supply":     supply_id,
                "msg":        fake.sentence(nb_words=12),
                "status":     status,
                "responded":  responded,
                "created_at": created,
            })
            req_count += 1

        db.commit()
        print(f"  {req_count} solicitudes creadas.")
        print("\nOK: Base de datos poblada exitosamente.")
        print("  Contraseña de todos los usuarios de prueba: Test1234!")

    except Exception as e:
        db.rollback()
        print(f"\nERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
