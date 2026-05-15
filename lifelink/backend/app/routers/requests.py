from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.supply import Supply, SupplyStatus
from app.models.request import ContactRequest, RequestStatus
from app.models.notification import Notification, NotificationType
from app.schemas.request import RequestCreate, RequestRespond, RequestResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/requests", tags=["Solicitudes de Contacto"])


@router.post("/", response_model=RequestResponse, status_code=201)
def create_request(
    data: RequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enviar solicitud de contacto a un donante/vendedor."""
    if data.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes contactarte a ti mismo")

    receiver = db.query(User).filter(User.id == data.receiver_id, User.is_active == True).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Verificar si ya existe una solicitud pendiente
    existing = db.query(ContactRequest).filter(
        ContactRequest.sender_id == current_user.id,
        ContactRequest.receiver_id == data.receiver_id,
        ContactRequest.supply_id == data.supply_id,
        ContactRequest.status == RequestStatus.PENDIENTE
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya tienes una solicitud pendiente con este usuario")

    # Verificar disponibilidad del insumo
    if data.supply_id:
        supply = db.query(Supply).filter(Supply.id == data.supply_id).first()
        if not supply or supply.status != SupplyStatus.DISPONIBLE:
            raise HTTPException(status_code=400, detail="El insumo ya no está disponible")

    request = ContactRequest(
        sender_id=current_user.id,
        receiver_id=data.receiver_id,
        supply_id=data.supply_id,
        message=data.message
    )
    db.add(request)
    db.flush()  # Obtener request.id antes de crear la notificación

    notif = Notification(
        user_id=data.receiver_id,
        type=NotificationType.SOLICITUD_NUEVA,
        title="Nueva solicitud de contacto",
        content=f"{current_user.full_name} quiere contactarte",
        link="/requests"
    )
    db.add(notif)
    db.commit()
    db.refresh(request)

    return db.query(ContactRequest).options(
        joinedload(ContactRequest.sender),
        joinedload(ContactRequest.receiver)
    ).filter(ContactRequest.id == request.id).first()


@router.get("/sent", response_model=List[RequestResponse])
def get_sent_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ver solicitudes enviadas."""
    return db.query(ContactRequest).options(
        joinedload(ContactRequest.sender),
        joinedload(ContactRequest.receiver)
    ).filter(ContactRequest.sender_id == current_user.id).order_by(
        ContactRequest.created_at.desc()
    ).all()


@router.get("/received", response_model=List[RequestResponse])
def get_received_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ver solicitudes recibidas."""
    return db.query(ContactRequest).options(
        joinedload(ContactRequest.sender),
        joinedload(ContactRequest.receiver)
    ).filter(ContactRequest.receiver_id == current_user.id).order_by(
        ContactRequest.created_at.desc()
    ).all()


@router.put("/{request_id}/respond", response_model=RequestResponse)
def respond_request(
    request_id: int,
    data: RequestRespond,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aceptar o rechazar una solicitud."""
    req = db.query(ContactRequest).filter(
        ContactRequest.id == request_id,
        ContactRequest.receiver_id == current_user.id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if req.status != RequestStatus.PENDIENTE:
        raise HTTPException(status_code=400, detail="La solicitud ya fue respondida")

    req.status = data.status
    req.response_message = data.response_message
    req.responded_at = datetime.now(timezone.utc)

    # Si se acepta, marcar insumo como reservado
    if data.status == RequestStatus.ACEPTADA and req.supply_id:
        supply = db.query(Supply).filter(Supply.id == req.supply_id).first()
        if supply:
            supply.status = SupplyStatus.RESERVADO

    # Notificación al solicitante
    accepted = data.status == RequestStatus.ACEPTADA
    notif = Notification(
        user_id=req.sender_id,
        type=NotificationType.SOLICITUD_ACEPTADA if accepted else NotificationType.SOLICITUD_RECHAZADA,
        title="Solicitud aceptada ✓" if accepted else "Solicitud rechazada",
        content=f"{current_user.full_name} {'aceptó tu solicitud, ya puedes chatear' if accepted else 'rechazó tu solicitud'}",
        link=f"/messages/{req.id}" if accepted else "/requests"
    )
    db.add(notif)
    db.commit()

    return db.query(ContactRequest).options(
        joinedload(ContactRequest.sender),
        joinedload(ContactRequest.receiver)
    ).filter(ContactRequest.id == req.id).first()


@router.put("/{request_id}/cancel", response_model=RequestResponse)
def cancel_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancelar una solicitud enviada."""
    req = db.query(ContactRequest).filter(
        ContactRequest.id == request_id,
        ContactRequest.sender_id == current_user.id,
        ContactRequest.status == RequestStatus.PENDIENTE
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada o no cancelable")

    req.status = RequestStatus.CANCELADA
    db.commit()
    db.refresh(req)

    return db.query(ContactRequest).options(
        joinedload(ContactRequest.sender),
        joinedload(ContactRequest.receiver)
    ).filter(ContactRequest.id == req.id).first()
