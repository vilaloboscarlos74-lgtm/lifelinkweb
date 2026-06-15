import math
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, extract, or_
from typing import List, Optional
from app.database import get_db
from app.models.user import User, UserRole
from app.models.supply import Supply, SupplyStatus, SupplyType, SupplyCategory
from app.models.request import ContactRequest, RequestStatus
from app.schemas.user import UserResponse
from app.schemas.supply import SupplyResponse
from app.schemas.request import RequestResponse
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

    # Registros mensuales de usuarios (últimos 6 meses)
    now = datetime.now(timezone.utc)
    monthly_users = []
    for i in range(5, -1, -1):
        target = now - timedelta(days=30 * i)
        count = db.query(func.count(User.id)).filter(
            extract("year", User.created_at) == target.year,
            extract("month", User.created_at) == target.month,
        ).scalar() or 0
        monthly_users.append({
            "month": target.strftime("%b %Y"),
            "count": count,
        })

    # Distribución de insumos por tipo
    supply_by_type = db.query(
        Supply.supply_type,
        func.count(Supply.id).label("count"),
    ).group_by(Supply.supply_type).all()

    # Distribución de insumos por categoría (top 8)
    supply_by_category = db.query(
        Supply.category,
        func.count(Supply.id).label("count"),
    ).group_by(Supply.category).order_by(func.count(Supply.id).desc()).limit(8).all()

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
        "charts": {
            "monthly_registrations": monthly_users,
            "supplies_by_type": [
                {"type": row.supply_type.value if hasattr(row.supply_type, "value") else str(row.supply_type), "count": row.count}
                for row in supply_by_type
            ],
            "supplies_by_category": [
                {"category": row.category.value if hasattr(row.category, "value") else str(row.category or "Sin categoría"), "count": row.count}
                for row in supply_by_category
            ],
        },
    }


@router.get("/users", response_model=UserPage)
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    filters = []
    if search:
        filters.append(or_(
            User.full_name.ilike(f"%{search}%"),
            User.username.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
        ))
    if role:
        filters.append(User.role == role)
    total = db.query(func.count(User.id)).filter(*filters).scalar() or 0
    users = db.query(User).filter(*filters).order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
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


class SupplyPage(BaseModel):
    items: List[SupplyResponse]
    total: int
    page: int
    pages: int


@router.get("/supplies", response_model=SupplyPage)
def list_all_supplies(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = None,
    supply_type: Optional[SupplyType] = None,
    status: Optional[SupplyStatus] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    filters = []
    if query:
        filters.append(or_(
            Supply.title.ilike(f"%{query}%"),
            Supply.description.ilike(f"%{query}%"),
        ))
    if supply_type:
        filters.append(Supply.supply_type == supply_type)
    if status:
        filters.append(Supply.status == status)

    total = db.query(func.count(Supply.id)).filter(*filters).scalar() or 0
    items = (
        db.query(Supply)
        .options(joinedload(Supply.owner), joinedload(Supply.images))
        .filter(*filters)
        .order_by(Supply.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return SupplyPage(
        items=items,
        total=total,
        page=page,
        pages=math.ceil(total / limit) if total > 0 else 1,
    )


@router.put("/supplies/{supply_id}/status")
def set_supply_status(
    supply_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    supply = db.query(Supply).filter(Supply.id == supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    new_status = payload.get("status")
    try:
        supply.status = SupplyStatus(new_status)
    except (ValueError, KeyError):
        raise HTTPException(status_code=400, detail="Estado inválido")
    db.commit()
    return {"status": supply.status.value, "detail": f"Estado actualizado a {supply.status.value}"}


@router.put("/users/{user_id}/verify")
def toggle_user_verified(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_verified = not user.is_verified
    if user.is_verified:
        user.email_verified = True
        user.email_verification_token = None
        user.email_verification_expires = None
    db.commit()
    return {
        "is_verified": user.is_verified,
        "email_verified": user.email_verified,
        "detail": f"Usuario {'verificado' if user.is_verified else 'desverificado'}",
    }


@router.put("/users/{user_id}/verify-email")
def admin_verify_email(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires = None
    db.commit()
    return {"email_verified": True, "detail": "Email verificado manualmente"}


@router.put("/users/{user_id}/role")
def change_user_role(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes cambiar tu propio rol")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    new_role = payload.get("role")
    try:
        user.role = UserRole(new_role)
    except (ValueError, KeyError):
        raise HTTPException(status_code=400, detail="Rol inválido")
    db.commit()
    return {"role": user.role.value, "detail": f"Rol actualizado a {user.role.value}"}


@router.get("/blood-donors")
def list_blood_donors(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    blood_type: Optional[str] = None,
    eligibility: Optional[str] = None,  # "eligible" | "ineligible"
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Lista donantes de sangre con elegibilidad calculada. No expone datos sensibles de enfermedades."""
    from app.models.blood import BloodDonorRecord
    from datetime import datetime, timezone, timedelta

    q = (
        db.query(User, BloodDonorRecord)
        .outerjoin(BloodDonorRecord, User.id == BloodDonorRecord.user_id)
        .filter(User.is_blood_donor == True)
    )

    if blood_type:
        from app.models.user import BloodType as BT
        try:
            q = q.filter(User.blood_type == BT(blood_type))
        except ValueError:
            pass

    rows = q.order_by(User.created_at.desc()).all()
    now = datetime.now(timezone.utc)

    def _to_utc(dt):
        if dt is None:
            return None
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

    def _is_eligible(record):
        if record is None:
            return True, None
        # Exclusiones permanentes — no se expone cuál
        if any([record.has_hiv, record.has_hepatitis_b, record.has_hepatitis_c,
                record.has_sifilis, record.has_chagas, record.has_cancer,
                record.has_diabetes_insulin, record.has_epilepsy]):
            return False, "permanente"
        # Exclusiones temporales
        if record.is_pregnant or record.is_breastfeeding:
            return False, "temporal"
        if record.had_recent_tattoo or record.had_recent_piercing or record.had_recent_surgery:
            return False, "temporal"
        tattoo_cutoff = now - timedelta(days=365)
        surgery_cutoff = now - timedelta(days=180)
        if _to_utc(record.tattoo_date) and _to_utc(record.tattoo_date) > tattoo_cutoff:
            return False, "temporal"
        if _to_utc(record.piercing_date) and _to_utc(record.piercing_date) > tattoo_cutoff:
            return False, "temporal"
        if _to_utc(record.surgery_date) and _to_utc(record.surgery_date) > surgery_cutoff:
            return False, "temporal"
        ld = _to_utc(record.last_donation_date)
        if ld and (now - ld).days < 60:
            return False, "temporal"
        return True, None

    items = []
    for user, record in rows:
        eligible, ineligibility_type = _is_eligible(record)
        if eligibility == "eligible" and not eligible:
            continue
        if eligibility == "ineligible" and eligible:
            continue
        items.append({
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "blood_type": user.blood_type.value if user.blood_type else None,
            "total_donations": record.total_donations if record else 0,
            "last_donation_date": _to_utc(record.last_donation_date).isoformat() if record and record.last_donation_date else None,
            "is_eligible": eligible,
            "ineligibility_type": ineligibility_type,
            "has_record": record is not None,
        })

    total = len(items)
    start = (page - 1) * limit
    return {
        "items": items[start:start + limit],
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit) if total > 0 else 1,
    }


class RequestPage(BaseModel):
    items: List[RequestResponse]
    total: int
    page: int
    pages: int


@router.get("/requests", response_model=RequestPage)
def list_all_requests(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[RequestStatus] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    filters = []
    if status:
        filters.append(ContactRequest.status == status)

    total = db.query(func.count(ContactRequest.id)).filter(*filters).scalar() or 0
    items = (
        db.query(ContactRequest)
        .options(
            joinedload(ContactRequest.sender),
            joinedload(ContactRequest.receiver),
            joinedload(ContactRequest.supply),
        )
        .filter(*filters)
        .order_by(ContactRequest.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return RequestPage(
        items=items,
        total=total,
        page=page,
        pages=math.ceil(total / limit) if total > 0 else 1,
    )
