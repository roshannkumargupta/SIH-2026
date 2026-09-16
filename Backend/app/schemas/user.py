from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import UserRole


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    role: UserRole
    phone: str | None = None
    avatar_url: str | None = None
    preferred_language: str = "en-IN"
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    preferred_language: str | None = None