import json
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class AdherenceResponse(BaseModel):
    """Medication and task adherence rates — always separate from cognitive scores."""
    medication_rate: float | None = None
    task_rate: float | None = None


class CognitiveAssessmentResponse(BaseModel):
    id: UUID
    patient_id: UUID
    overall_score: float | None = None
    risk_level: str
    memory_score: float | None = None
    attention_score: float | None = None
    executive_function_score: float | None = None
    language_score: float | None = None
    visuospatial_score: float | None = None
    insights: list[str]
    recommendations: list[str]
    adherence: AdherenceResponse | None = None
    model_version: str
    method_description: str | None = None
    assessment_date: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("insights", "recommendations", mode="before")
    @classmethod
    def parse_json_list(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(x) for x in parsed]
            except Exception:
                return []
        if isinstance(v, list):
            return [str(x) for x in v]
        return []

    @field_validator("adherence", mode="before")
    @classmethod
    def build_adherence(cls, v: Any) -> AdherenceResponse | None:
        if isinstance(v, AdherenceResponse):
            return v
        if isinstance(v, dict):
            return AdherenceResponse(**v)
        return None


class DomainTrendSlope(BaseModel):
    """Per-domain 7-day and 30-day linear regression slopes."""
    slope_7d: float | None = None
    slope_30d: float | None = None
    declining: bool = False
    days_declining: int = 0


class CognitiveTrendPoint(BaseModel):
    date: str
    overall_score: float | None = None
    risk_level: str
    memory_score: float | None = None
    attention_score: float | None = None
    executive_function_score: float | None = None
    language_score: float | None = None
    visuospatial_score: float | None = None


class CognitiveTrendResponse(BaseModel):
    patient_id: UUID
    trends: list[CognitiveTrendPoint]
    average_score: float | None = None
    trend_direction: str  # "improving", "stable", "declining", "insufficient_data"
    domain_slopes: dict[str, DomainTrendSlope] | None = None
    decline_alert_active: bool = False
    decline_domains: list[str] | None = None
