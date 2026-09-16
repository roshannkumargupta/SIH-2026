from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import DBSession, get_current_user
from app.models.user import User, UserRole
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate,
    AppointmentUpdate,
)
from app.services.appointment_service import (
    create_appointment,
    delete_appointment,
    get_appointment,
    get_patient_appointments,
    update_appointment,
    update_appointment_status,
)
from app.services.relationship_service import (
    caretaker_has_patient_access,
    doctor_has_patient_access,
)

router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
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
                detail="You can only view your own medical appointments",
            )
        return

    if current_user.role == UserRole.DOCTOR:
        if not doctor_has_patient_access(db, current_user.id, patient_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Doctor is not assigned to this patient",
            )
        return

    if current_user.role == UserRole.CARETAKER:
        if not caretaker_has_patient_access(db, current_user.id, patient_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Caretaker is not assigned to this patient",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this patient's appointments",
    )


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule a medical appointment",
)
def schedule_appointment(
    data: AppointmentCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    verify_patient_access(db, current_user, data.patient_id)
    return create_appointment(
        db=db,
        creator=current_user,
        data=data,
    )


@router.get(
    "",
    response_model=list[AppointmentResponse],
    summary="List patient appointments",
)
def list_appointments(
    db: DBSession,
    patient_id: UUID | None = Query(default=None),
    upcoming_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
):
    target_patient_id = patient_id or current_user.id
    verify_patient_access(db, current_user, target_patient_id)

    return get_patient_appointments(
        db=db,
        patient_id=target_patient_id,
        upcoming_only=upcoming_only,
    )


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    summary="Get single appointment details",
)
def get_single_appointment(
    appointment_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    appointment = get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    verify_patient_access(db, current_user, appointment.patient_id)
    return appointment


@router.patch(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    summary="Update appointment details",
)
def modify_appointment(
    appointment_id: UUID,
    data: AppointmentUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    appointment = get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    verify_patient_access(db, current_user, appointment.patient_id)
    return update_appointment(
        db=db,
        appointment=appointment,
        data=data,
    )


@router.post(
    "/{appointment_id}/status",
    response_model=AppointmentResponse,
    summary="Update appointment status",
)
def set_appointment_status(
    appointment_id: UUID,
    data: AppointmentStatusUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    appointment = get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    verify_patient_access(db, current_user, appointment.patient_id)
    return update_appointment_status(
        db=db,
        appointment=appointment,
        new_status=data.status,
    )


@router.delete(
    "/{appointment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete or cancel appointment",
)
def remove_appointment(
    appointment_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    appointment = get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    verify_patient_access(db, current_user, appointment.patient_id)
    delete_appointment(db, appointment)
    return None
