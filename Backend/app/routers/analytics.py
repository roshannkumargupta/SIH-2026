from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import DBSession, get_current_user
from app.models.user import User, UserRole
from app.schemas.analytics import (
    CognitiveAssessmentResponse,
    CognitiveTrendResponse,
)
from app.services.analytics_service import (
    get_latest_assessment,
    get_patient_cognitive_trends,
    run_patient_assessment,
)
from app.services.relationship_service import (
    caretaker_has_patient_access,
    doctor_has_patient_access,
)

router = APIRouter(
    prefix="/analytics",
    tags=["Cognitive Assessment & Analytics"],
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
                detail="You can only view your own cognitive analytics",
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
        detail="You do not have access to this patient's analytics",
    )


@router.post(
    "/patient/{patient_id}/assess",
    response_model=CognitiveAssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def trigger_assessment(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """Trigger a fresh AI cognitive evaluation for the patient."""
    verify_patient_access(db, current_user, patient_id)

    return run_patient_assessment(
        db=db,
        patient_id=patient_id,
    )


@router.get(
    "/patient/{patient_id}/latest",
    response_model=CognitiveAssessmentResponse,
)
def get_latest_patient_assessment(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """Retrieve the latest cognitive assessment and risk level for the patient."""
    verify_patient_access(db, current_user, patient_id)

    return get_latest_assessment(
        db=db,
        patient_id=patient_id,
    )


@router.get(
    "/patient/{patient_id}/trends",
    response_model=CognitiveTrendResponse,
)
def get_patient_trends(
    patient_id: UUID,
    db: DBSession,
    days: int = Query(default=30, ge=7, le=180),
    current_user: User = Depends(get_current_user),
):
    """Get cognitive score trends over time for visualization charts."""
    verify_patient_access(db, current_user, patient_id)

    return get_patient_cognitive_trends(
        db=db,
        patient_id=patient_id,
        days=days,
    )
