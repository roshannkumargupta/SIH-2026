from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole


security_scheme = HTTPBearer()


DBSession = Annotated[
    Session,
    Depends(get_db),
]


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials,
        Depends(security_scheme),
    ],
    db: DBSession,
) -> User:

    try:
        user_id = decode_access_token(
            credentials.credentials
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )

    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


security_scheme_optional = HTTPBearer(auto_error=False)


def get_current_user_optional(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(security_scheme_optional),
    ],
    db: DBSession,
) -> User | None:
    if not credentials:
        return None
    try:
        user_id = decode_access_token(credentials.credentials)
        user = db.get(User, user_id)
        if user and user.is_active:
            return user
    except Exception:
        pass
    return None


def require_role(*allowed_roles: UserRole) -> Callable:
    def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )

        return current_user

    return role_checker


def require_patient(
    current_user: User = Depends(
        require_role(UserRole.PATIENT)
    ),
) -> User:
    return current_user


def require_doctor(
    current_user: User = Depends(
        require_role(UserRole.DOCTOR)
    ),
) -> User:
    return current_user


def require_caretaker(
    current_user: User = Depends(
        require_role(UserRole.CARETAKER)
    ),
) -> User:
    return current_user


def require_admin(
    current_user: User = Depends(
        require_role(UserRole.ADMIN)
    ),
) -> User:
    return current_user