from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.message import Message
from app.models.request import ContactRequest, RequestStatus
from app.models.notification import Notification, NotificationType
from app.schemas.message import MessageCreate, MessageResponse, ConversationResponse, ConversationUser
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/messages", tags=["Mensajes"])


@router.get("/", response_model=List[ConversationResponse])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar todas las conversaciones activas con una sola query por tipo."""
    conversations = db.query(ContactRequest).filter(
        ContactRequest.status == RequestStatus.ACEPTADA,
        or_(
            ContactRequest.sender_id == current_user.id,
            ContactRequest.receiver_id == current_user.id
        )
    ).all()

    if not conversations:
        return []

    request_ids = [c.id for c in conversations]

    # Obtener IDs de los otros usuarios (una sola query)
    other_user_ids = {
        c.id: (c.receiver_id if c.sender_id == current_user.id else c.sender_id)
        for c in conversations
    }
    users_map = {
        u.id: u
        for u in db.query(User).filter(User.id.in_(set(other_user_ids.values()))).all()
    }

    # Obtener todos los mensajes de todas las conversaciones (una sola query)
    all_messages = (
        db.query(Message)
        .filter(Message.request_id.in_(request_ids))
        .order_by(Message.created_at.desc())
        .all()
    )

    # Agrupar por conversación
    last_msg_map: dict = {}
    unread_map: dict = {}
    for msg in all_messages:
        rid = msg.request_id
        if rid not in last_msg_map:
            last_msg_map[rid] = msg
        if msg.sender_id != current_user.id and not msg.is_read:
            unread_map[rid] = unread_map.get(rid, 0) + 1

    result = []
    for conv in conversations:
        other_id = other_user_ids[conv.id]
        other_user = users_map.get(other_id)
        if not other_user:
            continue

        last_msg = last_msg_map.get(conv.id)
        result.append(ConversationResponse(
            request_id=conv.id,
            other_user=ConversationUser(
                id=other_user.id,
                username=other_user.username,
                full_name=other_user.full_name,
                avatar_url=other_user.avatar_url
            ),
            last_message=last_msg.content if last_msg else None,
            last_message_at=last_msg.created_at.isoformat() if last_msg else None,
            unread_count=unread_map.get(conv.id, 0)
        ))

    return sorted(result, key=lambda x: x.last_message_at or "", reverse=True)


@router.get("/{request_id}", response_model=List[MessageResponse])
def get_messages(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener mensajes de una conversación."""
    req = db.query(ContactRequest).filter(
        ContactRequest.id == request_id,
        or_(
            ContactRequest.sender_id == current_user.id,
            ContactRequest.receiver_id == current_user.id
        )
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")

    db.query(Message).filter(
        Message.request_id == request_id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()

    return db.query(Message).filter(
        Message.request_id == request_id
    ).order_by(Message.created_at.asc()).all()


@router.post("/", response_model=MessageResponse, status_code=201)
def send_message(
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enviar mensaje en una solicitud aceptada."""
    req = db.query(ContactRequest).filter(
        ContactRequest.id == data.request_id,
        ContactRequest.status == RequestStatus.ACEPTADA,
        or_(
            ContactRequest.sender_id == current_user.id,
            ContactRequest.receiver_id == current_user.id
        )
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Conversación no encontrada o no autorizada")

    msg = Message(
        request_id=data.request_id,
        sender_id=current_user.id,
        content=data.content
    )
    db.add(msg)

    other_id = req.receiver_id if req.sender_id == current_user.id else req.sender_id
    preview = data.content[:80] + ("..." if len(data.content) > 80 else "")
    db.add(Notification(
        user_id=other_id,
        type=NotificationType.MENSAJE_NUEVO,
        title="Nuevo mensaje",
        content=f"{current_user.full_name}: {preview}",
        link=f"/messages/{data.request_id}"
    ))
    db.commit()
    db.refresh(msg)
    return msg
