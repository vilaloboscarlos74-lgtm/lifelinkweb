from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.supply import Supply, SupplyStatus
from app.models.request import ContactRequest, RequestStatus
from app.models.notification import Notification, NotificationType
from app.schemas.request import RequestCreate, RequestRespond, RequestResponse, SupplyBasic
from typing import Optional
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
        joinedload(ContactRequest.receiver),
        joinedload(ContactRequest.supply),
    ).filter(ContactRequest.id == request.id).first()


@router.get("/supply/{supply_id}/my", response_model=Optional[RequestResponse])
def get_my_request_for_supply(
    supply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Devuelve la solicitud más reciente del usuario actual para un insumo."""
    req = (
        db.query(ContactRequest)
        .options(
            joinedload(ContactRequest.sender),
            joinedload(ContactRequest.receiver),
            joinedload(ContactRequest.supply),
        )
        .filter(
            ContactRequest.supply_id == supply_id,
            ContactRequest.sender_id == current_user.id,
        )
        .order_by(ContactRequest.created_at.desc())
        .first()
    )
    return req


@router.get("/sent", response_model=List[RequestResponse])
def get_sent_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ver solicitudes enviadas."""
    return db.query(ContactRequest).options(
        joinedload(ContactRequest.sender),
        joinedload(ContactRequest.receiver),
        joinedload(ContactRequest.supply),
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
        joinedload(ContactRequest.receiver),
        joinedload(ContactRequest.supply),
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

    if req.supply_id:
        supply = db.query(Supply).filter(Supply.id == req.supply_id).first()
        if supply:
            if data.status == RequestStatus.ACEPTADA and supply.status == SupplyStatus.DISPONIBLE:
                already_accepted = db.query(ContactRequest).filter(
                    ContactRequest.supply_id == req.supply_id,
                    ContactRequest.status == RequestStatus.ACEPTADA,
                    ContactRequest.id != req.id,
                ).count()
                if already_accepted + 1 >= supply.quantity:
                    supply.status = SupplyStatus.RESERVADO
            elif data.status == RequestStatus.RECHAZADA and supply.status == SupplyStatus.RESERVADO:
                # Revertir si ya no hay aceptaciones activas
                still_accepted = db.query(ContactRequest).filter(
                    ContactRequest.supply_id == req.supply_id,
                    ContactRequest.status == RequestStatus.ACEPTADA,
                    ContactRequest.id != req.id,
                ).count()
                if still_accepted == 0:
                    supply.status = SupplyStatus.DISPONIBLE

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
        joinedload(ContactRequest.receiver),
        joinedload(ContactRequest.supply),
    ).filter(ContactRequest.id == req.id).first()


@router.put("/{request_id}/complete", response_model=RequestResponse)
def complete_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marcar una solicitud aceptada como completada (entrega realizada)."""
    from app.models.supply import SupplyStatus
    req = db.query(ContactRequest).filter(
        ContactRequest.id == request_id,
        ContactRequest.status == RequestStatus.ACEPTADA,
        ContactRequest.receiver_id == current_user.id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada o no aceptada")

    req.status = RequestStatus.COMPLETADA

    if req.supply_id:
        supply = db.query(Supply).filter(Supply.id == req.supply_id).first()
        if supply:
            # Solo marcar ENTREGADO si ya no quedan solicitudes aceptadas activas
            still_active = db.query(ContactRequest).filter(
                ContactRequest.supply_id == req.supply_id,
                ContactRequest.status == RequestStatus.ACEPTADA,
                ContactRequest.id != req.id,
            ).count()
            if still_active == 0:
                supply.status = SupplyStatus.ENTREGADO

    # Notificar al solicitante para que deje una reseña
    notif_sender = Notification(
        user_id=req.sender_id,
        type=NotificationType.SOLICITUD_ACEPTADA,
        title="¡Entrega completada! ⭐",
        content=f"{current_user.full_name} marcó la entrega como realizada. ¡Deja una reseña para ayudar a la comunidad!",
        link=f"/requests?review={req.id}"
    )
    db.add(notif_sender)
    # También notificar al receptor (dueño del insumo) para que reseñe al solicitante
    _sender = db.get(User, req.sender_id)
    notif_receiver = Notification(
        user_id=req.receiver_id,
        type=NotificationType.SOLICITUD_ACEPTADA,
        title="Entrega marcada como completada ⭐",
        content=f"¿Cómo fue tu experiencia con {_sender.full_name if _sender else 'el solicitante'}? Deja una reseña.",
        link=f"/requests?review={req.id}"
    )
    db.add(notif_receiver)
    db.commit()

    return db.query(ContactRequest).options(
        joinedload(ContactRequest.sender),
        joinedload(ContactRequest.receiver),
        joinedload(ContactRequest.supply),
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

    # Si el insumo quedó RESERVADO solo por esta solicitud, revertir a DISPONIBLE
    if req.supply_id:
        supply = db.query(Supply).filter(Supply.id == req.supply_id).first()
        if supply and supply.status == SupplyStatus.RESERVADO:
            still_accepted = db.query(ContactRequest).filter(
                ContactRequest.supply_id == req.supply_id,
                ContactRequest.status == RequestStatus.ACEPTADA,
                ContactRequest.id != req.id,
            ).count()
            if still_accepted == 0:
                supply.status = SupplyStatus.DISPONIBLE

    db.commit()

    return db.query(ContactRequest).options(
        joinedload(ContactRequest.sender),
        joinedload(ContactRequest.receiver),
        joinedload(ContactRequest.supply),
    ).filter(ContactRequest.id == req.id).first()
