import math
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.supply import Supply, SupplyStatus
from app.models.request import ContactRequest, RequestStatus
from app.schemas.user import UserResponse
from app.utils.dependencies import get_current_admin

router = APIRouter(prefix="/admin", tags=["Administración"])


class UserPage(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    pages: int


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # Una sola query por dominio en lugar de 8 queries separadas
    user_stats = db.query(
        func.count(User.id).label("total"),
        func.count(case((User.is_active == True, 1))).label("active"),
        func.count(case((User.is_blood_donor == True, 1))).label("blood_donors"),
    ).one()

    supply_stats = db.query(
        func.count(Supply.id).label("total"),
        func.count(case((Supply.status == SupplyStatus.DISPONIBLE, 1))).label("available"),
    ).one()

    request_stats = db.query(
        func.count(ContactRequest.id).label("total"),
        func.count(case((ContactRequest.status == RequestStatus.PENDIENTE, 1))).label("pending"),
        func.count(case((ContactRequest.status == RequestStatus.COMPLETADA, 1))).label("completed"),
    ).one()

    return {
        "users": {
            "total": user_stats.total,
            "active": user_stats.active,
            "inactive": user_stats.total - user_stats.active,
            "blood_donors": user_stats.blood_donors,
        },
        "supplies": {
            "total": supply_stats.total,
            "available": supply_stats.available,
        },
        "requests": {
            "total": request_stats.total,
            "pending": request_stats.pending,
            "completed": request_stats.completed,
        },
    }


@router.get("/users", response_model=UserPage)
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    total = db.query(func.count(User.id)).scalar()
    users = db.query(User).offset((page - 1) * limit).limit(limit).all()
    return UserPage(
        items=users,
        total=total,
        page=page,
        pages=math.ceil(total / limit) if total > 0 else 1,
    )


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_active = not user.is_active
    db.commit()
    return {"is_active": user.is_active, "detail": f"Usuario {'activado' if user.is_active else 'desactivado'}"}


@router.delete("/supplies/{supply_id}", status_code=204)
def admin_delete_supply(
    supply_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    supply = db.query(Supply).filter(Supply.id == supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    db.delete(supply)
    db.commit()
