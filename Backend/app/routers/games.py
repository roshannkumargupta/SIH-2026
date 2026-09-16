from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select

from app.core.dependencies import DBSession, get_current_user
from app.models.game import GameAssignment
from app.models.user import User, UserRole
from app.ai.cognitive_engine import engine
from app.schemas.game import (
    AdaptiveLevelResponse,
    GameProgressResponse,
    GameSessionCreate,
    GameSessionResponse,
    GameSummaryResponse,
    GameTypeInfo,
)
from app.services.game_service import (
    get_available_game_types,
    get_patient_game_progress,
    get_patient_game_sessions,
    get_patient_game_summary,
    record_game_session,
)
from app.services.relationship_service import (
    caretaker_has_patient_access,
    doctor_has_patient_access,
)

router = APIRouter(
    prefix="/games",
    tags=["Cognitive Games"],
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
                detail="You can only access your own game records",
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
        detail="You do not have access to this patient's game data",
    )


@router.get("/types", response_model=list[GameTypeInfo])
def list_game_types():
    """List all available cognitive games and their descriptions."""
    return get_available_game_types()


@router.post(
    "/sessions",
    response_model=GameSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_game_session(
    data: GameSessionCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """Submit a completed cognitive game session and score."""
    patient_id = data.patient_id or current_user.id

    if current_user.role == UserRole.PATIENT and patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patients can only submit scores for themselves",
        )

    verify_patient_access(db, current_user, patient_id)

    return record_game_session(
        db=db,
        patient_id=patient_id,
        data=data,
    )


@router.get(
    "/sessions/patient/{patient_id}",
    response_model=list[GameSessionResponse],
)
def list_game_sessions(
    patient_id: UUID,
    db: DBSession,
    game_type: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
):
    """List historical game sessions for a patient."""
    verify_patient_access(db, current_user, patient_id)

    return get_patient_game_sessions(
        db=db,
        patient_id=patient_id,
        game_type=game_type,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/sessions/patient/{patient_id}/summary",
    response_model=GameSummaryResponse,
)
def get_game_summary(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """Get aggregated game performance statistics for a patient."""
    verify_patient_access(db, current_user, patient_id)

    return get_patient_game_summary(
        db=db,
        patient_id=patient_id,
    )


@router.get(
    "/sessions/patient/{patient_id}/progress",
    response_model=GameProgressResponse,
)
def get_game_progress(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """Get level progression and best scores for all games for a patient."""
    verify_patient_access(db, current_user, patient_id)

    prog_dict = get_patient_game_progress(
        db=db,
        patient_id=patient_id,
    )
    return GameProgressResponse(patient_id=patient_id, games=prog_dict)


# ---------------------------------------------------------------------------
# Convenience endpoints — authenticated user operates on their own record
# ---------------------------------------------------------------------------


@router.get(
    "/sessions/my",
    response_model=list[GameSessionResponse],
    summary="List my game sessions",
)
def list_my_game_sessions(
    db: DBSession,
    game_type: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
):
    """List the current user's own game session history."""
    return get_patient_game_sessions(
        db=db,
        patient_id=current_user.id,
        game_type=game_type,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/sessions/my/summary",
    response_model=GameSummaryResponse,
    summary="Get my game performance summary",
)
def get_my_game_summary(
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """Get the current user's own aggregated game performance statistics."""
    return get_patient_game_summary(
        db=db,
        patient_id=current_user.id,
    )


@router.get(
    "/sessions/my/progress",
    response_model=GameProgressResponse,
    summary="Get my game progression",
)
def get_my_game_progress(
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """Get the current user's own game level progression."""
    prog_dict = get_patient_game_progress(
        db=db,
        patient_id=current_user.id,
    )
    return GameProgressResponse(patient_id=current_user.id, games=prog_dict)


class AssignGamesRequest(BaseModel):
    game_ids: list[str]


@router.get(
    "/patient/{patient_id}/assigned",
    response_model=list[str],
    summary="List active game IDs assigned to patient",
)
def get_patient_assigned_games(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    verify_patient_access(db, current_user, patient_id)
    assignments = db.scalars(
        select(GameAssignment.game_id)
        .where(
            GameAssignment.patient_id == patient_id,
            GameAssignment.is_active.is_(True),
        )
    ).all()
    # If no games explicitly assigned, return all available game types by default
    if not assignments:
        all_types = get_available_game_types()
        return [g.id for g in all_types]
    return list(assignments)


@router.post(
    "/patient/{patient_id}/assign",
    response_model=list[str],
    summary="Assign a list of games for patient",
)
def set_patient_assigned_games(
    patient_id: UUID,
    data: AssignGamesRequest,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.CARETAKER, UserRole.DOCTOR, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only caregivers or doctors can configure game assignments",
        )
    verify_patient_access(db, current_user, patient_id)

    # Deactivate existing assignments
    existing = db.scalars(
        select(GameAssignment).where(GameAssignment.patient_id == patient_id)
    ).all()
    for a in existing:
        a.is_active = False

    # Insert new active assignments
    for gid in data.game_ids:
        new_a = GameAssignment(
            patient_id=patient_id,
            game_id=gid.strip(),
            assigned_by=current_user.id,
            is_active=True,
        )
        db.add(new_a)

    db.commit()
    return data.game_ids


@router.get(
    "/adaptive-level/{patient_id}/{game_id}",
    response_model=AdaptiveLevelResponse,
    summary="Get AI recommended game difficulty level",
)
def get_adaptive_game_level(
    patient_id: UUID,
    game_id: str,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """Calculate and return an AI-recommended difficulty level for a specific game and patient."""
    verify_patient_access(db, current_user, patient_id)
    return engine.recommend_level(db, patient_id, game_id)

