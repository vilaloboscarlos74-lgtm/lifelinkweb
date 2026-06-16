"""
Script aditivo para poblar la base de datos con más actividad histórica desde 2025.

A diferencia de seed_data.py (que distribuye sobre los últimos 12 meses relativos
a "ahora"), este script reparte fechas de creación desde enero 2025 hasta hoy,
dando más peso a los meses de 2025 que suelen estar menos poblados.

No borra nada existente — solo inserta usuarios, insumos y solicitudes nuevos.

Uso:
    cd backend
    DATABASE_URL="postgresql://..." python seed_2025.py
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
from sqlalchemy.exc import IntegrityError

try:
    from faker import Faker
    fake = Faker("es_MX")
except ImportError:
    print("ERROR: instala faker primero: pip install faker")
    sys.exit(1)

from app.utils.security import hash_password

DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    print("ERROR: define DATABASE_URL en tu .env o como variable de entorno")
    sys.exit(1)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
Session = sessionmaker(bind=engine)


def _enum_values(conn, type_name: str) -> list[str]:
    rows = conn.execute(text(
        "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid "
        "WHERE pg_type.typname = :t ORDER BY enumsortorder"
    ), {"t": type_name}).fetchall()
    return [r[0] for r in rows]


with engine.connect() as _conn:
    _all_roles = _enum_values(_conn, "userrole")
    ROLES = [r for r in _all_roles if r != "ADMIN"] or _all_roles
    BLOOD_TYPES = _enum_values(_conn, "bloodtype")
    CATEGORIES = _enum_values(_conn, "supplycategory")
    CONDITIONS = _enum_values(_conn, "supplycondition")
    STATUSES = _enum_values(_conn, "supplystatus")
    _all_supply_types = _enum_values(_conn, "supplytype")
    SUPPLY_TYPES = [t for t in _all_supply_types if t.isupper() and t != "SOLICITUD"] or \
                   [t for t in _all_supply_types if t != "solicitud" and t != "SOLICITUD"]
    REQ_STATUSES = _enum_values(_conn, "requeststatus")

print("Enums detectados:")
print(" ROLES:", ROLES)
print(" BLOOD_TYPES:", BLOOD_TYPES)
print(" SUPPLY_TYPES:", SUPPLY_TYPES)
print(" STATUSES:", STATUSES)
print(" REQ_STATUSES:", REQ_STATUSES)
print()

PASSWORD_HASH = hash_password("Test1234!")
NOW = datetime.now(timezone.utc)

ALCALDIAS_CDMX = [
    "Álvaro Obregón", "Azcapotzalco", "Benito Juárez", "Coyoacán",
    "Cuajimalpa de Morelos", "Cuauhtémoc", "Gustavo A. Madero", "Iztacalco",
    "Iztapalapa", "La Magdalena Contreras", "Miguel Hidalgo", "Milpa Alta",
    "Tláhuac", "Tlalpan", "Venustiano Carranza", "Xochimilco",
]

MUNICIPIOS_EDOMEX = [
    "Amecameca", "Atizapán de Zaragoza", "Chalco", "Chicoloapan",
    "Chimalhuacán", "Coacalco de Berriozábal", "Cuautitlán", "Cuautitlán Izcalli",
    "Ecatepec de Morelos", "Huixquilucan", "Ixtapaluca", "La Paz",
    "Los Reyes La Paz", "Metepec", "Naucalpan de Juárez", "Nezahualcóyotl",
    "Nicolás Romero", "Tecámac", "Texcoco", "Tlalnepantla de Baz",
    "Toluca", "Tultepec", "Tultitlán", "Valle de Chalco Solidaridad",
    "Zinacantepec", "Zumpango",
]

CITIES = (
    [(c, "Ciudad de México") for c in ALCALDIAS_CDMX]
    + [(m, "Estado de México") for m in MUNICIPIOS_EDOMEX]
)

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

# Descripción realista por título — evita el texto sin sentido que genera
# fake.paragraph() (Faker solo junta palabras sueltas en español, sin lógica).
SUPPLY_DESCRIPTIONS = {
    "Silla de ruedas en buen estado":
        "Silla de ruedas plegable con reposapiés y frenos de mano. Se dona porque el paciente ya no la necesita. Lista para usarse, solo requiere limpieza.",
    "Andadera ortopédica plegable":
        "Andadera de aluminio plegable, ligera y resistente. Ideal para personas con movilidad reducida que necesitan apoyo al caminar.",
    "Cama de hospital manual":
        "Cama de hospital con manivela manual para ajustar la inclinación del respaldo y las piernas. Incluye barandales laterales de seguridad.",
    "Bastón ajustable de aluminio":
        "Bastón de aluminio con altura ajustable y empuñadura antideslizante. Poco uso, en buen estado.",
    "Muletas axilares adulto":
        "Par de muletas axilares de aluminio, ajustables en altura, con almohadillas acolchadas en la axila y empuñadura ergonómica.",
    "Nebulizador portátil":
        "Nebulizador portátil a pilas, ideal para tratamientos respiratorios en casa. Incluye mascarilla y manguera.",
    "Oxímetro de pulso":
        "Oxímetro de dedo digital para medir saturación de oxígeno y frecuencia cardiaca. Funciona con pilas AAA.",
    "Glucómetro con tiras reactivas":
        "Glucómetro digital con un paquete de tiras reactivas y lancetas incluidas. Ideal para control de diabetes en casa.",
    "Tensiómetro digital de brazo":
        "Tensiómetro digital de brazo con memoria de mediciones y manguito ajustable. Pantalla grande de fácil lectura.",
    "Colchón antiescaras":
        "Colchón antiescaras de espuma de alta densidad, recomendado para pacientes con movilidad limitada o en reposo prolongado.",
    "Silla de ruedas eléctrica":
        "Silla de ruedas eléctrica con batería recargable, joystick de control y autonomía de varias horas. Se vende por cambio de modelo.",
    "Cama articulada eléctrica":
        "Cama hospitalaria eléctrica con control remoto para ajustar respaldo y piernas. Colchón incluido.",
    "Concentrador de oxígeno 5L":
        "Concentrador de oxígeno de 5 litros por minuto, bajo nivel de ruido. Incluye manual y accesorios originales.",
    "Andadera con ruedas y frenos":
        "Andadera tipo rollator con 4 ruedas, frenos de mano y asiento plegable para descansar.",
    "Aparato auditivo digital":
        "Aparato auditivo digital recargable, con ajuste de volumen y reducción de ruido ambiental.",
    "Monitor de signos vitales":
        "Monitor de signos vitales portátil: mide presión, pulso y oxigenación. Pantalla digital con alarmas configurables.",
    "Ventilador CPAP seminuevo":
        "Equipo CPAP para apnea del sueño, con humidificador integrado y mascarilla nasal. Poco uso.",
    "Bomba de infusión portátil":
        "Bomba de infusión portátil para administración controlada de medicamentos. Funciona con batería y corriente eléctrica.",
    "Compresor de aire médico":
        "Compresor de aire médico silencioso, usado para nebulizaciones. Incluye filtros de repuesto.",
    "Caminador con asiento plegable":
        "Caminador plegable con asiento acolchado, ideal para paseos cortos y descansos. Fácil de transportar.",
    "Cambio silla de ruedas por andadera":
        "Tengo una silla de ruedas en buen estado y busco cambiarla por una andadera, ya que el paciente recuperó algo de movilidad.",
    "Intercambio muletas por bastón":
        "Cuento con muletas axilares poco usadas y me gustaría intercambiarlas por un bastón, pues ya no necesito el apoyo completo.",
    "Cambio tensiómetro por glucómetro":
        "Tengo un tensiómetro digital funcionando perfectamente y busco cambiarlo por un glucómetro para control de diabetes.",
    "Intercambio nebulizador pequeño":
        "Busco intercambiar mi nebulizador pequeño por uno de mayor capacidad; el mío funciona bien pero ya no se ajusta a mis necesidades.",
    "Cambio oxímetro por termómetro digital":
        "Tengo un oxímetro de pulso en excelente estado, busco cambiarlo por un termómetro digital sin contacto.",
    "Intercambio cama hospitalaria por cama articulada":
        "Cuento con una cama hospitalaria manual y busco intercambiarla por una cama articulada eléctrica para mayor comodidad del paciente.",
}


def random_date_in_month(year: int, month: int) -> datetime:
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    start = datetime(year, month, 1, tzinfo=timezone.utc)
    end = min(end, NOW)
    if end <= start:
        return start
    delta_secs = int((end - start).total_seconds())
    return start + timedelta(seconds=random.randint(0, max(delta_secs - 1, 0)))


def monthly_weights_since_2025():
    """Enero 2025 hasta el mes actual. Da más peso a los meses de 2025
    (probablemente menos poblados) y menos a los de 2026 (ya poblados)."""
    months = []
    y, m = 2025, 1
    while (y, m) <= (NOW.year, NOW.month):
        weight = 5 if y == 2025 else 1
        months.append((y, m, weight))
        m += 1
        if m > 12:
            m = 1
            y += 1
    return months


def pick_month(mw):
    weights = [w for _, _, w in mw]
    chosen = random.choices(mw, weights=weights, k=1)[0]
    return chosen[0], chosen[1]


def seed():
    db = Session()
    try:
        mw = monthly_weights_since_2025()
        print(f"Rango de meses: {mw[0][0]}-{mw[0][1]:02d} a {mw[-1][0]}-{mw[-1][1]:02d}")

        print("Creando usuarios...")
        user_ids = []
        target_users = 200

        while len(user_ids) < target_users:
            year, month = pick_month(mw)
            created = random_date_in_month(year, month)
            city, state = random.choice(CITIES)
            role = random.choices(ROLES, weights=[60, 40])[0]
            blood_type = random.choice([None] + BLOOD_TYPES)
            username = (fake.user_name()[:40] + str(random.randint(100, 999))).replace(".", "_")
            email = fake.unique.email()

            try:
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
                    "email":          email,
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
            except IntegrityError:
                db.rollback()
                continue

        print(f"  {len(user_ids)} usuarios creados.")

        print("Creando insumos...")
        supply_ids = []
        type_weights = [35, 30, 35]

        for _ in range(400):
            year, month = pick_month(mw)
            created = random_date_in_month(year, month)
            stype = random.choices(SUPPLY_TYPES, weights=type_weights)[0]
            title = random.choice(SUPPLY_TITLES[stype])
            city, state = random.choice(CITIES)
            owner_id = random.choice(user_ids)
            price = round(random.uniform(200, 8000), 2) if stype == "VENTA" else None
            status = random.choices(
                STATUSES[:3],
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
                "desc":       SUPPLY_DESCRIPTIONS[title],
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

        print("Creando solicitudes de contacto...")
        req_count = 0
        seen = set()
        req_status_weights = [20, 20, 15, 10, 35]

        for _ in range(350):
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
        print("\nOK: Base de datos ampliada con datos desde enero 2025.")
        print("  Contraseña de todos los usuarios de prueba: Test1234!")

    except Exception as e:
        db.rollback()
        print(f"\nERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
