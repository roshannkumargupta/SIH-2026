import json
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class CognitiveAssessmentResponse(BaseModel):
    id: UUID
    patient_id: UUID
    overall_score: float
    risk_level: str
    memory_score: float
    attention_score: float
    executive_function_score: float
    language_score: float
    insights: list[str]
    recommendations: list[str]
    model_version: str
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


class CognitiveTrendPoint(BaseModel):
    date: str
    overall_score: float
    risk_level: str
    memory_score: float
    attention_score: float
    executive_function_score: float
    language_score: float


class CognitiveTrendResponse(BaseModel):
    patient_id: UUID
    trends: list[CognitiveTrendPoint]
    average_score: float
    trend_direction: str  # "improving", "stable", "declining"
