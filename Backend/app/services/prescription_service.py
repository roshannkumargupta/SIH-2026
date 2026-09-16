from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.prescription import (
    Prescription,
    PrescriptionStatus,
)
from app.models.user import User, UserRole
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
)


def get_prescription(
    db: Session,
    prescription_id: UUID,
) -> Prescription | None:

    return db.get(
        Prescription,
        prescription_id,
    )


def get_patient_prescriptions(
    db: Session,
    patient_id: UUID,
) -> list[Prescription]:

    statement = (
        select(Prescription)
        .where(
            Prescription.patient_id == patient_id
        )
        .order_by(
            Prescription.created_at.desc()
        )
    )

    return list(db.scalars(statement).all())


def create_prescription(
    db: Session,
    doctor: User,
    data: PrescriptionCreate,
) -> Prescription:

    if doctor.role not in (UserRole.DOCTOR, UserRole.CARETAKER, UserRole.ADMIN):
        raise ValueError(
            "Only doctors or authorized caregivers can create prescriptions"
        )

    if data.end_date and data.end_date < data.start_date:
        raise ValueError(
            "End date cannot be before start date"
        )

    prescription = Prescription(
        patient_id=data.patient_id,
        doctor_id=doctor.id,
        medicine_name=data.medicine_name,
        dosage=data.dosage,
        route=data.route,
        instructions=data.instructions,
        start_date=data.start_date,
        end_date=data.end_date,
        notes=data.notes,
        status=PrescriptionStatus.ACTIVE,
    )

    db.add(prescription)
    db.commit()
    db.refresh(prescription)

    return prescription


def update_prescription(
    db: Session,
    prescription: Prescription,
    data: PrescriptionUpdate,
) -> Prescription:

    update_data = data.model_dump(
        exclude_unset=True
    )

    new_start_date = update_data.get(
        "start_date",
        prescription.start_date,
    )

    new_end_date = update_data.get(
        "end_date",
        prescription.end_date,
    )

    if (
        new_end_date
        and new_end_date < new_start_date
    ):
        raise ValueError(
            "End date cannot be before start date"
        )

    for field, value in update_data.items():
        setattr(
            prescription,
            field,
            value,
        )

    db.commit()
    db.refresh(prescription)

    return prescription


def delete_prescription(
    db: Session,
    prescription: Prescription,
) -> None:

    db.delete(prescription)
    db.commit()