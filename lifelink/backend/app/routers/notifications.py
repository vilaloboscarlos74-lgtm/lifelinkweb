from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.utils.dependencies import get_current_user
from app.models.user import User
import math

router = APIRouter(prefix="/notifications", tags=["Notificaciones"])

MAX_NOTIFICATIONS = 100


class NotificationPage(BaseModel):
    items: List[NotificationResponse]
    total: int
    unread: int
    page: int
    pages: int


@router.get("/", response_model=NotificationPage)
def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=MAX_NOTIFICATIONS),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    base_q = db.query(Notification).filter(Notification.user_id == current_user.id)
    total = base_q.count()
    unread = base_q.filter(Notification.is_read == False).count()
    items = (
        base_q
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return NotificationPage(
        items=items,
        total=total,
        unread=unread,
        page=page,
        pages=math.ceil(total / limit) if total > 0 else 1,
    )


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"count": count}


@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"detail": "Todas marcadas como leídas"}


@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    notif.is_read = True
    db.commit()
    return {"detail": "Marcada como leída"}


@router.delete("/{notification_id}", status_code=204)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    db.delete(notif)
    db.commit()
