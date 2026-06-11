from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.alert import SearchAlert
from app.models.supply import SupplyCategory, SupplyType
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alertas de búsqueda"])


class AlertIn(BaseModel):
    label: str
    query: Optional[str] = None
    category: Optional[SupplyCategory] = None
    supply_type: Optional[SupplyType] = None
    city: Optional[str] = None


class AlertOut(AlertIn):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=List[AlertOut])
def list_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(SearchAlert).filter(SearchAlert.user_id == current_user.id).all()


@router.post("/", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
def create_alert(
    data: AlertIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = db.query(SearchAlert).filter(SearchAlert.user_id == current_user.id).count()
    if count >= 10:
        raise HTTPException(status_code=400, detail="Máximo 10 alertas por usuario")

    alert = SearchAlert(user_id=current_user.id, **data.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.put("/{alert_id}/toggle", response_model=AlertOut)
def toggle_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(SearchAlert).filter(
        SearchAlert.id == alert_id, SearchAlert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alert.is_active = not alert.is_active
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(SearchAlert).filter(
        SearchAlert.id == alert_id, SearchAlert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    db.delete(alert)
    db.commit()
