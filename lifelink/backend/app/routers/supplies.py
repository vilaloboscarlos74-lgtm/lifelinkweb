from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.supply import Supply, SupplyImage, SupplyStatus, SupplyCategory, SupplyType, SupplyCondition, Favorite
from app.schemas.supply import SupplyCreate, SupplyUpdate, SupplyResponse, SupplyList
from app.utils.dependencies import get_current_user
from app.config import get_settings
from app.utils.cloudinary_service import upload_image
import os
import uuid
import math

router = APIRouter(prefix="/supplies", tags=["Insumos Médicos"])
settings = get_settings()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
IMAGE_EXTENSIONS = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
MAX_IMAGES_PER_SUPPLY = 5
ALLOWED_SORT_FIELDS = {"created_at", "updated_at", "price", "views_count", "title"}


def _load_supply(db: Session, supply_id: int) -> Supply:
    supply = db.query(Supply).options(
        joinedload(Supply.owner), joinedload(Supply.images)
    ).filter(Supply.id == supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return supply


def _fire_alerts(supply: Supply, db: Session):
    """Crea notificaciones para alertas que coinciden con el nuevo insumo."""
    from app.models.alert import SearchAlert
    from app.models.notification import Notification, NotificationType

    alerts = db.query(SearchAlert).filter(
        SearchAlert.is_active == True,
        SearchAlert.user_id != supply.owner_id,
    ).all()

    for alert in alerts:
        if alert.category and alert.category != supply.category:
            continue
        if alert.supply_type and alert.supply_type != supply.supply_type:
            continue
        if alert.city and supply.city and alert.city.lower() not in supply.city.lower():
            continue
        if alert.query and alert.query.lower() not in (supply.title + " " + (supply.description or "")).lower():
            continue

        notif = Notification(
            user_id=alert.user_id,
            type=NotificationType.SISTEMA,
            title=f"🔔 Nueva publicación: {alert.label}",
            content=f'Se publicó "{supply.title}" que coincide con tu alerta.',
            link=f"/supplies/{supply.id}",
        )
        db.add(notif)

    db.commit()


def _notify_compatible_blood_donors(supply: Supply, db: Session):
    """Notifica a donantes compatibles cuando se publica una solicitud urgente de sangre."""
    import re
    from app.models.notification import Notification, NotificationType
    from app.models.user import BloodType

    if not supply.is_urgent:
        return

    match = re.search(r'(AB[+-]|O[+-]|A[+-]|B[+-])', supply.title or '', re.IGNORECASE)
    if not match:
        return
    needed_type = match.group(0).upper()

    # Tipos compatibles que pueden donar al tipo necesitado
    COMPATIBLE_DONORS: dict[str, list[str]] = {
        'O-':  ['O-'],
        'O+':  ['O-', 'O+'],
        'A-':  ['O-', 'A-'],
        'A+':  ['O-', 'O+', 'A-', 'A+'],
        'B-':  ['O-', 'B-'],
        'B+':  ['O-', 'O+', 'B-', 'B+'],
        'AB-': ['O-', 'A-', 'B-', 'AB-'],
        'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    }
    compatible_types = COMPATIBLE_DONORS.get(needed_type, [])
    if not compatible_types:
        return

    # Convertir strings a enum BloodType
    bt_map = {bt.value: bt for bt in BloodType}
    bt_enums = [bt_map[t] for t in compatible_types if t in bt_map]

    query = db.query(User).filter(
        User.is_blood_donor == True,
        User.is_active == True,
        User.blood_type.in_(bt_enums),
        User.id != supply.owner_id,
    )
    if supply.city:
        query = query.filter(User.city.ilike(f"%{supply.city}%"))

    donors = query.limit(50).all()
    for donor in donors:
        notif = Notification(
            user_id=donor.id,
            type=NotificationType.SISTEMA,
            title=f"⚡ Solicitud urgente de sangre {needed_type}",
            content=f"Tu tipo de sangre es compatible. {supply.owner.full_name if supply.owner else 'Alguien'} necesita sangre {needed_type}{' en ' + supply.city if supply.city else ''}.",
            link=f"/supplies/{supply.id}",
        )
        db.add(notif)
    if donors:
        db.commit()


@router.post("/", response_model=SupplyResponse, status_code=201)
def create_supply(
    data: SupplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supply = Supply(**data.model_dump(), owner_id=current_user.id)
    db.add(supply)
    db.commit()
    _fire_alerts(supply, db)
    if supply.category == SupplyCategory.SANGRE and supply.supply_type == SupplyType.SOLICITUD:
        _notify_compatible_blood_donors(_load_supply(db, supply.id), db)
    return _load_supply(db, supply.id)


@router.get("/", response_model=SupplyList)
def list_supplies(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    query: Optional[str] = None,
    category: Optional[SupplyCategory] = None,
    supply_type: Optional[SupplyType] = None,
    condition: Optional[SupplyCondition] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_urgent: Optional[bool] = None,
    owner_id: Optional[int] = None,
    sort_by: str = Query("created_at"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    if sort_by not in ALLOWED_SORT_FIELDS:
        sort_by = "created_at"

    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(status_code=400, detail="min_price no puede ser mayor que max_price")

    now = datetime.now(timezone.utc)
    # Filtros base (sin joins) para el COUNT eficiente
    filters = [
        Supply.status == SupplyStatus.DISPONIBLE,
        or_(Supply.expires_at == None, Supply.expires_at > now),
    ]
    if query:
        filters.append(or_(
            Supply.title.ilike(f"%{query}%"),
            Supply.description.ilike(f"%{query}%"),
            Supply.brand.ilike(f"%{query}%")
        ))
    if category:
        filters.append(Supply.category == category)
    if supply_type:
        filters.append(Supply.supply_type == supply_type)
    if condition:
        filters.append(Supply.condition == condition)
    if city:
        filters.append(Supply.city.ilike(f"%{city}%"))
    if state:
        filters.append(Supply.state.ilike(f"%{state}%"))
    if min_price is not None:
        filters.append(Supply.price >= min_price)
    if max_price is not None:
        filters.append(Supply.price <= max_price)
    if is_urgent is not None:
        filters.append(Supply.is_urgent == is_urgent)
    if owner_id is not None:
        filters.append(Supply.owner_id == owner_id)

    # COUNT sin joins (mucho más rápido)
    total = db.query(Supply).filter(*filters).count()

    # Query de datos con joins solo para la página actual
    sort_field = getattr(Supply, sort_by)
    secondary = sort_field.desc() if order == "desc" else sort_field.asc()

    items = (
        db.query(Supply)
        .options(joinedload(Supply.owner), joinedload(Supply.images))
        .filter(*filters)
        .order_by(Supply.is_urgent.desc(), secondary)
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return SupplyList(
        items=items,
        total=total,
        page=page,
        pages=math.ceil(total / limit) if total > 0 else 1
    )


@router.get("/my", response_model=List[SupplyResponse])
def get_my_supplies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Supply).options(
        joinedload(Supply.owner), joinedload(Supply.images)
    ).filter(Supply.owner_id == current_user.id).order_by(Supply.created_at.desc()).all()


@router.get("/favorites/my", response_model=List[SupplyResponse])
def get_my_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fav_ids = (
        db.query(Favorite.supply_id)
        .filter(Favorite.user_id == current_user.id)
        .scalar_subquery()
    )
    return db.query(Supply).options(
        joinedload(Supply.owner), joinedload(Supply.images)
    ).filter(
        Supply.id.in_(fav_ids),
        Supply.owner_id != current_user.id
    ).all()


@router.get("/{supply_id}", response_model=SupplyResponse)
def get_supply(supply_id: int, db: Session = Depends(get_db)):
    supply = db.query(Supply).options(
        joinedload(Supply.owner), joinedload(Supply.images)
    ).filter(Supply.id == supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    # Incremento atómico para evitar race conditions
    db.query(Supply).filter(Supply.id == supply_id).update(
        {"views_count": Supply.views_count + 1}
    )
    db.commit()
    db.refresh(supply)
    return supply


@router.put("/{supply_id}", response_model=SupplyResponse)
def update_supply(
    supply_id: int,
    data: SupplyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supply = db.query(Supply).filter(
        Supply.id == supply_id, Supply.owner_id == current_user.id
    ).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado o no autorizado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(supply, field, value)
    db.commit()
    return _load_supply(db, supply.id)


@router.delete("/{supply_id}", status_code=204)
def delete_supply(
    supply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supply = db.query(Supply).filter(
        Supply.id == supply_id, Supply.owner_id == current_user.id
    ).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado o no autorizado")
    db.delete(supply)
    db.commit()


@router.post("/{supply_id}/images", response_model=SupplyResponse)
async def upload_supply_images(
    supply_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supply = db.query(Supply).options(joinedload(Supply.images)).filter(
        Supply.id == supply_id, Supply.owner_id == current_user.id
    ).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")

    existing_count = len(supply.images)
    slots_available = MAX_IMAGES_PER_SUPPLY - existing_count
    if slots_available <= 0:
        raise HTTPException(
            status_code=400,
            detail=f"El insumo ya tiene el máximo de {MAX_IMAGES_PER_SUPPLY} imágenes"
        )

    added = 0
    for file in files:
        if added >= slots_available:
            break
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            continue

        content = await file.read()
        if len(content) > settings.MAX_FILE_SIZE:
            continue

        image_url = upload_image(content, "lifelink/supplies")
        is_primary = existing_count == 0 and added == 0
        db.add(SupplyImage(
            supply_id=supply.id,
            image_url=image_url,
            is_primary=is_primary
        ))
        added += 1

    if added == 0:
        raise HTTPException(status_code=400, detail="No se pudo subir ninguna imagen válida")

    db.commit()
    return _load_supply(db, supply.id)


@router.delete("/{supply_id}/images/{image_id}", status_code=204)
def delete_supply_image(
    supply_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supply = db.query(Supply).filter(
        Supply.id == supply_id, Supply.owner_id == current_user.id
    ).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado o no autorizado")

    image = db.query(SupplyImage).filter(
        SupplyImage.id == image_id, SupplyImage.supply_id == supply_id
    ).first()
    if not image:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")

    was_primary = image.is_primary
    db.delete(image)
    db.flush()

    # If the deleted image was primary, promote the next one
    if was_primary:
        next_img = db.query(SupplyImage).filter(
            SupplyImage.supply_id == supply_id
        ).first()
        if next_img:
            next_img.is_primary = True

    db.commit()


@router.put("/{supply_id}/close", response_model=SupplyResponse)
def close_supply(
    supply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Owner marks their own supply as delivered without going through a request."""
    supply = db.query(Supply).filter(
        Supply.id == supply_id, Supply.owner_id == current_user.id
    ).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado o no autorizado")
    if supply.status == SupplyStatus.ENTREGADO:
        raise HTTPException(status_code=400, detail="El insumo ya está marcado como entregado")
    supply.status = SupplyStatus.ENTREGADO
    db.commit()
    return _load_supply(db, supply.id)


@router.get("/{supply_id}/stats")
def get_supply_stats(
    supply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns view and request stats for a supply owned by the current user."""
    from app.models.request import ContactRequest, RequestStatus
    supply = db.query(Supply).filter(
        Supply.id == supply_id, Supply.owner_id == current_user.id
    ).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado o no autorizado")

    total_requests = db.query(func.count(ContactRequest.id)).filter(
        ContactRequest.supply_id == supply_id
    ).scalar() or 0
    accepted = db.query(func.count(ContactRequest.id)).filter(
        ContactRequest.supply_id == supply_id,
        ContactRequest.status == RequestStatus.ACEPTADA
    ).scalar() or 0
    completed = db.query(func.count(ContactRequest.id)).filter(
        ContactRequest.supply_id == supply_id,
        ContactRequest.status == RequestStatus.COMPLETADA
    ).scalar() or 0
    favorited = db.query(func.count(Favorite.id)).filter(
        Favorite.supply_id == supply_id
    ).scalar() or 0

    return {
        "views": supply.views_count,
        "total_requests": total_requests,
        "accepted_requests": accepted,
        "completed_requests": completed,
        "favorited_by": favorited,
        "conversion_rate": round(completed / total_requests * 100, 1) if total_requests > 0 else 0,
    }


@router.post("/{supply_id}/favorite")
def toggle_favorite(
    supply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supply = db.query(Supply).filter(Supply.id == supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")

    if supply.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes guardar tu propia publicación en favoritos")

    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.supply_id == supply_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"is_favorite": False}

    db.add(Favorite(user_id=current_user.id, supply_id=supply_id))
    db.commit()
    return {"is_favorite": True}
