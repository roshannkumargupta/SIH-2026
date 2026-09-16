from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.appointment import (
    Appointment,
    AppointmentStatus,
)
from app.models.user import User, UserRole
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
)


def create_appointment(
    db: Session,
    creator: User,
    data: AppointmentCreate,
) -> Appointment:
    if creator.role not in (UserRole.CARETAKER, UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to create appointments",
        )

    appointment = Appointment(
        patient_id=data.patient_id,
        created_by=creator.id,
        title=data.title,
        doctor_name=data.doctor_name,
        location=data.location,
        appointment_datetime=data.appointment_datetime,
        notes=data.notes,
        status=AppointmentStatus.SCHEDULED,
        reminder_lead_minutes=data.reminder_lead_minutes,
    )

    try:
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
        return appointment
    except Exception:
        db.rollback()
        raise


def get_patient_appointments(
    db: Session,
    patient_id: UUID,
    upcoming_only: bool = False,
) -> list[Appointment]:
    statement = (
        select(Appointment)
        .where(Appointment.patient_id == patient_id)
    )

    if upcoming_only:
        now_utc = datetime.now(timezone.utc)
        statement = statement.where(
            Appointment.appointment_datetime >= now_utc,
            Appointment.status == AppointmentStatus.SCHEDULED,
        )

    statement = statement.order_by(Appointment.appointment_datetime.asc())
    return list(db.scalars(statement).all())


def get_appointment(
    db: Session,
    appointment_id: UUID,
) -> Appointment | None:
    return db.get(Appointment, appointment_id)


def update_appointment(
    db: Session,
    appointment: Appointment,
    data: AppointmentUpdate,
) -> Appointment:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)

    try:
        db.commit()
        db.refresh(appointment)
        return appointment
    except Exception:
        db.rollback()
        raise


def update_appointment_status(
    db: Session,
    appointment: Appointment,
    new_status: AppointmentStatus,
) -> Appointment:
    appointment.status = new_status
    try:
        db.commit()
        db.refresh(appointment)
        return appointment
    except Exception:
        db.rollback()
        raise


def delete_appointment(
    db: Session,
    appointment: Appointment,
) -> bool:
    try:
        db.delete(appointment)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise
