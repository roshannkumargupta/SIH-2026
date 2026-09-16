from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.hydration import HydrationSource
from app.models.medication import MedicationLogStatus
from app.models.mood_checkin import MoodType
from app.models.task import TaskStatus


class SyncGameEvent(BaseModel):
    client_event_id: str = Field(description="Unique client-side event ID for idempotency")
    game_type: str
    game_id: str
    score: int
    accuracy: float
    duration_seconds: int
    difficulty: str = "medium"
    completed_at: datetime


class SyncMedicationEvent(BaseModel):
    client_event_id: str
    log_id: UUID | None = None
    schedule_id: UUID | None = None
    status: MedicationLogStatus
    taken_at: datetime | None = None


class SyncTaskEvent(BaseModel):
    client_event_id: str
    task_id: UUID
    status: TaskStatus
    completed_at: datetime | None = None


class SyncMemoryEvent(BaseModel):
    client_event_id: str
    memory_id: UUID | None = None
    title: str
    category: str = "Family"
    description: str
    date_or_era: str | None = None
    image_url: str | None = None
    created_at: datetime | None = None


class SyncVoiceEvent(BaseModel):
    client_event_id: str
    transcript: str
    action_taken: str | None = None
    timestamp: datetime | None = None


class SyncHydrationEvent(BaseModel):
    client_event_id: str = Field(description="Client event ID for idempotency")
    amount_ml: int = 250
    source: HydrationSource = HydrationSource.MANUAL
    logged_at: datetime | None = None


class SyncMoodEvent(BaseModel):
    client_event_id: str = Field(description="Client event ID for idempotency")
    mood: MoodType
    note: str | None = None
    created_at: datetime | None = None


class SyncBatchRequest(BaseModel):
    patient_id: UUID | None = None
    last_synced_at: datetime | None = None
    game_events: list[SyncGameEvent] = Field(default_factory=list)
    medication_events: list[SyncMedicationEvent] = Field(default_factory=list)
    task_events: list[SyncTaskEvent] = Field(default_factory=list)
    memory_events: list[SyncMemoryEvent] = Field(default_factory=list)
    voice_events: list[SyncVoiceEvent] = Field(default_factory=list)
    hydration_events: list[SyncHydrationEvent] = Field(default_factory=list)
    mood_events: list[SyncMoodEvent] = Field(default_factory=list)


class SyncBatchResponse(BaseModel):
    success: bool
    synced_games: int
    synced_medications: int
    synced_tasks: int
    synced_memories: int = 0
    synced_voice_logs: int = 0
    synced_hydration: int = 0
    synced_moods: int = 0
    conflicts: list[str] = Field(default_factory=list)
    server_timestamp: datetime

