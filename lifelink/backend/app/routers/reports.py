from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.report import Report, ReportType, ReportReason, ReportStatus
from app.utils.dependencies import get_current_user, get_current_admin

router = APIRouter(prefix="/reports", tags=["Reportes"])


class ReportCreate(BaseModel):
    report_type: ReportType
    reason: ReportReason
    description: Optional[str] = None
    supply_id: Optional[int] = None
    reported_user_id: Optional[int] = None


class ReportResponse(BaseModel):
    id: int
    report_type: ReportType
    reason: ReportReason
    description: Optional[str] = None
    status: ReportStatus
    supply_id: Optional[int] = None
    reported_user_id: Optional[int] = None
    admin_note: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminReportResponse(ReportResponse):
    reporter_id: int


class ResolveReport(BaseModel):
    status: ReportStatus
    admin_note: Optional[str] = None


@router.post("/", response_model=ReportResponse, status_code=201)
def create_report(
    data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.report_type == ReportType.SUPPLY and not data.supply_id:
        raise HTTPException(status_code=400, detail="supply_id requerido para reportar un insumo")
    if data.report_type == ReportType.USER and not data.reported_user_id:
        raise HTTPException(status_code=400, detail="reported_user_id requerido para reportar un usuario")
    if data.reported_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes reportarte a ti mismo")

    # Limit: 3 reports per target per user to prevent spam
    existing = db.query(func.count(Report.id)).filter(
        Report.reporter_id == current_user.id,
        Report.supply_id == data.supply_id if data.supply_id else Report.reported_user_id == data.reported_user_id,
    ).scalar() or 0
    if existing >= 3:
        raise HTTPException(status_code=400, detail="Ya reportaste este contenido anteriormente")

    report = Report(
        reporter_id=current_user.id,
        report_type=data.report_type,
        reason=data.reason,
        description=data.description,
        supply_id=data.supply_id,
        reported_user_id=data.reported_user_id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/my", response_model=List[ReportResponse])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Report).filter(
        Report.reporter_id == current_user.id
    ).order_by(Report.created_at.desc()).all()


@router.get("/admin", response_model=List[AdminReportResponse])
def admin_list_reports(
    status: Optional[ReportStatus] = Query(None),
    report_type: Optional[ReportType] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin)
):
    q = db.query(Report)
    if status:
        q = q.filter(Report.status == status)
    if report_type:
        q = q.filter(Report.report_type == report_type)
    return q.order_by(Report.created_at.desc()).offset((page - 1) * limit).limit(limit).all()


@router.put("/admin/{report_id}/resolve", response_model=AdminReportResponse)
def resolve_report(
    report_id: int,
    data: ResolveReport,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    report.status = data.status
    report.admin_note = data.admin_note
    report.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(report)
    return report
