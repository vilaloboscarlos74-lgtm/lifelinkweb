"""
Seed script — populates LifeLink DB with realistic Mexican data.
Run from the backend/ directory:
    python seed.py
"""
import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.request import ContactRequest, RequestStatus
from app.models.message import Message
from app.models.notification import Notification, NotificationType
from app.models.supply import Supply, SupplyType, SupplyCategory, SupplyCondition, SupplyStatus, SupplyImage, Favorite
from app.models.review import Review
from app.utils.security import hash_password
from datetime import datetime, timezone, timedelta
from sqlalchemy import text
import random

# Map display blood type values to actual PostgreSQL enum values
BLOOD_TYPE_DB = {
    "O+": "O_POS", "O-": "O_NEG",
    "A+": "A_POS", "A-": "A_NEG",
    "B+": "B_POS", "B-": "B_NEG",
    "AB+": "AB_POS", "AB-": "AB_NEG",
}

Base.metadata.create_all(bind=engine)

USERS = [
    {
        "email": "admin@lifelink.mx",
        "username": "admin",
        "password": "admin123",
        "full_name": "Administrador LifeLink",
        "role": UserRole.ADMIN,
        "city": "Ciudad de México",
        "state": "Ciudad de México",
        "bio": "Administrador de la plataforma LifeLink.",
        "blood_type": "O+",
        "is_blood_donor": True,
        "is_verified": True,
    },
    {
        "email": "maria.garcia@example.mx",
        "username": "maria_garcia",
        "password": "password123",
        "full_name": "María García López",
        "role": UserRole.DONANTE,
        "city": "Guadalajara",
        "state": "Jalisco",
        "phone": "3312345678",
        "bio": "Donante de equipo médico ortopédico. Mi hijo ya no necesita su silla y quiero ayudar a alguien que sí lo necesite.",
        "blood_type": "A+",
        "is_blood_donor": True,
        "is_verified": True,
    },
    {
        "email": "carlos.mendoza@example.mx",
        "username": "carlos_mendoza",
        "password": "password123",
        "full_name": "Carlos Mendoza Ruiz",
        "role": UserRole.DONANTE,
        "city": "Monterrey",
        "state": "Nuevo León",
        "phone": "8187654321",
        "bio": "Enfermero jubilado con equipo médico en buen estado para donar.",
        "blood_type": "B+",
        "is_blood_donor": False,
        "is_verified": True,
    },
    {
        "email": "ana.rodriguez@example.mx",
        "username": "ana_rodriguez",
        "password": "password123",
        "full_name": "Ana Rodríguez Vega",
        "role": UserRole.SOLICITANTE,
        "city": "Puebla",
        "state": "Puebla",
        "phone": "2221234567",
        "bio": "Buscando equipo de rehabilitación para mi mamá.",
        "blood_type": "O-",
        "is_blood_donor": True,
        "is_verified": False,
    },
    {
        "email": "jose.hernandez@example.mx",
        "username": "jose_hernandez",
        "password": "password123",
        "full_name": "José Hernández Torres",
        "role": UserRole.DONANTE,
        "city": "Ciudad de México",
        "state": "Ciudad de México",
        "phone": "5551234567",
        "bio": "Médico familiar. Tengo equipo de diagnóstico que ya no uso.",
        "blood_type": "AB+",
        "is_blood_donor": True,
        "is_verified": True,
    },
    {
        "email": "lucia.martinez@example.mx",
        "username": "lucia_martinez",
        "password": "password123",
        "full_name": "Lucía Martínez Soto",
        "role": UserRole.DONANTE,
        "city": "Tijuana",
        "state": "Baja California",
        "bio": "Comprometida con apoyar a personas con discapacidad.",
        "blood_type": "A-",
        "is_blood_donor": True,
        "is_verified": True,
    },
    {
        "email": "roberto.flores@example.mx",
        "username": "roberto_flores",
        "password": "password123",
        "full_name": "Roberto Flores Díaz",
        "role": UserRole.SOLICITANTE,
        "city": "Mérida",
        "state": "Yucatán",
        "bio": "Buscando cama hospitalaria para cuidado en casa.",
        "blood_type": "O+",
        "is_blood_donor": False,
        "is_verified": False,
    },
    {
        "email": "elena.lopez@example.mx",
        "username": "elena_lopez",
        "password": "password123",
        "full_name": "Elena López Fuentes",
        "role": UserRole.DONANTE,
        "city": "Querétaro",
        "state": "Querétaro",
        "bio": "Fisioterapeuta con equipo de rehabilitación para compartir.",
        "blood_type": "B-",
        "is_blood_donor": True,
        "is_verified": True,
    },
    {
        "email": "miguel.sanchez@example.mx",
        "username": "miguel_sanchez",
        "password": "password123",
        "full_name": "Miguel Sánchez Reyes",
        "role": UserRole.SOLICITANTE,
        "city": "Guadalajara",
        "state": "Jalisco",
        "bio": "Cuidador de adulto mayor. Buscando equipo asequible.",
        "blood_type": "AB-",
        "is_blood_donor": False,
        "is_verified": False,
    },
    {
        "email": "patricia.gomez@example.mx",
        "username": "patricia_gomez",
        "password": "password123",
        "full_name": "Patricia Gómez Castillo",
        "role": UserRole.DONANTE,
        "city": "Monterrey",
        "state": "Nuevo León",
        "phone": "8191234567",
        "bio": "Enfermera. Quiero que mi equipo ayude a alguien más.",
        "blood_type": "O+",
        "is_blood_donor": True,
        "is_verified": True,
    },
]

SUPPLIES_DATA = [
    # ─── Ortopédico ───
    {
        "title": "Silla de ruedas plegable Drive Medical",
        "description": "Silla de ruedas plegable de aluminio, modelo STD18FA-4E. Poco uso, en excelente estado. Mi padre se recuperó y ya no la necesita. Incluye reposapiés desmontable y cinturón de seguridad.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.ORTOPEDICO,
        "condition": SupplyCondition.SEMINUEVO,
        "city": "Guadalajara",
        "state": "Jalisco",
        "brand": "Drive Medical",
        "model": "STD18FA-4E",
        "is_urgent": False,
        "owner_username": "maria_garcia",
    },
    {
        "title": "Muletas de aluminio ajustables (par)",
        "description": "Par de muletas de aluminio ajustables en altura, con punta antideslizante. Estado impecable, usadas solo 3 semanas después de una fractura de tobillo.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.ORTOPEDICO,
        "condition": SupplyCondition.SEMINUEVO,
        "city": "Ciudad de México",
        "state": "Ciudad de México",
        "is_urgent": False,
        "owner_username": "jose_hernandez",
    },
    {
        "title": "Bastón cuádruple con base antideslizante",
        "description": "Bastón cuádruple de aluminio con base de 4 puntos para mayor estabilidad. Regulable en altura. Color negro. Perfecto para adultos mayores o personas en rehabilitación.",
        "supply_type": SupplyType.VENTA,
        "category": SupplyCategory.ORTOPEDICO,
        "condition": SupplyCondition.USADO_BUEN_ESTADO,
        "price": 350.0,
        "city": "Monterrey",
        "state": "Nuevo León",
        "is_urgent": False,
        "owner_username": "carlos_mendoza",
    },
    {
        "title": "Andadera plegable con frenos y asiento",
        "description": "Andadera tipo rollator con asiento, 4 ruedas y frenos de mano. Color azul marino. Ideal para personas mayores. Se dobla para guardar en el coche.",
        "supply_type": SupplyType.VENTA,
        "category": SupplyCategory.ORTOPEDICO,
        "condition": SupplyCondition.USADO_BUEN_ESTADO,
        "price": 980.0,
        "city": "Querétaro",
        "state": "Querétaro",
        "brand": "Invacare",
        "is_urgent": False,
        "owner_username": "elena_lopez",
    },
    {
        "title": "Collarín cervical blando talla M",
        "description": "Collarín cervical blando talla M, sin uso. Lo compré por prevención pero nunca lo usé. Ideal para personas con cervicalgia leve.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.ORTOPEDICO,
        "condition": SupplyCondition.NUEVO,
        "city": "Mérida",
        "state": "Yucatán",
        "is_urgent": False,
        "owner_username": "elena_lopez",
    },

    # ─── Rehabilitación ───
    {
        "title": "Bicicleta estacionaria de rehabilitación",
        "description": "Bicicleta estacionaria con resistencia magnética, pantalla LCD y pedales con correas. Ideal para rehabilitación de rodilla o cadera. Poca resistencia, perfecta para terapia.",
        "supply_type": SupplyType.VENTA,
        "category": SupplyCategory.REHABILITACION,
        "condition": SupplyCondition.USADO_BUEN_ESTADO,
        "price": 2500.0,
        "city": "Ciudad de México",
        "state": "Ciudad de México",
        "brand": "Kettler",
        "is_urgent": False,
        "owner_username": "jose_hernandez",
    },
    {
        "title": "Bandas de resistencia terapéuticas (set 5 piezas)",
        "description": "Set de 5 bandas de resistencia terapéutica Theraband con diferentes niveles (amarilla, roja, verde, azul, negra). Perfectas para fisioterapia en casa. Apenas usadas.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.REHABILITACION,
        "condition": SupplyCondition.SEMINUEVO,
        "city": "Querétaro",
        "state": "Querétaro",
        "brand": "Theraband",
        "quantity": 5,
        "is_urgent": False,
        "owner_username": "elena_lopez",
    },
    {
        "title": "Pelota Bosu para equilibrio y fisioterapia",
        "description": "Pelota Bosu 65cm para ejercicios de equilibrio, rehabilitación y core. Excelente estado, sin pinchaduras. Incluye bomba de inflado.",
        "supply_type": SupplyType.VENTA,
        "category": SupplyCategory.REHABILITACION,
        "condition": SupplyCondition.USADO_BUEN_ESTADO,
        "price": 750.0,
        "city": "Guadalajara",
        "state": "Jalisco",
        "is_urgent": False,
        "owner_username": "miguel_sanchez",
    },
    {
        "title": "Estimulador eléctrico TENS para dolor muscular",
        "description": "Estimulador eléctrico tipo TENS/EMS con 4 electrodos, 8 modos de estimulación y pantalla digital. Úsalo para alivio del dolor, rehabilitación muscular y relajación. Incluye electrodos y cable.",
        "supply_type": SupplyType.VENTA,
        "category": SupplyCategory.REHABILITACION,
        "condition": SupplyCondition.SEMINUEVO,
        "price": 1200.0,
        "city": "Monterrey",
        "state": "Nuevo León",
        "brand": "Omron",
        "model": "PM3030",
        "is_urgent": True,
        "owner_username": "patricia_gomez",
    },

    # ─── Diagnóstico ───
    {
        "title": "Glucómetro Accu-Chek Active con tiras",
        "description": "Glucómetro Accu-Chek Active con 50 tiras reactivas, lancetas y estuche. Mi mamá empezó a usar insulina y cambió a un modelo más avanzado. Funciona perfecto.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.DIAGNOSTICO,
        "condition": SupplyCondition.USADO_BUEN_ESTADO,
        "city": "Puebla",
        "state": "Puebla",
        "brand": "Accu-Chek",
        "model": "Active",
        "is_urgent": True,
        "owner_username": "ana_rodriguez",
    },
    {
        "title": "Tensiómetro digital de brazo Omron M3",
        "description": "Tensiómetro de brazo digital Omron M3 con memoria para 2 usuarios (60 registros c/u), detección de arritmia y adaptador incluido. Excelente precisión clínica.",
        "supply_type": SupplyType.VENTA,
        "category": SupplyCategory.DIAGNOSTICO,
        "condition": SupplyCondition.SEMINUEVO,
        "price": 850.0,
        "city": "Ciudad de México",
        "state": "Ciudad de México",
        "brand": "Omron",
        "model": "M3",
        "is_urgent": False,
        "owner_username": "jose_hernandez",
    },
    {
        "title": "Estetoscopio 3M Littmann Classic III",
        "description": "Estetoscopio 3M Littmann Classic III binaural, color negro, estado seminuevo. Perfecto para médicos, enfermeros o estudiantes de salud. Viene con estuche original.",
        "supply_type": SupplyType.VENTA,
        "category": SupplyCategory.DIAGNOSTICO,
        "condition": SupplyCondition.SEMINUEVO,
        "price": 1800.0,
        "city": "Monterrey",
        "state": "Nuevo León",
        "brand": "3M Littmann",
        "model": "Classic III",
        "is_urgent": False,
        "owner_username": "carlos_mendoza",
    },
    {
        "title": "Oxímetro de pulso portátil Contec",
        "description": "Oxímetro de dedo digital Contec con pantalla OLED, mide SpO2 y frecuencia cardiaca. Incluye funda protectora y correa. Funciona con 2 pilas AAA.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.DIAGNOSTICO,
        "condition": SupplyCondition.USADO_BUEN_ESTADO,
        "city": "Tijuana",
        "state": "Baja California",
        "brand": "Contec",
        "is_urgent": False,
        "owner_username": "lucia_martinez",
    },

    # ─── Prótesis ───
    {
        "title": "Prótesis de mano articulada mecánica",
        "description": "Prótesis de mano articulada mecánica de gancho de acero inoxidable, talla adulto mediano. Se adquirió pero no se adaptó al paciente. Completamente nueva y sin uso.",
        "supply_type": SupplyType.INTERCAMBIO,
        "category": SupplyCategory.PROTESIS,
        "condition": SupplyCondition.NUEVO,
        "city": "Ciudad de México",
        "state": "Ciudad de México",
        "is_urgent": True,
        "owner_username": "jose_hernandez",
    },
    {
        "title": "Pie protésico SACH talla 26",
        "description": "Pie protésico tipo SACH (Solid Ankle Cushion Heel) talla 26 para adulto. Pocas horas de uso, en perfecto estado funcional. Requiere adaptación con técnico ortesista.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.PROTESIS,
        "condition": SupplyCondition.SEMINUEVO,
        "city": "Guadalajara",
        "state": "Jalisco",
        "is_urgent": True,
        "owner_username": "maria_garcia",
    },

    # ─── Mobiliario ───
    {
        "title": "Cama hospitalaria manual de 2 manivelas",
        "description": "Cama hospitalaria articulada manual de acero con 2 manivelas (cabecero y piernas). Incluye colchón antiescara y barandales laterales removibles. Usada 6 meses para cuidado en casa.",
        "supply_type": SupplyType.VENTA,
        "category": SupplyCategory.MOBILIARIO,
        "condition": SupplyCondition.USADO_BUEN_ESTADO,
        "price": 5500.0,
        "city": "Monterrey",
        "state": "Nuevo León",
        "brand": "Promek",
        "is_urgent": False,
        "owner_username": "patricia_gomez",
    },
    {
        "title": "Silla de baño con respaldo y apoyabrazos",
        "description": "Silla de ducha de aluminio con respaldo y apoyabrazos, altura ajustable, asiento de PVC. Antideslizante. Perfecta para personas mayores o en recuperación.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.MOBILIARIO,
        "condition": SupplyCondition.USADO_BUEN_ESTADO,
        "city": "Querétaro",
        "state": "Querétaro",
        "is_urgent": False,
        "owner_username": "elena_lopez",
    },
    {
        "title": "Sillón reclinable para adulto mayor",
        "description": "Sillón reclinable con palanca lateral, espuma de alta densidad y fácil limpieza. Ideal para adultos mayores con movilidad reducida. Color beige, excelente estado.",
        "supply_type": SupplyType.VENTA,
        "category": SupplyCategory.MOBILIARIO,
        "condition": SupplyCondition.SEMINUEVO,
        "price": 3200.0,
        "city": "Ciudad de México",
        "state": "Ciudad de México",
        "is_urgent": False,
        "owner_username": "jose_hernandez",
    },
    {
        "title": "Mesa puente regulable para cama",
        "description": "Mesa puente sobre cama de altura ajustable, con ruedas y superficie de madera laminada. Perfecta para comer, leer o trabajar desde la cama.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.MOBILIARIO,
        "condition": SupplyCondition.USADO_BUEN_ESTADO,
        "city": "Tijuana",
        "state": "Baja California",
        "is_urgent": False,
        "owner_username": "lucia_martinez",
    },

    # ─── Consumibles ───
    {
        "title": "Jeringas desechables 5ml (caja 100 piezas)",
        "description": "Caja de 100 jeringas desechables de 5ml con aguja 21G x 1½ pulgadas. Sin abrir, caducidad 2027. Las compré por error de talla.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.CONSUMIBLES,
        "condition": SupplyCondition.NUEVO,
        "city": "Puebla",
        "state": "Puebla",
        "quantity": 100,
        "is_urgent": True,
        "owner_username": "ana_rodriguez",
    },
    {
        "title": "Guantes de látex sin polvo talla M (caja 100)",
        "description": "Caja de 100 guantes de látex sin polvo talla M, sin abrir. Caducidad junio 2026. Los tenía de la pandemia y ya no los necesito.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.CONSUMIBLES,
        "condition": SupplyCondition.NUEVO,
        "city": "Guadalajara",
        "state": "Jalisco",
        "quantity": 100,
        "is_urgent": False,
        "owner_username": "maria_garcia",
    },
    {
        "title": "Gasas estériles 10x10cm (paquete 100 piezas)",
        "description": "Paquete de 100 gasas estériles de 10x10cm, individualmente empacadas. Caducidad 2026. Perfectas para curas y vendajes.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.CONSUMIBLES,
        "condition": SupplyCondition.NUEVO,
        "city": "Ciudad de México",
        "state": "Ciudad de México",
        "quantity": 100,
        "is_urgent": False,
        "owner_username": "jose_hernandez",
    },
    {
        "title": "Pañales adulto Tena talla G (paquete 20)",
        "description": "Paquete de 20 pañales para adulto Tena Stretch talla Grande. Mi familiar falleció y sobró el paquete sin abrir. Caducidad 2027.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.CONSUMIBLES,
        "condition": SupplyCondition.NUEVO,
        "city": "Mérida",
        "state": "Yucatán",
        "brand": "Tena",
        "is_urgent": True,
        "owner_username": "roberto_flores",
    },

    # ─── Sangre ───
    {
        "title": "Búsqueda urgente: donador de sangre O-",
        "description": "Mi hermano necesita transfusión urgente en el Hospital Civil de Guadalajara. Sangre tipo O negativo. La operación es el lunes. Por favor contáctame si puedes ayudar.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.SANGRE,
        "condition": SupplyCondition.NUEVO,
        "city": "Guadalajara",
        "state": "Jalisco",
        "is_urgent": True,
        "owner_username": "miguel_sanchez",
    },
    {
        "title": "Donación de sangre A+ — disponible en CDMX",
        "description": "Soy donante activo de sangre tipo A positivo, registrado en el IMSS. Disponible para donación directa o al banco de sangre. Me puedo trasladar al hospital que necesiten en CDMX.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.SANGRE,
        "condition": SupplyCondition.NUEVO,
        "city": "Ciudad de México",
        "state": "Ciudad de México",
        "is_urgent": False,
        "owner_username": "jose_hernandez",
    },

    # ─── Otro ───
    {
        "title": "Nebulizador Ultrasónico Beurer IH30",
        "description": "Nebulizador ultrasónico Beurer IH30 silencioso, partículas de 5 micrómetros, deposito de 200ml y batería recargable. Perfecto para asma y problemas respiratorios.",
        "supply_type": SupplyType.VENTA,
        "category": SupplyCategory.OTRO,
        "condition": SupplyCondition.SEMINUEVO,
        "price": 1100.0,
        "city": "Monterrey",
        "state": "Nuevo León",
        "brand": "Beurer",
        "model": "IH30",
        "is_urgent": False,
        "owner_username": "carlos_mendoza",
    },
    {
        "title": "Termómetro infrarrojo sin contacto",
        "description": "Termómetro digital infrarrojo sin contacto, medición en 1 segundo, memoria de 30 lecturas, alarma de fiebre. Funciona a pilas (incluidas). Lectura frontal o de oído.",
        "supply_type": SupplyType.DONACION,
        "category": SupplyCategory.OTRO,
        "condition": SupplyCondition.USADO_BUEN_ESTADO,
        "city": "Tijuana",
        "state": "Baja California",
        "is_urgent": False,
        "owner_username": "lucia_martinez",
    },
    {
        "title": "Silla geriátrica con descansabrazos acolchados",
        "description": "Silla geriátrica de madera con asiento y respaldo tapizados en tela lavable. Descansabrazos acolchados y patas con protectores antideslizantes. En muy buen estado.",
        "supply_type": SupplyType.VENTA,
        "category": SupplyCategory.OTRO,
        "condition": SupplyCondition.USADO_BUEN_ESTADO,
        "price": 1500.0,
        "city": "Querétaro",
        "state": "Querétaro",
        "is_urgent": False,
        "owner_username": "elena_lopez",
    },
]


def seed(force=False):
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            if not force:
                print("La base de datos ya tiene datos. Usa --force para limpiar y resembrar.")
                return
            print("Limpiando datos existentes...")
            db.query(Review).delete()
            db.query(Notification).delete()
            db.query(Message).delete()
            db.query(ContactRequest).delete()
            db.query(Favorite).delete()
            db.query(SupplyImage).delete()
            db.query(Supply).delete()
            db.query(User).delete()
            db.commit()
            print("Tablas limpiadas.")

        print("[seed] Sembrando usuarios...")
        user_map = {}
        for u in USERS:
            user = User(
                email=u["email"],
                username=u["username"],
                hashed_password=hash_password(u["password"]),
                full_name=u["full_name"],
                role=u.get("role", UserRole.SOLICITANTE),
                city=u.get("city"),
                state=u.get("state"),
                phone=u.get("phone"),
                bio=u.get("bio"),
                # blood_type set via raw SQL below to avoid SQLAlchemy enum name coercion
                is_blood_donor=u.get("is_blood_donor", False),
                is_verified=u.get("is_verified", False),
                rating_avg=0.0,
            )
            db.add(user)
            user_map[u["username"]] = user
        db.flush()

        # Set blood_type via raw SQL — SQLAlchemy sends enum *name* (O_POSITIVE) but
        # the DB enum uses different values (O_POS), so ORM assignment fails.
        for u in USERS:
            bt_display = u.get("blood_type")
            if bt_display:
                db_val = BLOOD_TYPE_DB.get(bt_display)
                if db_val:
                    db.execute(
                        text("UPDATE users SET blood_type = CAST(:bt AS bloodtype) WHERE username = :uname"),
                        {"bt": db_val, "uname": u["username"]},
                    )
        db.flush()
        print(f"   ✓ {len(USERS)} usuarios creados")

        print("🏥 Sembrando insumos...")
        supply_map = []
        for i, s in enumerate(SUPPLIES_DATA):
            owner = user_map[s["owner_username"]]
            supply = Supply(
                title=s["title"],
                description=s["description"],
                supply_type=s["supply_type"],
                category=s["category"],
                condition=s.get("condition"),
                status=SupplyStatus.DISPONIBLE,
                price=s.get("price"),
                city=s.get("city"),
                state=s.get("state"),
                brand=s.get("brand"),
                model=s.get("model"),
                quantity=s.get("quantity", 1),
                is_urgent=s.get("is_urgent", False),
                views_count=random.randint(5, 150),
                owner_id=owner.id,
                created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60)),
            )
            db.add(supply)
            supply_map.append(supply)
        db.flush()
        print(f"   ✓ {len(SUPPLIES_DATA)} insumos creados")

        print("📨 Sembrando solicitudes y mensajes...")
        # Request 1: ana_rodriguez → maria_garcia (silla de ruedas) — COMPLETADA
        req1 = ContactRequest(
            sender_id=user_map["ana_rodriguez"].id,
            receiver_id=user_map["maria_garcia"].id,
            supply_id=supply_map[0].id,
            message="Hola María, me interesa mucho la silla de ruedas para mi mamá. ¿Podría venir a verla?",
            status=RequestStatus.COMPLETADA,
            responded_at=datetime.now(timezone.utc) - timedelta(days=10),
        )
        db.add(req1)
        db.flush()

        msgs_req1 = [
            ("ana_rodriguez", "Hola María, me interesa mucho la silla de ruedas para mi mamá. ¿Podría venir a verla?"),
            ("maria_garcia", "¡Claro que sí! Estoy en Guadalajara. ¿Cuándo te viene bien?"),
            ("ana_rodriguez", "Podría el sábado por la tarde, si te parece bien."),
            ("maria_garcia", "Perfecto, el sábado a las 4pm. Te mando mi ubicación por aquí."),
            ("ana_rodriguez", "¡Muchas gracias! Mi mamá está muy emocionada."),
            ("maria_garcia", "Es un placer poder ayudar. Hasta el sábado 😊"),
        ]
        for username, content in msgs_req1:
            db.add(Message(
                request_id=req1.id,
                sender_id=user_map[username].id,
                content=content,
                is_read=True,
                created_at=datetime.now(timezone.utc) - timedelta(days=12, hours=random.randint(0, 5)),
            ))

        # Request 2: roberto_flores → carlos_mendoza (bastón) — ACEPTADA activa
        req2 = ContactRequest(
            sender_id=user_map["roberto_flores"].id,
            receiver_id=user_map["carlos_mendoza"].id,
            supply_id=supply_map[2].id,
            message="Buenos días, ¿el bastón todavía está disponible? Es para mi abuelo.",
            status=RequestStatus.ACEPTADA,
            responded_at=datetime.now(timezone.utc) - timedelta(days=2),
        )
        db.add(req2)
        db.flush()

        msgs_req2 = [
            ("roberto_flores", "Buenos días, ¿el bastón todavía está disponible? Es para mi abuelo."),
            ("carlos_mendoza", "¡Sí, claro! Sigue disponible. ¿Cómo le puedo ayudar?"),
            ("roberto_flores", "Perfecto. ¿Cuál es su precio final? ¿Acepta transferencia?"),
            ("carlos_mendoza", "Sí acepto transferencia. El precio es el publicado, $350 MXN. ¿Está en Monterrey?"),
            ("roberto_flores", "No, estoy en Mérida. ¿Podría enviarlo por paquetería?"),
            ("carlos_mendoza", "Claro, pero el envío corre por su cuenta. Más o menos unos $150 extra."),
        ]
        for username, content in msgs_req2:
            db.add(Message(
                request_id=req2.id,
                sender_id=user_map[username].id,
                content=content,
                is_read=True,
                created_at=datetime.now(timezone.utc) - timedelta(days=2, hours=random.randint(0, 3)),
            ))

        # Request 3: miguel_sanchez → elena_lopez (bandas) — PENDIENTE
        req3 = ContactRequest(
            sender_id=user_map["miguel_sanchez"].id,
            receiver_id=user_map["elena_lopez"].id,
            supply_id=supply_map[6].id,
            message="Hola Elena, mi papá necesita las bandas de resistencia para su recuperación. ¿Las donas sin costo?",
            status=RequestStatus.PENDIENTE,
        )
        db.add(req3)
        db.flush()

        print("   ✓ 3 solicitudes y mensajes creados")

        print("⭐ Sembrando reseñas...")
        # Reseña de ana_rodriguez a maria_garcia (req1 completada)
        rev1 = Review(
            reviewer_id=user_map["ana_rodriguez"].id,
            reviewed_id=user_map["maria_garcia"].id,
            request_id=req1.id,
            rating=5,
            comment="María es una persona increíble. La silla llegó en perfectas condiciones y fue muy amable durante todo el proceso. ¡100% recomendada!",
            created_at=datetime.now(timezone.utc) - timedelta(days=8),
        )
        db.add(rev1)

        # Reseña de maria_garcia a ana_rodriguez (req1)
        rev2 = Review(
            reviewer_id=user_map["maria_garcia"].id,
            reviewed_id=user_map["ana_rodriguez"].id,
            request_id=req1.id,
            rating=5,
            comment="Ana fue muy puntual y amable. Se nota que realmente necesitaba el equipo para su mamá. Fue una experiencia muy bonita poder ayudar.",
            created_at=datetime.now(timezone.utc) - timedelta(days=7),
        )
        db.add(rev2)
        db.flush()

        # Actualizar ratings
        user_map["maria_garcia"].rating_avg = 5.0
        user_map["ana_rodriguez"].rating_avg = 5.0
        print("   ✓ 2 reseñas creadas")

        print("🔔 Sembrando notificaciones...")
        notifs = [
            Notification(
                user_id=user_map["maria_garcia"].id,
                type=NotificationType.SOLICITUD_NUEVA,
                title="Nueva solicitud de contacto",
                content="Ana Rodríguez Vega quiere contactarte",
                link="/requests",
                is_read=True,
                created_at=datetime.now(timezone.utc) - timedelta(days=12),
            ),
            Notification(
                user_id=user_map["ana_rodriguez"].id,
                type=NotificationType.SOLICITUD_ACEPTADA,
                title="¡Solicitud aceptada! ✓",
                content="María García López aceptó tu solicitud, ya puedes chatear",
                link=f"/messages/{req1.id}",
                is_read=True,
                created_at=datetime.now(timezone.utc) - timedelta(days=11),
            ),
            Notification(
                user_id=user_map["carlos_mendoza"].id,
                type=NotificationType.SOLICITUD_NUEVA,
                title="Nueva solicitud de contacto",
                content="Roberto Flores Díaz quiere contactarte",
                link="/requests",
                is_read=False,
                created_at=datetime.now(timezone.utc) - timedelta(days=2),
            ),
            Notification(
                user_id=user_map["elena_lopez"].id,
                type=NotificationType.SOLICITUD_NUEVA,
                title="Nueva solicitud de contacto",
                content="Miguel Sánchez Reyes quiere contactarte",
                link="/requests",
                is_read=False,
                created_at=datetime.now(timezone.utc) - timedelta(hours=3),
            ),
            Notification(
                user_id=user_map["ana_rodriguez"].id,
                type=NotificationType.RESENA_NUEVA,
                title="Nueva reseña",
                content="María García López te dejó una reseña de 5 estrellas",
                link="/profile",
                is_read=False,
                created_at=datetime.now(timezone.utc) - timedelta(days=7),
            ),
        ]
        for n in notifs:
            db.add(n)
        print(f"   ✓ {len(notifs)} notificaciones creadas")

        db.commit()
        print("\n✅ Base de datos sembrada exitosamente.")
        print("\nCuentas disponibles:")
        print("  admin@lifelink.mx          / admin123  (Admin)")
        print("  maria.garcia@example.mx    / password123 (Donante - Guadalajara)")
        print("  carlos.mendoza@example.mx  / password123 (Donante - Monterrey)")
        print("  ana.rodriguez@example.mx   / password123 (Solicitante - Puebla)")
        print("  jose.hernandez@example.mx  / password123 (Donante - CDMX)")
        print("  lucia.martinez@example.mx  / password123 (Donante - Tijuana)")
        print("  roberto.flores@example.mx  / password123 (Solicitante - Mérida)")
        print("  elena.lopez@example.mx     / password123 (Donante - Querétaro)")
        print("  miguel.sanchez@example.mx  / password123 (Solicitante - Guadalajara)")
        print("  patricia.gomez@example.mx  / password123 (Donante - Monterrey)")

    except Exception as e:
        db.rollback()
        print(f"\nERROR al sembrar: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    force = "--force" in sys.argv
    seed(force=force)
