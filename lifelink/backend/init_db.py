"""Script para inicializar la base de datos con datos de prueba."""
from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole, BloodType
from app.models.supply import Supply, Category, SupplyType, SupplyCategory, SupplyCondition
from app.models import *  # registra todos los modelos en Base.metadata
from app.utils.security import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

if not db.query(User).filter(User.username == "admin").first():
    admin = User(
        email="admin@lifelink.com",
        username="admin",
        hashed_password=hash_password("admin123"),
        full_name="Administrador LifeLink",
        role=UserRole.ADMIN,
        is_verified=True,
        city="Ciudad de México",
        state="CDMX",
    )
    db.add(admin)

    donante = User(
        email="donante@test.com",
        username="donante1",
        hashed_password=hash_password("test123"),
        full_name="María García López",
        role=UserRole.DONANTE,
        phone="5551234567",
        city="Ciudad de México",
        state="CDMX",
        blood_type=BloodType.O_POSITIVE,
        is_blood_donor=True,
        bio="Donante activa de equipo médico y sangre.",
    )
    db.add(donante)

    solicitante = User(
        email="solicitante@test.com",
        username="solicitante1",
        hashed_password=hash_password("test123"),
        full_name="Carlos Ramírez Ortiz",
        role=UserRole.SOLICITANTE,
        phone="5559876543",
        city="Guadalajara",
        state="Jalisco",
        bio="Buscando equipo de rehabilitación para mi abuela.",
    )
    db.add(solicitante)
    db.commit()

    categorias = [
        ("Ortopédico", "Sillas de ruedas, muletas, andaderas", "🦴"),
        ("Rehabilitación", "Equipos de terapia física", "💪"),
        ("Diagnóstico", "Equipos de medición y monitoreo", "🔬"),
        ("Prótesis", "Prótesis y órtesis", "🦿"),
        ("Mobiliario", "Camas hospitalarias, mesas", "🛏️"),
        ("Consumibles", "Material de curación, jeringas", "💉"),
        ("Sangre", "Donación de sangre y derivados", "🩸"),
        ("Otro", "Otros insumos médicos", "📦"),
    ]
    for name, desc, icon in categorias:
        db.add(Category(name=name, description=desc, icon=icon))
    db.commit()

    donante_db = db.query(User).filter(User.username == "donante1").first()
    supplies_data = [
        {
            "title": "Silla de ruedas plegable",
            "description": "Silla de ruedas en excelente estado, poco uso. Incluye cojín y bolsa trasera.",
            "supply_type": SupplyType.DONACION,
            "category": SupplyCategory.ORTOPEDICO,
            "condition": SupplyCondition.SEMINUEVO,
            "city": "Ciudad de México",
            "state": "CDMX",
            "quantity": 1,
            "brand": "Ottobock",
            "is_urgent": False,
        },
        {
            "title": "Muletas de aluminio ajustables",
            "description": "Par de muletas de aluminio ajustables, resistentes y ligeras.",
            "supply_type": SupplyType.DONACION,
            "category": SupplyCategory.ORTOPEDICO,
            "condition": SupplyCondition.USADO_BUEN_ESTADO,
            "city": "Ciudad de México",
            "state": "CDMX",
            "quantity": 1,
            "brand": "Drive Medical",
            "is_urgent": False,
        },
        {
            "title": "Oxímetro de pulso digital",
            "description": "Oxímetro de pulso en perfecto estado. Mide saturación de oxígeno y frecuencia cardíaca.",
            "supply_type": SupplyType.VENTA,
            "category": SupplyCategory.DIAGNOSTICO,
            "condition": SupplyCondition.NUEVO,
            "price": 350.0,
            "city": "Ciudad de México",
            "state": "CDMX",
            "quantity": 3,
            "brand": "Contec",
            "is_urgent": True,
        },
    ]
    for sdata in supplies_data:
        db.add(Supply(**sdata, owner_id=donante_db.id))
    db.commit()

    print("Base de datos inicializada con datos de prueba")
else:
    print("La base de datos ya contiene datos")

db.close()
