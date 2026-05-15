from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.review import Review
from app.models.request import ContactRequest, RequestStatus
from app.schemas.review import ReviewCreate, ReviewResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reseñas"])


@router.post("/", response_model=ReviewResponse, status_code=201)
def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dejar una reseña tras completar una solicitud."""
    if data.reviewed_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes reseñarte a ti mismo")

    req = db.query(ContactRequest).filter(
        ContactRequest.id == data.request_id,
        ContactRequest.status == RequestStatus.COMPLETADA,
        or_(
            ContactRequest.sender_id == current_user.id,
            ContactRequest.receiver_id == current_user.id
        )
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada o no completada")

    # Validar que reviewed_id es parte de la solicitud
    if data.reviewed_id not in (req.sender_id, req.receiver_id):
        raise HTTPException(status_code=400, detail="El usuario no es parte de esta solicitud")

    # Evitar reseña duplicada
    existing = db.query(Review).filter(
        Review.request_id == data.request_id,
        Review.reviewer_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya dejaste una reseña para esta solicitud")

    review = Review(
        reviewer_id=current_user.id,
        reviewed_id=data.reviewed_id,
        request_id=data.request_id,
        rating=data.rating,
        comment=data.comment
    )
    db.add(review)
    db.flush()

    # Actualizar rating_avg del usuario reseñado
    avg = db.query(func.avg(Review.rating)).filter(
        Review.reviewed_id == data.reviewed_id
    ).scalar() or 0.0
    db.query(User).filter(User.id == data.reviewed_id).update({"rating_avg": round(float(avg), 2)})

    db.commit()
    db.refresh(review)

    return db.query(Review).options(
        joinedload(Review.reviewer)
    ).filter(Review.id == review.id).first()


@router.get("/user/{user_id}", response_model=List[ReviewResponse])
def get_user_reviews(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Obtener reseñas de un usuario."""
    return (
        db.query(Review)
        .options(joinedload(Review.reviewer))
        .filter(Review.reviewed_id == user_id)
        .order_by(Review.created_at.desc())
        .all()
    )


@router.get("/can-review/{request_id}")
def can_review(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verificar si el usuario puede dejar una reseña para esta solicitud."""
    req = db.query(ContactRequest).filter(
        ContactRequest.id == request_id,
        ContactRequest.status == RequestStatus.COMPLETADA,
        or_(
            ContactRequest.sender_id == current_user.id,
            ContactRequest.receiver_id == current_user.id
        )
    ).first()
    if not req:
        return {"can_review": False, "reviewed_id": None}

    already = db.query(Review).filter(
        Review.request_id == request_id,
        Review.reviewer_id == current_user.id
    ).first()

    reviewed_id = req.receiver_id if req.sender_id == current_user.id else req.sender_id
    return {"can_review": not already, "reviewed_id": reviewed_id}
