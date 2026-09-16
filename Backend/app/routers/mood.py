from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import DBSession, get_current_user
from app.models.user import User, UserRole
from app.schemas.mood_checkin import (
    MoodCheckinCreate,
    MoodCheckinResponse,
    MoodTrendResponse,
)
from app.services.mood_checkin_service import (
    get_mood_trend,
    get_recent_moods,
    log_mood,
)
from app.services.relationship_service import (
    caretaker_has_patient_access,
    doctor_has_patient_access,
)

router = APIRouter(
    prefix="/mood",
    tags=["Mood & Wellbeing"],
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
                detail="You can only access your own mood records",
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
    "/checkin",
    response_model=MoodCheckinResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a mood check-in",
)
def create_mood_checkin(
    data: MoodCheckinCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    target_patient_id = data.patient_id or current_user.id
    verify_patient_access(db, current_user, target_patient_id)

    checkin = log_mood(
        db=db,
        patient_id=target_patient_id,
        mood=data.mood,
        note=data.note,
    )
    return checkin


@router.get(
    "/history",
    response_model=list[MoodCheckinResponse],
    summary="Get recent mood check-ins for patient",
)
def get_mood_history(
    db: DBSession,
    patient_id: UUID | None = Query(default=None, description="Patient UUID"),
    days: int = Query(default=7, ge=1, le=90, description="Evaluation window in days"),
    current_user: User = Depends(get_current_user),
):
    target_patient_id = patient_id or (current_user.id if current_user.role == UserRole.PATIENT else None)
    if not target_patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="patient_id query parameter is required for non-patient users",
        )

    verify_patient_access(db, current_user, target_patient_id)
    return get_recent_moods(db=db, patient_id=target_patient_id, days=days)


@router.get(
    "/trend",
    response_model=MoodTrendResponse,
    summary="Get mood distribution trend and distress alerts",
)
def get_patient_mood_trend(
    db: DBSession,
    patient_id: UUID | None = Query(default=None, description="Patient UUID"),
    days: int = Query(default=7, ge=1, le=90, description="Evaluation window in days"),
    current_user: User = Depends(get_current_user),
):
    target_patient_id = patient_id or (current_user.id if current_user.role == UserRole.PATIENT else None)
    if not target_patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="patient_id query parameter is required for non-patient users",
        )

    verify_patient_access(db, current_user, target_patient_id)
    return get_mood_trend(db=db, patient_id=target_patient_id, days=days)
