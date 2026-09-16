from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import DBSession, get_current_user
from app.models.hydration import HydrationSource
from app.models.user import User, UserRole
from app.schemas.hydration import (
    DailyHydrationGoalResponse,
    DailyHydrationGoalUpdate,
    HydrationLogCreate,
    HydrationLogResponse,
    HydrationTodaySummary,
)
from app.services.hydration_service import (
    get_daily_goal,
    get_hydration_history,
    get_today_summary,
    log_hydration,
    set_daily_goal,
)
from app.services.relationship_service import (
    caretaker_has_patient_access,
    doctor_has_patient_access,
)

router = APIRouter(
    prefix="/hydration",
    tags=["Hydration"],
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
                detail="You can only access your own hydration records",
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
        detail="You do not have permission to access this patient's records",
    )


@router.post(
    "/log",
    response_model=HydrationLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a water intake session",
)
def create_hydration_log(
    data: HydrationLogCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    target_patient_id = data.patient_id or current_user.id
    verify_patient_access(db, current_user, target_patient_id)

    # If caretaker is logging for patient, set appropriate source
    source = data.source
    if current_user.role == UserRole.CARETAKER and current_user.id != target_patient_id:
        source = HydrationSource.CAREGIVER_LOGGED

    return log_hydration(
        db=db,
        patient_id=target_patient_id,
        amount_ml=data.amount_ml,
        source=source,
    )


@router.get(
    "/today",
    response_model=HydrationTodaySummary,
    summary="Get today's hydration total and progress",
)
def get_today_hydration(
    db: DBSession,
    patient_id: UUID | None = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    target_patient_id = patient_id or current_user.id
    verify_patient_access(db, current_user, target_patient_id)

    return get_today_summary(
        db=db,
        patient_id=target_patient_id,
    )


@router.get(
    "/history",
    response_model=list[dict],
    summary="Get historical daily hydration records",
)
def get_hydration_history_records(
    db: DBSession,
    patient_id: UUID | None = Query(default=None),
    days: int = Query(default=7, ge=1, le=30),
    current_user: User = Depends(get_current_user),
):
    target_patient_id = patient_id or current_user.id
    verify_patient_access(db, current_user, target_patient_id)

    return get_hydration_history(
        db=db,
        patient_id=target_patient_id,
        days=days,
    )


@router.post(
    "/goal",
    response_model=DailyHydrationGoalResponse,
    summary="Set or update daily hydration goal",
)
def update_daily_goal(
    data: DailyHydrationGoalUpdate,
    db: DBSession,
    patient_id: UUID | None = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    target_patient_id = patient_id or current_user.id
    verify_patient_access(db, current_user, target_patient_id)

    record = set_daily_goal(
        db=db,
        patient_id=target_patient_id,
        goal_ml=data.goal_ml,
    )
    return record
