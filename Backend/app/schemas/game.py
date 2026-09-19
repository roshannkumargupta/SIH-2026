import json
from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class GameSessionCreate(BaseModel):
    patient_id: UUID | None = None
    game_type: str = Field(min_length=1, max_length=50)
    game_id: str = Field(min_length=1, max_length=100)
    score: int = Field(ge=0)
    accuracy: float = Field(ge=0.0, le=100.0)
    duration_seconds: int = Field(ge=0)
    difficulty: str = Field(default="medium", max_length=20)
    level_achieved: int = Field(default=1, ge=1)
    metrics: dict[str, Any] | None = None
    completed_at: datetime | None = None

    @field_validator("metrics", mode="before")
    @classmethod
    def parse_metrics_input(cls, v: Any) -> dict[str, Any] | None:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return None
        return v


class GameSessionResponse(BaseModel):
    id: UUID
    patient_id: UUID
    game_type: str
    game_id: str
    score: int
    accuracy: float
    duration_seconds: int
    difficulty: str
    level_achieved: int
    next_level_unlocked: int = 1
    metrics: dict[str, Any] | None = None
    completed_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("metrics", mode="before")
    @classmethod
    def parse_metrics_json(cls, v: Any) -> dict[str, Any] | None:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return None
        return v


class GameSummaryResponse(BaseModel):
    total_sessions: int
    average_score: float
    average_accuracy: float
    total_duration_seconds: int
    games_played: list[str]
    recent_sessions: list[GameSessionResponse]


class SingleGameProgress(BaseModel):
    game_id: str
    highest_level_won: int
    current_unlocked_level: int
    best_score: int
    total_played: int
    last_played: datetime | None = None


class GameProgressResponse(BaseModel):
    patient_id: UUID
    games: dict[str, SingleGameProgress]


class GameTypeInfo(BaseModel):
    id: str
    name: str
    cognitive_domain: str
    description: str
    difficulties: list[str]


class AdaptiveLevelResponse(BaseModel):
    recommended_level: int
    confidence: str
    rationale: str
    based_on_sessions: int
    ai_difficulty_enabled: bool = True
    model_type: Literal["heuristic", "ml", "statistical_controller"] = "statistical_controller"
    theta: float | None = None
    sigma: float | None = None
    manual_override_level: int | None = None
    cooldown_active: bool = False
    last_lowered_at: datetime | None = None


class GameAbilityItem(BaseModel):
    game_id: str
    game_name: str
    cognitive_domains: list[str]
    theta: float
    sigma: float
    confidence: str
    current_level: int
    recommended_level: int
    max_level: int
    manual_override_level: int | None = None
    sessions_count: int
    last_played_at: datetime | None = None
    last_lowered_at: datetime | None = None
    cooldown_active: bool = False


class GameAbilityOverviewResponse(BaseModel):
    patient_id: UUID
    controller_type: str = "statistical_controller"
    description: str
    target_accuracy_band: str = "75% - 80%"
    abilities: list[GameAbilityItem]


class GameOverrideRequest(BaseModel):
    game_id: str
    override_level: int | None = None  # None resets to automatic AI recommendation


