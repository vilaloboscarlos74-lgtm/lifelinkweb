from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func


def compute_badges(user, db: Session) -> list:
    from app.models.supply import Supply
    from app.models.request import ContactRequest, RequestStatus

    badges = []
    now = datetime.now(timezone.utc)

    if user.is_verified:
        badges.append({"id": "verified", "label": "Verificado", "icon": "✅", "color": "blue",
                        "desc": "Identidad verificada por el equipo de LifeLink"})

    if user.is_blood_donor:
        badges.append({"id": "blood_donor", "label": "Donante de Sangre", "icon": "🩸", "color": "red",
                        "desc": "Registrado como donante de sangre activo"})

    # Insignias por donaciones realizadas
    from app.models.blood import BloodDonorRecord
    blood_record = db.query(BloodDonorRecord).filter(BloodDonorRecord.user_id == user.id).first()
    if blood_record:
        n = blood_record.total_donations
        if n >= 10:
            badges.append({"id": "blood_legend", "label": "Héroe de Vida", "icon": "🏅", "color": "red",
                           "desc": f"Ha realizado {n} donaciones de sangre"})
        elif n >= 5:
            badges.append({"id": "blood_hero", "label": "Donante Frecuente", "icon": "💉", "color": "rose",
                           "desc": f"Ha realizado {n} donaciones de sangre"})
        elif n >= 1:
            badges.append({"id": "blood_first", "label": "Primera Donación", "icon": "❤️", "color": "red",
                           "desc": "Ha realizado su primera donación de sangre"})

    supply_count = db.query(func.count(Supply.id)).filter(Supply.owner_id == user.id).scalar() or 0
    if supply_count >= 10:
        badges.append({"id": "super_sharer", "label": "Super Colaborador", "icon": "🏆", "color": "amber",
                        "desc": f"Ha publicado {supply_count} insumos en la plataforma"})
    elif supply_count >= 3:
        badges.append({"id": "active_sharer", "label": "Colaborador Activo", "icon": "📦", "color": "green",
                        "desc": f"Ha publicado {supply_count} insumos en la plataforma"})

    if user.rating_avg and user.rating_avg >= 4.5:
        badges.append({"id": "top_rated", "label": "Muy Bien Calificado", "icon": "⭐", "color": "yellow",
                        "desc": f"Calificación promedio de {user.rating_avg:.1f}/5"})

    completed = db.query(func.count(ContactRequest.id)).filter(
        ContactRequest.receiver_id == user.id,
        ContactRequest.status == RequestStatus.COMPLETADA,
    ).scalar() or 0
    if completed >= 5:
        badges.append({"id": "hero", "label": "Héroe Solidario", "icon": "❤️", "color": "rose",
                        "desc": f"Ha completado {completed} entregas exitosas"})

    created = user.created_at
    if created:
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if (now - created).days <= 30:
            badges.append({"id": "new_member", "label": "Nuevo Miembro", "icon": "🌱", "color": "emerald",
                            "desc": "Se unió recientemente a la comunidad"})

    return badges
