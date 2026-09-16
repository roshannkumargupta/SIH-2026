from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import (
    DBSession,
    get_current_user,
)
from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.models.patient import PatientProfile
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserProfileUpdate, UserResponse
from app.schemas.patient import PatientProfileCreate
from app.services.auth_service import (
    authenticate_user,
    register_user,
)
from app.services.patient_service import create_patient_profile


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: DBSession,
):
    try:
        # Create the user
        user = register_user(
            db,
            data,
        )

        # Automatically create a patient profile
        # for newly registered patient users.
        if user.role == UserRole.PATIENT:
            create_patient_profile(
                db,
                user,
                PatientProfileCreate(),
            )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )

    token = create_access_token(user.id)

    return AuthResponse(
        user=user,
        token=TokenResponse(
            access_token=token,
        ),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
)
def login(
    data: LoginRequest,
    db: DBSession,
):
    user = authenticate_user(
        db,
        data.email,
        data.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)

    return AuthResponse(
        user=user,
        token=TokenResponse(
            access_token=token,
        ),
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.put(
    "/profile",
    response_model=UserResponse,
    summary="Update current authenticated user's profile",
)
def update_profile(
    data: UserProfileUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    user = db.get(User, current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.name is not None and data.name.strip():
        user.name = data.name.strip()
    if data.phone is not None:
        user.phone = data.phone.strip() if data.phone.strip() else None
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    if data.preferred_language is not None and data.preferred_language.strip():
        user.preferred_language = data.preferred_language.strip()
        # Also sync patient_profile if exists
        profile = db.query(PatientProfile).filter(PatientProfile.user_id == user.id).first()
        if profile:
            profile.preferred_language = user.preferred_language

    db.commit()
    db.refresh(user)
    return user