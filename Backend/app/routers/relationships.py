from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import (
    DBSession,
    get_current_user,
    require_admin,
)
from app.models.user import User, UserRole
from app.schemas.relationship import (
    CaretakerPatientCreate,
    CaretakerPatientResponse,
    DoctorPatientCreate,
    DoctorPatientResponse,
)
from app.services.relationship_service import (
    create_caretaker_patient_relationship,
    create_doctor_patient_relationship,
    caretaker_has_patient_access,
    doctor_has_patient_access,
)


router = APIRouter(
    prefix="/relationships",
    tags=["Relationships"],
)


@router.post(
    "/doctor",
    response_model=DoctorPatientResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_doctor_relationship(
    data: DoctorPatientCreate,
    db: DBSession,
    current_user: User = Depends(require_admin),
):
    try:
        relationship = create_doctor_patient_relationship(
            db,
            data.doctor_id,
            data.patient_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return relationship


@router.post(
    "/caretaker",
    response_model=CaretakerPatientResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_caretaker_relationship(
    data: CaretakerPatientCreate,
    db: DBSession,
    current_user: User = Depends(require_admin),
):
    try:
        relationship = create_caretaker_patient_relationship(
            db,
            data.caretaker_id,
            data.patient_id,
            data.relationship_type,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return relationship


@router.get("/doctor/patient/{patient_id}/access")
def check_doctor_patient_access(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.ADMIN:
        return {"has_access": True}

    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can use this endpoint",
        )

    has_access = doctor_has_patient_access(
        db,
        current_user.id,
        patient_id,
    )

    return {
        "has_access": has_access,
    }


@router.get("/caretaker/patient/{patient_id}/access")
def check_caretaker_patient_access(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.ADMIN:
        return {"has_access": True}

    if current_user.role != UserRole.CARETAKER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only caretakers can use this endpoint",
        )

    has_access = caretaker_has_patient_access(
        db,
        current_user.id,
        patient_id,
    )

    return {
        "has_access": has_access,
    }