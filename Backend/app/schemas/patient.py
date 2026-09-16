from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PatientProfileCreate(BaseModel):
    date_of_birth: date | None = None

    emergency_contact_name: str | None = Field(
        default=None,
        max_length=150,
    )

    emergency_contact_phone: str | None = Field(
        default=None,
        max_length=20,
    )

    preferred_language: str = Field(
        default="en",
        max_length=20,
    )

    gender: str | None = Field(
        default=None,
        max_length=20,
    )

    address: str | None = Field(
        default=None,
        max_length=255,
    )

    doctor_name: str | None = Field(
        default=None,
        max_length=150,
    )

    timezone: str = Field(
        default="Asia/Kolkata",
        max_length=50,
    )


class PatientProfileUpdate(BaseModel):
    date_of_birth: date | None = None

    emergency_contact_name: str | None = Field(
        default=None,
        max_length=150,
    )

    emergency_contact_phone: str | None = Field(
        default=None,
        max_length=20,
    )

    preferred_language: str | None = Field(
        default=None,
        max_length=20,
    )

    gender: str | None = Field(
        default=None,
        max_length=20,
    )

    address: str | None = Field(
        default=None,
        max_length=255,
    )

    doctor_name: str | None = Field(
        default=None,
        max_length=150,
    )

    timezone: str | None = Field(
        default=None,
        max_length=50,
    )


class PatientProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    date_of_birth: date | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    preferred_language: str
    gender: str | None = None
    address: str | None = None
    doctor_name: str | None = None
    timezone: str

    model_config = ConfigDict(from_attributes=True)


class PatientCalibrationCreate(BaseModel):
    total_score: int = Field(ge=0, le=20)
    initial_difficulty: str = Field(default="medium", max_length=20)
    note: str | None = Field(default=None, max_length=255)
    answers: list[dict[str, Any]] | None = None
    ai_difficulty_enabled: bool = True


class PatientCalibrationResponse(BaseModel):
    id: UUID
    patient_id: UUID
    total_score: int
    initial_difficulty: str
    note: str | None = None
    answers: list[dict[str, Any]] | None = None
    ai_difficulty_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("answers", mode="before")
    @classmethod
    def parse_answers_json(cls, v: Any) -> list[dict[str, Any]] | None:
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except Exception:
                return None
        return v


class AIDifficultyToggleRequest(BaseModel):
    enabled: bool