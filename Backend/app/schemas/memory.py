from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class MemoryCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    category: str = Field(default="Family", max_length=50)
    description: str = Field(default="")
    date_or_era: str | None = None
    image_url: str | None = None
    voice_prompt: str | None = None


class MemoryUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    description: str | None = None
    date_or_era: str | None = None
    image_url: str | None = None
    voice_prompt: str | None = None


class MemoryResponse(BaseModel):
    id: UUID
    patient_id: UUID
    title: str
    category: str
    description: str
    date_or_era: str | None = None
    image_url: str | None = None
    voice_prompt: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
