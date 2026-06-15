from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os

router = APIRouter(prefix="/ai", tags=["ai"])

SYSTEM_PROMPT = """Eres el asistente virtual de LifeLink, una plataforma mexicana para el intercambio de insumos médicos. Ayuda a los usuarios de manera amable, clara y concisa. Responde siempre en español.

## Sobre LifeLink
- Plataforma gratuita para donar, intercambiar y solicitar insumos médicos (medicamentos, equipos, material quirúrgico, etc.)
- Los usuarios pueden publicar insumos disponibles o solicitar insumos que necesitan
- Hay un sistema de mensajería para coordinar intercambios entre usuarios
- Existe un módulo de donación de sangre para conectar donantes con quienes necesitan

## Cómo usar la plataforma
- **Publicar un insumo**: Ir a "Publicar" → completar el formulario con nombre, descripción, tipo (donación, venta, intercambio, solicitud), ubicación e imágenes opcionales
- **Buscar insumos**: Usar el buscador en "Insumos" con filtros por tipo, categoría y ubicación
- **Solicitar contacto**: En la página de un insumo, hacer clic en "Solicitar" para contactar al publicante
- **Donación de sangre**: Registrar perfil en "Donantes de sangre" para aparecer en la búsqueda de donantes
- **Favoritos**: Guardar insumos marcando el corazón en cada publicación
- **Alertas de búsqueda**: Activar alertas para recibir notificaciones cuando aparezcan insumos de tu interés

## Elegibilidad para donación de sangre (NOM-253-SSA1-2012)
Requisitos generales:
- Edad: 18 a 65 años
- Peso mínimo: 50 kg
- Hemoglobina: ≥12.5 g/dL (mujeres), ≥13.5 g/dL (hombres)
- Frecuencia: máximo cada 2 meses (hombres), cada 3 meses (mujeres)
- No haber tenido tatuajes o perforaciones en los últimos 12 meses
- No haber tenido cirugías mayores en los últimos 6 meses
- No estar embarazada o en periodo de lactancia
- No tener enfermedades transmisibles (hepatitis, VIH, etc.)
- No haber consumido alcohol en las últimas 24 horas
- No haber tomado antibióticos en los últimos 15 días

## Derechos ARCO (LFPDPPP)
Los usuarios tienen los siguientes derechos sobre sus datos personales:
- **Acceso**: Obtener una copia de sus datos almacenados
- **Rectificación**: Corregir datos inexactos o incompletos
- **Cancelación**: Solicitar la eliminación de sus datos
- **Oposición**: Oponerse al uso de sus datos para ciertos fines
Para ejercer estos derechos, los usuarios pueden usar la sección "Mi Cuenta" → "Privacidad" o contactar al administrador de la plataforma.

## Notas importantes
- No des diagnósticos médicos ni recomendaciones de medicamentos específicas
- Si alguien necesita atención médica urgente, indica que llame al 911 o acuda al servicio de emergencias más cercano
- Para dudas médicas específicas, recomienda consultar a un profesional de salud
"""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[dict] = None


@router.post("/chat")
def chat(request: ChatRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Servicio de IA no disponible en este momento.")

    if not request.messages:
        raise HTTPException(status_code=400, detail="Se requieren mensajes.")

    if request.messages[0].role != "user":
        raise HTTPException(status_code=400, detail="El primer mensaje debe ser del usuario.")

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )

        # Build history (all messages except the last user message)
        history = []
        for m in request.messages[:-1]:
            gemini_role = "model" if m.role == "assistant" else "user"
            history.append({"role": gemini_role, "parts": [m.content]})

        chat_session = model.start_chat(history=history)
        response = chat_session.send_message(request.messages[-1].content)

        return {"message": response.text}

    except Exception as e:
        err = str(e).lower()
        if "quota" in err or "rate" in err:
            raise HTTPException(status_code=429, detail="Demasiadas solicitudes. Intenta de nuevo en un momento.")
        if "api_key" in err or "api key" in err or "invalid" in err:
            raise HTTPException(status_code=503, detail="Servicio de IA no configurado correctamente.")
        raise HTTPException(status_code=500, detail="Error al procesar tu mensaje. Intenta de nuevo.")
