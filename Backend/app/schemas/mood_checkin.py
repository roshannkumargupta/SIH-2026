from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.mood_checkin import MoodType


class MoodCheckinCreate(BaseModel):
    mood: MoodType = Field(..., description="Self-reported mood state (happy, calm, confused, anxious)")
    note: str | None = Field(default=None, max_length=1000, description="Optional personal note or feeling")
    patient_id: UUID | None = Field(default=None, description="Target patient ID if logged on behalf")


class MoodCheckinResponse(BaseModel):
    id: UUID
    patient_id: UUID
    mood: MoodType
    note: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MoodTrendResponse(BaseModel):
    patient_id: UUID
    total_checkins: int
    days_evaluated: int
    mood_counts: dict[str, int]
    distress_flagged: bool
    distress_reason: str | None = None
    recent_checkins: list[MoodCheckinResponse]

    model_config = ConfigDict(from_attributes=True)
