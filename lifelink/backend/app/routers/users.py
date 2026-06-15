from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User, BloodType
from app.schemas.user import UserResponse, UserUpdate, UserPublic
from app.utils.dependencies import get_current_user
from app.utils.security import verify_password, hash_password
from app.config import get_settings
from app.utils.cloudinary_service import upload_image, delete_image
from pydantic import BaseModel, Field, field_validator
import logging
import os
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/users", tags=["Usuarios"])
settings = get_settings()
logger = logging.getLogger(__name__)

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
        update_data = data.model_dump(mode='json', exclude_unset=True)

        # Guard: activating blood donor status requires a complete, eligible medical record
        if update_data.get('is_blood_donor') is True:
            from app.models.blood import BloodDonorRecord
            from app.routers.blood import _check_eligibility
            record = db.query(BloodDonorRecord).filter(BloodDonorRecord.user_id == current_user.id).first()
            if not record or record.weight_kg is None or record.birth_date is None:
                raise HTTPException(
                    status_code=400,
                    detail="Debes completar tu expediente médico (peso y fecha de nacimiento) antes de registrarte como donante activo."
                )
            elig = _check_eligibility(record)
            if not elig.eligible:
                raise HTTPException(
                    status_code=400,
                    detail=f"No cumples los requisitos para ser donante activo: {'; '.join(elig.reasons)}"
                )
            blood_type_new = update_data.get('blood_type') or (current_user.blood_type.value if current_user.blood_type else None)
            if not blood_type_new:
                raise HTTPException(
                    status_code=400,
                    detail="Debes seleccionar tu tipo de sangre para registrarte como donante activo."
                )

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

    # Eliminar avatar anterior de Cloudinary
    if current_user.avatar_url:
        delete_image(current_user.avatar_url)

    current_user.avatar_url = upload_image(content, "lifelink/avatars")
    db.commit()
    db.refresh(current_user)
    return current_user


# Rutas específicas ANTES de la ruta paramétrica /{user_id}
@router.get("/donors/blood", response_model=List[UserPublic])
def search_blood_donors(
    blood_type: Optional[BloodType] = Query(None),
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    # Público: no requiere auth para que usuarios no registrados puedan ver donadores
    query = db.query(User).filter(User.is_blood_donor == True, User.is_active == True)
    if blood_type:
        query = query.filter(User.blood_type == blood_type)
    if city:
        query = query.filter(User.city.ilike(f"%{city}%"))
    donors = query.all()

    if donors:
        from app.models.supply import Supply, SupplyStatus, SupplyCategory
        donor_ids = [d.id for d in donors]
        # Una sola query para obtener el supply de sangre de cada donador
        rows = (
            db.query(Supply.owner_id, Supply.id)
            .filter(
                Supply.owner_id.in_(donor_ids),
                Supply.status == SupplyStatus.DISPONIBLE,
                Supply.category == SupplyCategory.SANGRE,
            )
            .all()
        )
        supply_map = {row.owner_id: row.id for row in rows}
        for donor in donors:
            donor.contact_supply_id = supply_map.get(donor.id)

    return donors


@router.get("/me/badges")
def get_my_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.utils.badges import compute_badges
    return compute_badges(current_user, db)


@router.get("/{user_id}", response_model=UserPublic)
def get_user_public(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.get("/{user_id}/badges")
def get_user_badges(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    from app.utils.badges import compute_badges
    return compute_badges(user, db)


# ── Password change ──────────────────────────────────────────────────────────

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator('new_password')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError('La contraseña debe tener al menos una mayúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe tener al menos un número')
        return v


@router.put("/me/password", status_code=200)
def change_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    if data.current_password == data.new_password:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe ser diferente a la actual")
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"detail": "Contraseña actualizada correctamente"}


# ── Export my data (ARCO) ────────────────────────────────────────────────────

@router.get("/me/export")
def export_my_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.supply import Supply
    from app.models.request import ContactRequest
    from app.models.review import Review
    from app.models.blood import BloodDonorRecord

    supplies = db.query(Supply).filter(Supply.owner_id == current_user.id).all()
    sent_requests = db.query(ContactRequest).filter(ContactRequest.sender_id == current_user.id).all()
    received_requests = db.query(ContactRequest).filter(ContactRequest.receiver_id == current_user.id).all()
    reviews_given = db.query(Review).filter(Review.reviewer_id == current_user.id).all()
    reviews_received = db.query(Review).filter(Review.reviewed_id == current_user.id).all()
    blood_record = db.query(BloodDonorRecord).filter(BloodDonorRecord.user_id == current_user.id).first()

    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "account": {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "city": current_user.city,
            "state": current_user.state,
            "bio": current_user.bio,
            "phone": current_user.phone,
            "blood_type": current_user.blood_type.value if current_user.blood_type else None,
            "is_blood_donor": current_user.is_blood_donor,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        },
        "supplies": [
            {
                "id": s.id, "title": s.title, "category": s.category.value,
                "supply_type": s.supply_type.value, "status": s.status.value,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in supplies
        ],
        "requests_sent": [
            {
                "id": r.id, "supply_id": r.supply_id, "status": r.status.value,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in sent_requests
        ],
        "requests_received": [
            {
                "id": r.id, "supply_id": r.supply_id, "status": r.status.value,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in received_requests
        ],
        "reviews_given": [
            {
                "id": r.id, "reviewed_id": r.reviewed_id, "rating": r.rating,
                "comment": r.comment, "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reviews_given
        ],
        "reviews_received": [
            {
                "id": r.id, "reviewer_id": r.reviewer_id, "rating": r.rating,
                "comment": r.comment, "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reviews_received
        ],
        "blood_record": {
            "blood_type": current_user.blood_type.value if current_user.blood_type else None,
            "weight_kg": blood_record.weight_kg if blood_record else None,
            "total_donations": blood_record.total_donations if blood_record else 0,
        } if blood_record else None,
    }


# ── Delete account (ARCO — derecho de cancelación) ───────────────────────────

class DeleteAccountRequest(BaseModel):
    password: str
    confirmation: str  # must equal "ELIMINAR MI CUENTA"


@router.delete("/me", status_code=200)
def delete_account(
    data: DeleteAccountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.confirmation != "ELIMINAR MI CUENTA":
        raise HTTPException(
            status_code=400,
            detail='Para confirmar escribe exactamente: ELIMINAR MI CUENTA'
        )
    if not verify_password(data.password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    # Soft-delete: deactivate so foreign keys and history are preserved
    current_user.is_active = False
    current_user.email = f"deleted_{current_user.id}@deleted.lifelink"
    current_user.username = f"usuario_eliminado_{current_user.id}"
    current_user.full_name = "Usuario eliminado"
    current_user.bio = None
    current_user.phone = None
    current_user.avatar_url = None
    db.commit()
    return {"detail": "Cuenta eliminada correctamente"}
