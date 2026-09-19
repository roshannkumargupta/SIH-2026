from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select

from app.core.dependencies import DBSession, get_current_user
from app.models.game import GameAssignment, PatientGameAbility
from app.models.user import User, UserRole
from app.ai.cognitive_engine import engine
from app.ai.game_domain_mapping import (
    ALL_GAMES,
    GAME_TO_DOMAINS,
    get_max_level_for_game,
    normalize_game_id,
)
from app.ai.ml_difficulty import COOLDOWN_MINUTES
from app.schemas.game import (
    AdaptiveLevelResponse,
    GameAbilityItem,
    GameAbilityOverviewResponse,
    GameOverrideRequest,
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


@router.get(
    "/patient/{patient_id}/abilities",
    response_model=GameAbilityOverviewResponse,
    summary="Get patient latent abilities and calibration overview across all games",
)
def get_patient_abilities(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """
    Returns Bayesian ability state (theta, sigma), confidence rating,
    current and recommended levels, and caregiver overrides across all 24 games.
    """
    verify_patient_access(db, current_user, patient_id)

    # 1. Fetch existing ability records
    existing_abilities = list(
        db.scalars(
            select(PatientGameAbility).where(PatientGameAbility.patient_id == patient_id)
        ).all()
    )
    ability_map: dict[str, PatientGameAbility] = {}
    for a in existing_abilities:
        ability_map[a.game_id] = a
        ability_map[normalize_game_id(a.game_id)] = a

    # 2. Build game name map
    game_types = get_available_game_types()
    game_name_map = {g.id: g.name for g in game_types}

    now = datetime.now(timezone.utc)
    items: list[GameAbilityItem] = []

    for g_id in ALL_GAMES:
        norm_id = normalize_game_id(g_id)
        ability = ability_map.get(g_id) or ability_map.get(norm_id)
        max_lvl = get_max_level_for_game(g_id)
        domains = GAME_TO_DOMAINS.get(g_id) or GAME_TO_DOMAINS.get(norm_id) or []

        if ability is not None:
            theta = ability.theta
            sigma = ability.sigma
            sessions_count = ability.sessions_count
            current_lvl = ability.last_level_played or 1
            rec_lvl = ability.manual_override_level or ability.last_recommended_level or max(1, min(max_lvl, int(round(theta))))
            manual_override = ability.manual_override_level
            last_played = ability.updated_at
            last_lowered = ability.last_lowered_at
        else:
            theta = 1.0
            sigma = 1.50
            sessions_count = 0
            current_lvl = 1
            rec_lvl = 1
            manual_override = None
            last_played = None
            last_lowered = None

        # Determine confidence
        if sigma <= 0.60 and sessions_count >= 4:
            conf = "high"
        elif sigma <= 1.05 and sessions_count >= 2:
            conf = "medium"
        else:
            conf = "low"

        # Check anti-oscillation cooldown
        cooldown_active = False
        if last_lowered:
            dt_lowered = last_lowered if last_lowered.tzinfo else last_lowered.replace(tzinfo=timezone.utc)
            if (now - dt_lowered).total_seconds() < (COOLDOWN_MINUTES * 60.0):
                cooldown_active = True

        name = game_name_map.get(g_id) or game_name_map.get(norm_id) or g_id.replace("_", " ").title()

        items.append(
            GameAbilityItem(
                game_id=g_id,
                game_name=name,
                cognitive_domains=domains,
                theta=round(theta, 2),
                sigma=round(sigma, 2),
                confidence=conf,
                current_level=current_lvl,
                recommended_level=rec_lvl,
                max_level=max_lvl,
                manual_override_level=manual_override,
                sessions_count=sessions_count,
                last_played_at=last_played,
                last_lowered_at=last_lowered,
                cooldown_active=cooldown_active,
            )
        )

    return GameAbilityOverviewResponse(
        patient_id=patient_id,
        controller_type="statistical_controller",
        description=(
            "Bayesian psychometric ability controller targeting the 75-80% challenge zone. "
            "Latent capability (θ) and uncertainty (σ) update continuously using Kalman-Bayesian integration."
        ),
        target_accuracy_band="75% - 80%",
        abilities=items,
    )


@router.put(
    "/patient/{patient_id}/ability-override",
    response_model=GameAbilityItem,
    summary="Set or clear caregiver manual difficulty override for a game",
)
def set_patient_ability_override(
    patient_id: UUID,
    data: GameOverrideRequest,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """
    Sets a manual difficulty level override for a specific game, or clears it (None)
    to resume automatic statistical controller recommendations.
    """
    if current_user.role not in (UserRole.CARETAKER, UserRole.DOCTOR, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only caregivers or clinicians can configure difficulty overrides",
        )
    verify_patient_access(db, current_user, patient_id)

    raw_gid = data.game_id
    gid = normalize_game_id(raw_gid)
    max_lvl = get_max_level_for_game(gid)

    if data.override_level is not None:
        if data.override_level < 1 or data.override_level > max_lvl:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Override level must be between 1 and {max_lvl}",
            )

    ability = db.scalars(
        select(PatientGameAbility).where(
            PatientGameAbility.patient_id == patient_id,
            PatientGameAbility.game_id.in_([gid, raw_gid, gid.replace("_", "-")]),
        )
    ).first()

    now = datetime.now(timezone.utc)

    if ability is None:
        ability = PatientGameAbility(
            patient_id=patient_id,
            game_id=gid,
            theta=float(data.override_level or 1),
            sigma=1.50,
            last_level_played=data.override_level or 1,
            manual_override_level=data.override_level,
            last_recommended_level=data.override_level,
            sessions_count=0,
        )
        db.add(ability)
    else:
        ability.manual_override_level = data.override_level
        if data.override_level is not None:
            ability.last_recommended_level = data.override_level
        ability.updated_at = now

    db.commit()
    db.refresh(ability)

    # Invalidate assessment cache to reflect new override
    engine.invalidate_assessment_cache(patient_id)

    # Confidence rating
    if ability.sigma <= 0.60 and ability.sessions_count >= 4:
        conf = "high"
    elif ability.sigma <= 1.05 and ability.sessions_count >= 2:
        conf = "medium"
    else:
        conf = "low"

    cooldown_active = False
    if ability.last_lowered_at:
        dt_lowered = ability.last_lowered_at if ability.last_lowered_at.tzinfo else ability.last_lowered_at.replace(tzinfo=timezone.utc)
        if (now - dt_lowered).total_seconds() < (COOLDOWN_MINUTES * 60.0):
            cooldown_active = True

    domains = GAME_TO_DOMAINS.get(gid) or []
    game_types = get_available_game_types()
    game_name_map = {g.id: g.name for g in game_types}
    name = game_name_map.get(gid) or gid.replace("_", " ").title()

    rec_lvl = ability.manual_override_level or ability.last_recommended_level or max(1, min(max_lvl, int(round(ability.theta))))

    return GameAbilityItem(
        game_id=gid,
        game_name=name,
        cognitive_domains=domains,
        theta=round(ability.theta, 2),
        sigma=round(ability.sigma, 2),
        confidence=conf,
        current_level=ability.last_level_played or 1,
        recommended_level=rec_lvl,
        max_level=max_lvl,
        manual_override_level=ability.manual_override_level,
        sessions_count=ability.sessions_count,
        last_played_at=ability.updated_at,
        last_lowered_at=ability.last_lowered_at,
        cooldown_active=cooldown_active,
    )


