from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.relationship import (
    CaretakerPatient,
    DoctorPatient,
)
from app.models.user import User, UserRole


def get_user(
    db: Session,
    user_id: UUID,
) -> User | None:
    return db.get(User, user_id)


def doctor_patient_exists(
    db: Session,
    doctor_id: UUID,
    patient_id: UUID,
) -> bool:
    statement = select(DoctorPatient).where(
        DoctorPatient.doctor_id == doctor_id,
        DoctorPatient.patient_id == patient_id,
        DoctorPatient.active.is_(True),
    )

    return db.scalar(statement) is not None


def create_doctor_patient_relationship(
    db: Session,
    doctor_id: UUID,
    patient_id: UUID,
) -> DoctorPatient:

    doctor = get_user(db, doctor_id)
    patient = get_user(db, patient_id)

    if not doctor or doctor.role != UserRole.DOCTOR:
        raise ValueError("Invalid doctor")

    if not patient or patient.role != UserRole.PATIENT:
        raise ValueError("Invalid patient")

    if doctor_patient_exists(
        db,
        doctor_id,
        patient_id,
    ):
        raise ValueError(
            "Doctor-patient relationship already exists"
        )

    relationship = DoctorPatient(
        doctor_id=doctor_id,
        patient_id=patient_id,
    )

    db.add(relationship)
    db.commit()
    db.refresh(relationship)

    return relationship


def create_caretaker_patient_relationship(
    db: Session,
    caretaker_id: UUID,
    patient_id: UUID,
    relationship_type: str | None = None,
) -> CaretakerPatient:

    caretaker = get_user(db, caretaker_id)
    patient = get_user(db, patient_id)

    if not caretaker or caretaker.role != UserRole.CARETAKER:
        raise ValueError("Invalid caretaker")

    if not patient or patient.role != UserRole.PATIENT:
        raise ValueError("Invalid patient")

    statement = select(CaretakerPatient).where(
        CaretakerPatient.caretaker_id == caretaker_id,
        CaretakerPatient.patient_id == patient_id,
        CaretakerPatient.active.is_(True),
    )

    if db.scalar(statement):
        raise ValueError(
            "Caretaker-patient relationship already exists"
        )

    relationship = CaretakerPatient(
        caretaker_id=caretaker_id,
        patient_id=patient_id,
        relationship_type=relationship_type,
    )

    db.add(relationship)
    db.commit()
    db.refresh(relationship)

    return relationship


def doctor_has_patient_access(
    db: Session,
    doctor_id: UUID,
    patient_id: UUID,
) -> bool:

    statement = select(DoctorPatient).where(
        DoctorPatient.doctor_id == doctor_id,
        DoctorPatient.patient_id == patient_id,
        DoctorPatient.active.is_(True),
    )

    return db.scalar(statement) is not None


def caretaker_has_patient_access(
    db: Session,
    caretaker_id: UUID,
    patient_id: UUID,
) -> bool:

    statement = select(CaretakerPatient).where(
        CaretakerPatient.caretaker_id == caretaker_id,
        CaretakerPatient.patient_id == patient_id,
        CaretakerPatient.active.is_(True),
    )

    return db.scalar(statement) is not None