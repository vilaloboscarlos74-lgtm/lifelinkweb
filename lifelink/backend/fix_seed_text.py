"""
Corrige los títulos y descripciones generados por Faker en seed_data.py / seed_2025.py.

Faker genera párrafos de palabras sueltas en español sin sentido real (estilo
"lorem ipsum"), y agrega una palabra aleatoria al final de algunos títulos.
Este script reemplaza ambos campos por texto realista, sin borrar ni crear filas.

Uso:
    cd backend
    DATABASE_URL="postgresql://..." python fix_seed_text.py
"""

import os
import sys
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    print("ERROR: define DATABASE_URL")
    sys.exit(1)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# título canónico -> descripción realista de reemplazo
FIXES = {
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


def fix():
    total_updated = 0
    with engine.begin() as conn:
        for canonical_title, description in FIXES.items():
            result = conn.execute(text("""
                UPDATE supplies
                SET title = :title, description = :desc
                WHERE title LIKE :pattern
            """), {
                "title": canonical_title,
                "desc": description,
                "pattern": f"{canonical_title}%",
            })
            print(f"  {canonical_title!r}: {result.rowcount} filas actualizadas")
            total_updated += result.rowcount

    print(f"\nOK: {total_updated} insumos actualizados con texto realista.")


if __name__ == "__main__":
    fix()
