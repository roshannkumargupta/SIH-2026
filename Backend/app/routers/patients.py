import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import (
    DBSession,
    get_current_user,
    require_admin,
    require_patient,
)
from app.models.patient import PatientCalibration
from app.models.user import User, UserRole
from app.schemas.patient import (
    AIDifficultyToggleRequest,
    PatientCalibrationCreate,
    PatientCalibrationResponse,
    PatientProfileCreate,
    PatientProfileResponse,
    PatientProfileUpdate,
)
from app.schemas.user import UserResponse
from app.services.patient_service import (
    create_patient_profile,
    get_patient_profile,
    update_patient_profile,
)
from app.services.relationship_service import (
    caretaker_has_patient_access,
    doctor_has_patient_access,
)


router = APIRouter(
    prefix="/patients",
    tags=["Patients"],
)


@router.post(
    "/me/profile",
    response_model=PatientProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_my_profile(
    data: PatientProfileCreate,
    db: DBSession,
    current_user: User = Depends(require_patient),
):
    try:
        profile = create_patient_profile(
            db,
            current_user,
            data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return profile


@router.get(
    "/me/profile",
    response_model=PatientProfileResponse,
)
def get_my_profile(
    db: DBSession,
    current_user: User = Depends(require_patient),
):
    profile = get_patient_profile(
        db,
        current_user.id,
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found",
        )

    return profile


@router.put(
    "/me/profile",
    response_model=PatientProfileResponse,
)
def update_my_profile(
    data: PatientProfileUpdate,
    db: DBSession,
    current_user: User = Depends(require_patient),
):
    profile = get_patient_profile(
        db,
        current_user.id,
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found",
        )

    return update_patient_profile(
        db,
        profile,
        data,
    )


@router.get(
    "/me/doctors",
    response_model=list[UserResponse],
)
def get_my_doctors(
    db: DBSession,
    current_user: User = Depends(require_patient),
):
    """List all doctors assigned to the current patient."""
    from sqlalchemy import select
    from app.models.relationship import DoctorPatient

    doctors = db.scalars(
        select(User)
        .join(DoctorPatient, DoctorPatient.doctor_id == User.id)
        .where(
            DoctorPatient.patient_id == current_user.id,
            DoctorPatient.active.is_(True),
            User.role == UserRole.DOCTOR,
            User.is_active.is_(True),
        )
    ).all()

    return list(doctors)


@router.get(
    "/me/caregivers",
    response_model=list[UserResponse],
)
def get_my_caregivers(
    db: DBSession,
    current_user: User = Depends(require_patient),
):
    """List all caregivers assigned to the current patient."""
    from sqlalchemy import select
    from app.models.relationship import CaretakerPatient

    caregivers = db.scalars(
        select(User)
        .join(CaretakerPatient, CaretakerPatient.caretaker_id == User.id)
        .where(
            CaretakerPatient.patient_id == current_user.id,
            CaretakerPatient.active.is_(True),
            User.role == UserRole.CARETAKER,
            User.is_active.is_(True),
        )
    ).all()

    return list(caregivers)


@router.get(
    "/{patient_id}/profile",
    response_model=PatientProfileResponse,
)
def get_patient_profile_by_id(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.ADMIN:
        pass

    elif current_user.role == UserRole.PATIENT:
        if current_user.id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own profile",
            )

    elif current_user.role == UserRole.DOCTOR:
        if not doctor_has_patient_access(
            db,
            current_user.id,
            patient_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Doctor is not assigned to this patient",
            )

    elif current_user.role == UserRole.CARETAKER:
        if not caretaker_has_patient_access(
            db,
            current_user.id,
            patient_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Caretaker is not assigned to this patient",
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access patient profiles",
        )

    profile = get_patient_profile(
        db,
        patient_id,
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found",
        )

    return profile


@router.get(
    "/{patient_id}/game-progress",
)
def get_patient_game_progress_by_id(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """Retrieve patient game level progression."""
    from app.services.game_service import get_patient_game_progress

    if current_user.role == UserRole.PATIENT and current_user.id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own game progress",
        )
    elif current_user.role == UserRole.CARETAKER:
        if not caretaker_has_patient_access(db, current_user.id, patient_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Caretaker is not assigned to this patient",
            )
    elif current_user.role == UserRole.DOCTOR:
        if not doctor_has_patient_access(db, current_user.id, patient_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Doctor is not assigned to this patient",
            )

    prog_dict = get_patient_game_progress(db, patient_id)
    return {
        "patient_id": patient_id,
        "games": prog_dict,
    }


def _verify_patient_access_internal(db, current_user: User, patient_id: UUID):
    if current_user.role == UserRole.ADMIN:
        return
    elif current_user.role == UserRole.PATIENT:
        if current_user.id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own profile",
            )
    elif current_user.role == UserRole.DOCTOR:
        if not doctor_has_patient_access(db, current_user.id, patient_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Doctor is not assigned to this patient",
            )
    elif current_user.role == UserRole.CARETAKER:
        if not caretaker_has_patient_access(db, current_user.id, patient_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Caretaker is not assigned to this patient",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access patient data",
        )


@router.post(
    "/{patient_id}/calibration",
    response_model=PatientCalibrationResponse,
    status_code=status.HTTP_200_OK,
    summary="Save patient difficulty baseline calibration",
)
def save_patient_calibration(
    patient_id: UUID,
    data: PatientCalibrationCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    _verify_patient_access_internal(db, current_user, patient_id)
    cal = db.scalars(
        select(PatientCalibration).where(PatientCalibration.patient_id == patient_id)
    ).first()

    answers_str = json.dumps(data.answers) if data.answers else None

    if not cal:
        cal = PatientCalibration(
            patient_id=patient_id,
            total_score=data.total_score,
            initial_difficulty=data.initial_difficulty,
            note=data.note,
            answers=answers_str,
            ai_difficulty_enabled=data.ai_difficulty_enabled,
        )
        db.add(cal)
    else:
        cal.total_score = data.total_score
        cal.initial_difficulty = data.initial_difficulty
        cal.note = data.note
        cal.answers = answers_str
        cal.ai_difficulty_enabled = data.ai_difficulty_enabled

    db.commit()
    db.refresh(cal)
    return cal


@router.get(
    "/{patient_id}/calibration",
    response_model=PatientCalibrationResponse,
    summary="Get patient difficulty baseline calibration",
)
def get_patient_calibration(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    _verify_patient_access_internal(db, current_user, patient_id)
    cal = db.scalars(
        select(PatientCalibration).where(PatientCalibration.patient_id == patient_id)
    ).first()

    if not cal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calibration not found for this patient",
        )
    return cal


@router.put(
    "/{patient_id}/ai-difficulty",
    response_model=PatientCalibrationResponse,
    summary="Toggle AI difficulty automatic adjustment preference",
)
def set_patient_ai_difficulty(
    patient_id: UUID,
    data: AIDifficultyToggleRequest,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    _verify_patient_access_internal(db, current_user, patient_id)
    cal = db.scalars(
        select(PatientCalibration).where(PatientCalibration.patient_id == patient_id)
    ).first()

    if not cal:
        cal = PatientCalibration(
            patient_id=patient_id,
            total_score=8,
            initial_difficulty="medium",
            ai_difficulty_enabled=data.enabled,
        )
        db.add(cal)
    else:
        cal.ai_difficulty_enabled = data.enabled

    db.commit()
    db.refresh(cal)
    return cal