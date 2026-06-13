from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.blood import BloodDonorRecord, BloodDonation
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/blood", tags=["Donación de sangre"])

MIN_WEIGHT_KG = 50.0
MIN_AGE_YEARS = 18
MAX_AGE_YEARS = 65
MIN_DAYS_BETWEEN_DONATIONS = 60


# ── Schemas ───────────────────────────────────────────────────────────────────

class BloodRecordIn(BaseModel):
    weight_kg: Optional[float] = None
    birth_date: Optional[datetime] = None
    has_hiv: bool = False
    has_hepatitis_b: bool = False
    has_hepatitis_c: bool = False
    has_sifilis: bool = False
    has_chagas: bool = False
    has_cancer: bool = False
    has_diabetes_insulin: bool = False
    has_epilepsy: bool = False
    had_recent_tattoo: bool = False
    had_recent_piercing: bool = False
    is_pregnant: bool = False
    had_recent_surgery: bool = False
    is_breastfeeding: bool = False
    notes: Optional[str] = None


class BloodRecordOut(BloodRecordIn):
    id: int
    user_id: int
    last_donation_date: Optional[datetime] = None
    total_donations: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DonationIn(BaseModel):
    donation_date: datetime
    location: Optional[str] = None
    notes: Optional[str] = None


class DonationOut(DonationIn):
    id: int
    record_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class EligibilityResult(BaseModel):
    eligible: bool
    reasons: List[str]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _check_eligibility(record: BloodDonorRecord) -> EligibilityResult:
    reasons: List[str] = []

    # Exclusiones permanentes
    if record.has_hiv:
        reasons.append("Portador de VIH/SIDA (exclusión permanente)")
    if record.has_hepatitis_b:
        reasons.append("Hepatitis B (exclusión permanente)")
    if record.has_hepatitis_c:
        reasons.append("Hepatitis C (exclusión permanente)")
    if record.has_sifilis:
        reasons.append("Sífilis (exclusión permanente)")
    if record.has_chagas:
        reasons.append("Enfermedad de Chagas (exclusión permanente)")
    if record.has_cancer:
        reasons.append("Cáncer (exclusión permanente)")
    if record.has_diabetes_insulin:
        reasons.append("Diabetes insulinodependiente (exclusión permanente)")
    if record.has_epilepsy:
        reasons.append("Epilepsia activa (exclusión permanente)")

    # Peso
    if record.weight_kg is not None and record.weight_kg < MIN_WEIGHT_KG:
        reasons.append(f"Peso insuficiente ({record.weight_kg} kg; mínimo {MIN_WEIGHT_KG} kg)")

    # Edad
    if record.birth_date:
        birth = record.birth_date
        if birth.tzinfo is None:
            birth = birth.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        age_years = (now - birth).days / 365.25
        if age_years < MIN_AGE_YEARS:
            reasons.append(f"Edad insuficiente ({int(age_years)} años; mínimo {MIN_AGE_YEARS})")
        elif age_years > MAX_AGE_YEARS:
            reasons.append(f"Edad máxima superada ({int(age_years)} años; máximo {MAX_AGE_YEARS})")

    # Exclusiones temporales
    if record.had_recent_tattoo:
        reasons.append("Tatuaje reciente (esperar 12 meses)")
    if record.had_recent_piercing:
        reasons.append("Piercing reciente (esperar 12 meses)")
    if record.is_pregnant:
        reasons.append("Embarazo actual")
    if record.had_recent_surgery:
        reasons.append("Cirugía reciente (esperar según indicación médica)")
    if record.is_breastfeeding:
        reasons.append("Lactancia materna")

    # Tiempo desde última donación
    if record.last_donation_date:
        last = record.last_donation_date
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        days_since = (datetime.now(timezone.utc) - last).days
        if days_since < MIN_DAYS_BETWEEN_DONATIONS:
            remaining = MIN_DAYS_BETWEEN_DONATIONS - days_since
            reasons.append(
                f"Donación reciente (hace {days_since} días; faltan {remaining} días para poder donar)"
            )

    return EligibilityResult(eligible=len(reasons) == 0, reasons=reasons)


def _get_record_or_404(user: User, db: Session) -> BloodDonorRecord:
    record = db.query(BloodDonorRecord).filter(BloodDonorRecord.user_id == user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="No tienes un expediente médico de donación")
    return record


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/record", response_model=BloodRecordOut)
def get_blood_record(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_record_or_404(current_user, db)


@router.post("/record", response_model=BloodRecordOut, status_code=status.HTTP_201_CREATED)
def create_or_update_blood_record(
    data: BloodRecordIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(BloodDonorRecord).filter(BloodDonorRecord.user_id == current_user.id).first()

    if record:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(record, field, value)
    else:
        record = BloodDonorRecord(user_id=current_user.id, **data.model_dump())
        db.add(record)

    db.commit()
    db.refresh(record)
    return record


@router.get("/record/eligibility", response_model=EligibilityResult)
def check_eligibility(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _get_record_or_404(current_user, db)
    return _check_eligibility(record)


@router.get("/record/donations", response_model=List[DonationOut])
def list_donations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _get_record_or_404(current_user, db)
    return record.donations


@router.post("/record/donations", response_model=DonationOut, status_code=status.HTTP_201_CREATED)
def register_donation(
    data: DonationIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = _get_record_or_404(current_user, db)

    eligibility = _check_eligibility(record)
    if not eligibility.eligible:
        raise HTTPException(
            status_code=400,
            detail=f"No cumples los requisitos para donar: {'; '.join(eligibility.reasons)}",
        )

    donation = BloodDonation(
        record_id=record.id,
        donation_date=data.donation_date,
        location=data.location,
        notes=data.notes,
    )
    db.add(donation)

    record.last_donation_date = data.donation_date
    record.total_donations += 1

    db.commit()
    db.refresh(donation)
    return donation


# ── Perfil público de donante (sin datos sensibles) ───────────────────────────

class PublicDonorProfile(BaseModel):
    user_id: int
    is_blood_donor: bool
    blood_type: Optional[str] = None
    total_donations: int = 0
    last_donation_year: Optional[int] = None  # solo el año, nunca la fecha exacta
    is_currently_eligible: bool = False


@router.get("/record/public/{user_id}", response_model=PublicDonorProfile)
def get_public_donor_profile(user_id: int, db: Session = Depends(get_db)):
    """Información pública del donante: tipo de sangre y estadísticas. Sin datos médicos."""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    record = db.query(BloodDonorRecord).filter(BloodDonorRecord.user_id == user_id).first()

    blood_type_val = user.blood_type.value if user.blood_type else None
    total_donations = record.total_donations if record else 0
    last_year = None
    is_eligible = False

    if record:
        if record.last_donation_date:
            last = record.last_donation_date
            if last.tzinfo is None:
                last = last.replace(tzinfo=timezone.utc)
            last_year = last.year
        is_eligible = _check_eligibility(record).eligible

    return PublicDonorProfile(
        user_id=user_id,
        is_blood_donor=bool(user.is_blood_donor),
        blood_type=blood_type_val,
        total_donations=total_donations,
        last_donation_year=last_year,
        is_currently_eligible=is_eligible,
    )
