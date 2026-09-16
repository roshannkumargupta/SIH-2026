from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.patient import PatientProfile
from app.models.user import User, UserRole
from app.schemas.patient import (
    PatientProfileCreate,
    PatientProfileUpdate,
)


def get_patient_profile(
    db: Session,
    patient_id: UUID,
) -> PatientProfile | None:

    statement = select(PatientProfile).where(
        PatientProfile.user_id == patient_id
    )

    return db.scalar(statement)


def create_patient_profile(
    db: Session,
    patient: User,
    data: PatientProfileCreate,
) -> PatientProfile:

    if patient.role != UserRole.PATIENT:
        raise ValueError(
            "Only patient users can have a patient profile"
        )

    existing_profile = get_patient_profile(
        db,
        patient.id,
    )

    if existing_profile:
        raise ValueError(
            "Patient profile already exists"
        )

    profile = PatientProfile(
        user_id=patient.id,
        date_of_birth=data.date_of_birth,
        emergency_contact_name=data.emergency_contact_name,
        emergency_contact_phone=data.emergency_contact_phone,
        preferred_language=data.preferred_language,
        gender=data.gender,
        address=data.address,
        doctor_name=data.doctor_name,
        timezone=data.timezone,
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


def update_patient_profile(
    db: Session,
    profile: PatientProfile,
    data: PatientProfileUpdate,
) -> PatientProfile:

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile