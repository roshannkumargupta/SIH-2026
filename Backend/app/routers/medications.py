from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import (
    DBSession,
    get_current_user,
)
from app.models.medication import (
    MedicationLogStatus,
)
from app.models.user import User, UserRole
from app.schemas.medication import (
    MedicationActionRequest,
    MedicationLogResponse,
    MedicationScheduleCreate,
    MedicationScheduleResponse,
    MedicationScheduleUpdate,
)
from app.services.medication_service import (
    create_medication_log,
    create_schedule,
    get_medication_log,
    get_patient_medication_logs,
    get_patient_schedules,
    get_schedule,
    update_medication_log_status,
    update_schedule,
)
from app.services.relationship_service import (
    caretaker_has_patient_access,
    doctor_has_patient_access,
)
from app.services.prescription_service import (
    get_prescription,
)


router = APIRouter(
    prefix="/medications",
    tags=["Medications"],
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
                detail="You can only access your own medications",
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
        detail="You do not have medication access",
    )


@router.post(
    "/schedules",
    response_model=MedicationScheduleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_medication_schedule(
    data: MedicationScheduleCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.DOCTOR, UserRole.CARETAKER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors or authorized caregivers can create medication schedules",
        )

    prescription = get_prescription(
        db,
        data.prescription_id,
    )

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found",
        )

    if current_user.role == UserRole.DOCTOR and not doctor_has_patient_access(
        db,
        current_user.id,
        prescription.patient_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor is not assigned to this patient",
        )
    elif current_user.role == UserRole.CARETAKER and not caretaker_has_patient_access(
        db,
        current_user.id,
        prescription.patient_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Caretaker is not assigned to this patient",
        )

    try:
        schedule = create_schedule(
            db,
            current_user,
            data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return schedule


@router.get(
    "/patient/{patient_id}",
    response_model=list[MedicationScheduleResponse],
)
def get_patient_medications(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    verify_patient_access(
        db,
        current_user,
        patient_id,
    )

    return get_patient_schedules(
        db,
        patient_id,
    )


@router.get(
    "/patient/{patient_id}/today",
    response_model=list[MedicationScheduleResponse],
)
def get_today_medications(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    verify_patient_access(
        db,
        current_user,
        patient_id,
    )

    return get_patient_schedules(
        db,
        patient_id,
        date.today(),
    )


@router.put(
    "/schedules/{schedule_id}",
    response_model=MedicationScheduleResponse,
)
def update_medication_schedule(
    schedule_id: UUID,
    data: MedicationScheduleUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    schedule = get_schedule(
        db,
        schedule_id,
    )

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication schedule not found",
        )

    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can update medication schedules",
        )

    prescription = get_prescription(
        db,
        schedule.prescription_id,
    )

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found",
        )

    if prescription.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the prescribing doctor can update this schedule",
        )

    try:
        return update_schedule(
            db,
            schedule,
            data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.post(
    "/schedules/{schedule_id}/generate-log",
    response_model=MedicationLogResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_medication_log(
    schedule_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    schedule = get_schedule(
        db,
        schedule_id,
    )

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication schedule not found",
        )

    verify_patient_access(
        db,
        current_user,
        schedule.patient_id,
    )

    scheduled_datetime = datetime.combine(
        date.today(),
        schedule.scheduled_time,
        tzinfo=timezone.utc,
    )

    return create_medication_log(
        db,
        schedule,
        scheduled_datetime,
    )


@router.get(
    "/logs/patient/{patient_id}",
    response_model=list[MedicationLogResponse],
)
def get_patient_logs(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    verify_patient_access(
        db,
        current_user,
        patient_id,
    )

    return get_patient_medication_logs(
        db,
        patient_id,
    )


@router.get(
    "/logs/patient/{patient_id}/today",
    response_model=list[MedicationLogResponse],
)
def get_today_logs(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    verify_patient_access(
        db,
        current_user,
        patient_id,
    )

    return get_patient_medication_logs(
        db,
        patient_id,
        date.today(),
    )


@router.post(
    "/logs/{log_id}/status",
    response_model=MedicationLogResponse,
)
def update_log_status(
    log_id: UUID,
    data: MedicationActionRequest,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    log = get_medication_log(
        db,
        log_id,
    )

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication log not found",
        )

    verify_patient_access(
        db,
        current_user,
        log.patient_id,
    )

    if current_user.role not in (
        UserRole.PATIENT,
        UserRole.CARETAKER,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only the patient or assigned caretaker "
                "can update medication status"
            ),
        )

    return update_medication_log_status(
        db,
        log,
        data.status,
    )