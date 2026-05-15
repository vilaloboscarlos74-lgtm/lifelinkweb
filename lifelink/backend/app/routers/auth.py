from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.utils.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    email = user.email.lower().strip()
    username = user.username.lower().strip()
    full_name = user.full_name.strip()

    existing = db.query(User).filter(
        or_(User.email == email, User.username == username)
    ).first()

    if existing:
        if existing.email == email:
            raise HTTPException(status_code=400, detail="El correo ya está registrado")
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")

    db_user = User(
        email=email,
        username=username,
        hashed_password=hash_password(user.password),
        full_name=full_name,
        phone=user.phone,
        role=user.role,
    )
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error al crear usuario")

    return db_user


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Acepta application/x-www-form-urlencoded con campos 'username' y 'password'.
    El campo 'username' puede ser email o nombre de usuario.
    """
    login_value = form_data.username.lower().strip()

    user = db.query(User).filter(
        or_(User.username == login_value, User.email == login_value)
    ).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado",
        )

    token = create_access_token(data={
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value,
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.value,
            "avatar_url": user.avatar_url,
            "is_verified": user.is_verified,
        },
    }
