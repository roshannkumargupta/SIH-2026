from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.auth import RegisterRequest


def register_user(
    db: Session,
    data: RegisterRequest,
) -> User:
    # Check whether the email is already registered
    existing_user = db.scalar(
        select(User).where(User.email == data.email)
    )

    if existing_user:
        raise ValueError("Email is already registered")

    # Create the user
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        phone=data.phone,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    # Find user by email
    user = db.scalar(
        select(User).where(User.email == email)
    )

    # User doesn't exist
    if not user:
        return None

    # Check password
    if not verify_password(
        password,
        user.password_hash,
    ):
        return None

    # Don't allow inactive users to log in
    if not user.is_active:
        return None

    return user