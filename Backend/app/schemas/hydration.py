from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.hydration import HydrationSource


class HydrationLogCreate(BaseModel):
    amount_ml: int = Field(default=250, ge=50, le=2000, description="Amount of water in milliliters")
    source: HydrationSource = Field(default=HydrationSource.MANUAL)
    patient_id: UUID | None = Field(default=None, description="Target patient ID (if caregiver logging)")


class HydrationLogResponse(BaseModel):
    id: UUID
    patient_id: UUID
    amount_ml: int
    logged_at: datetime
    source: HydrationSource
    created_at: datetime

    class Config:
        from_attributes = True


class DailyHydrationGoalUpdate(BaseModel):
    goal_ml: int = Field(default=1500, ge=500, le=5000, description="Daily target in ml")


class DailyHydrationGoalResponse(BaseModel):
    id: UUID
    patient_id: UUID
    goal_ml: int
    updated_at: datetime

    class Config:
        from_attributes = True


class HydrationTodaySummary(BaseModel):
    patient_id: UUID
    total_ml: int
    goal_ml: int
    percent: int
    logs: list[HydrationLogResponse]
