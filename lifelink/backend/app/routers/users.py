from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User, BloodType
from app.schemas.user import UserResponse, UserUpdate, UserPublic
from app.utils.dependencies import get_current_user
from app.config import get_settings
import logging
import os
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Usuarios"])
settings = get_settings()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
IMAGE_EXTENSIONS = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    if current_user.is_blood_donor is None:
        current_user.is_blood_donor = False
    if current_user.is_verified is None:
        current_user.is_verified = False
    if current_user.rating_avg is None:
        current_user.rating_avg = 0.0
    return current_user


@router.put("/me", response_model=UserResponse)
def update_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # mode='json' serializes enums to their string values (e.g. "A+" not "A_POSITIVE")
        update_data = data.model_dump(mode='json', exclude_unset=True)
        for field, value in update_data.items():
            setattr(current_user, field, value)
        db.commit()
        db.refresh(current_user)
        # Ensure nullable bool/float columns have defaults before serialization
        if current_user.is_blood_donor is None:
            current_user.is_blood_donor = False
        if current_user.is_verified is None:
            current_user.is_verified = False
        if current_user.rating_avg is None:
            current_user.rating_avg = 0.0
        return current_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating profile user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(status_code=422, detail=f"Error al guardar el perfil: {str(e)}")


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes JPG, PNG o WebP")

    # Leer y validar tamaño ANTES de escribir en disco
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="La imagen excede 5MB")

    ext = IMAGE_EXTENSIONS[file.content_type]
    avatar_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(avatar_dir, exist_ok=True)
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(avatar_dir, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    # Eliminar avatar anterior si existe
    if current_user.avatar_url:
        old_path = current_user.avatar_url.lstrip("/")
        old_full = os.path.join(settings.UPLOAD_DIR, *old_path.split("/")[1:])
        if os.path.isfile(old_full):
            os.remove(old_full)

    current_user.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user


# Rutas específicas ANTES de la ruta paramétrica /{user_id}
@router.get("/donors/blood", response_model=List[UserPublic])
def search_blood_donors(
    blood_type: Optional[BloodType] = Query(None),
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User).filter(User.is_blood_donor == True, User.is_active == True)
    if blood_type:
        query = query.filter(User.blood_type == blood_type)
    if city:
        query = query.filter(User.city.ilike(f"%{city}%"))
    return query.all()


@router.get("/{user_id}", response_model=UserPublic)
def get_user_public(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user
