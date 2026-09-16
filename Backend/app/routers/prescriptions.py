from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import (
    DBSession,
    get_current_user,
)
from app.models.user import User, UserRole
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionResponse,
    PrescriptionUpdate,
)
from app.services.prescription_service import (
    create_prescription,
    delete_prescription,
    get_patient_prescriptions,
    get_prescription,
    update_prescription,
)
from app.services.relationship_service import (
    caretaker_has_patient_access,
    doctor_has_patient_access,
)


router = APIRouter(
    prefix="/prescriptions",
    tags=["Prescriptions"],
)


def verify_patient_access(
    db,
    current_user: User,
    patient_id: UUID,
):
    if current_user.role == UserRole.ADMIN:
        return

    if current_user.role == UserRole.PATIENT:
        if current_user.id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own prescriptions",
            )
        return

    if current_user.role == UserRole.DOCTOR:
        if not doctor_has_patient_access(
            db,
            current_user.id,
            patient_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Doctor is not assigned to this patient",
            )
        return

    if current_user.role == UserRole.CARETAKER:
        if not caretaker_has_patient_access(
            db,
            current_user.id,
            patient_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Caretaker is not assigned to this patient",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access prescriptions",
    )


@router.post(
    "",
    response_model=PrescriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_prescription(
    data: PrescriptionCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.DOCTOR, UserRole.CARETAKER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors or authorized caregivers can create prescriptions",
        )

    if current_user.role == UserRole.DOCTOR and not doctor_has_patient_access(
        db,
        current_user.id,
        data.patient_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor is not assigned to this patient",
        )
    elif current_user.role == UserRole.CARETAKER and not caretaker_has_patient_access(
        db,
        current_user.id,
        data.patient_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Caretaker is not assigned to this patient",
        )

    try:
        prescription = create_prescription(
            db,
            current_user,
            data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return prescription


@router.get(
    "/patient/{patient_id}",
    response_model=list[PrescriptionResponse],
)
def list_patient_prescriptions(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    verify_patient_access(
        db,
        current_user,
        patient_id,
    )

    return get_patient_prescriptions(
        db,
        patient_id,
    )


@router.get(
    "/{prescription_id}",
    response_model=PrescriptionResponse,
)
def get_single_prescription(
    prescription_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    prescription = get_prescription(
        db,
        prescription_id,
    )

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found",
        )

    verify_patient_access(
        db,
        current_user,
        prescription.patient_id,
    )

    return prescription


@router.put(
    "/{prescription_id}",
    response_model=PrescriptionResponse,
)
def update_existing_prescription(
    prescription_id: UUID,
    data: PrescriptionUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    prescription = get_prescription(
        db,
        prescription_id,
    )

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found",
        )

    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can update prescriptions",
        )

    if prescription.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the prescribing doctor can update this prescription",
        )

    if not doctor_has_patient_access(
        db,
        current_user.id,
        prescription.patient_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor is not assigned to this patient",
        )

    try:
        return update_prescription(
            db,
            prescription,
            data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.delete(
    "/{prescription_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_existing_prescription(
    prescription_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    prescription = get_prescription(
        db,
        prescription_id,
    )

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found",
        )

    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can delete prescriptions",
        )

    if prescription.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the prescribing doctor can delete this prescription",
        )

    if not doctor_has_patient_access(
        db,
        current_user.id,
        prescription.patient_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor is not assigned to this patient",
        )

    delete_prescription(
        db,
        prescription,
    )

    return None