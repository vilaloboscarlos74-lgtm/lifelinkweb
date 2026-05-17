from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
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


@router.post("/", response_model=SupplyResponse, status_code=201)
def create_supply(
    data: SupplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supply = Supply(**data.model_dump(mode='json'), owner_id=current_user.id)
    db.add(supply)
    db.commit()
    return _load_supply(db, supply.id)


@router.get("/", response_model=SupplyList)
def list_supplies(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    query: Optional[str] = None,
    category: Optional[SupplyCategory] = None,
    supply_type: Optional[SupplyType] = None,
    condition: Optional[SupplyCondition] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_urgent: Optional[bool] = None,
    sort_by: str = Query("created_at"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    if sort_by not in ALLOWED_SORT_FIELDS:
        sort_by = "created_at"

    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(status_code=400, detail="min_price no puede ser mayor que max_price")

    # Filtros base (sin joins) para el COUNT eficiente
    filters = [Supply.status == SupplyStatus.DISPONIBLE]
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
    ).filter(Supply.id.in_(fav_ids)).all()


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
    for field, value in data.model_dump(mode='json', exclude_unset=True).items():
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


@router.post("/{supply_id}/favorite")
def toggle_favorite(
    supply_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supply = db.query(Supply).filter(Supply.id == supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")

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
