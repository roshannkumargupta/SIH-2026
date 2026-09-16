from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.medication import MedicationFrequency, MedicationLogStatus
from app.models.task import TaskPriority, TaskRecurrence, TaskStatus
from app.schemas.patient import PatientProfileResponse
from app.schemas.user import UserResponse


class InitialTaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    scheduled_time: str = "09:00"
    priority: TaskPriority = TaskPriority.NORMAL
    recurrence: TaskRecurrence = TaskRecurrence.DAILY


class InitialMedicationCreate(BaseModel):
    medicine_name: str = Field(min_length=1, max_length=150)
    dosage: str = Field(min_length=1, max_length=100)
    scheduled_time: str = "08:00"
    instructions: str | None = None
    frequency: MedicationFrequency = MedicationFrequency.DAILY


class CaretakerCreateMedicationRequest(BaseModel):
    medicine_name: str = Field(min_length=1, max_length=150)
    dosage: str = Field(min_length=1, max_length=100)
    scheduled_time: str = "08:00"
    instructions: str | None = None
    frequency: MedicationFrequency = MedicationFrequency.DAILY


class CaretakerCreateTaskRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    scheduled_time: str = "09:00"
    priority: TaskPriority = TaskPriority.NORMAL
    recurrence: TaskRecurrence = TaskRecurrence.DAILY


class CaretakerAddPatientRequest(BaseModel):
    # Required identifier
    email: str = Field(min_length=3, max_length=255)

    # Required for new patient creation (Case A), optional for existing patient connection (Case B)
    password: str | None = Field(default=None, min_length=4, max_length=128)

    # Demographics & Patient Information
    name: str = Field(default="Patient", min_length=1, max_length=150)
    age: int | str | None = None
    date_of_birth: date | None = None
    gender: str | None = "Female"
    phone: str | None = None
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    doctor_name: str | None = None
    preferred_language: str = "Hindi"
    relationship_type: str | None = "caregiver"

    # Optional initial tasks and medications
    initial_tasks: list[InitialTaskCreate] = []
    initial_medications: list[InitialMedicationCreate] = []


class CaretakerAddPatientResponse(BaseModel):
    success: bool
    is_new_patient: bool
    message: str
    patient: UserResponse
    profile: PatientProfileResponse | None = None
    relationship_id: UUID


class CaretakerPatientDetailResponse(BaseModel):
    patient: UserResponse
    profile: PatientProfileResponse | None = None
    relationship_type: str | None = None
    active: bool = True
    connected_since: datetime


class CaretakerTaskItem(BaseModel):
    id: UUID
    title: str
    description: str | None
    scheduled_time: str
    priority: TaskPriority
    status: TaskStatus
    completed_at: datetime | None = None


class CaretakerMedicationItem(BaseModel):
    id: UUID
    medicine_name: str
    dosage: str
    scheduled_time: str
    status: str
    taken_at: datetime | None = None
    instructions: str | None = None


class CaretakerGameSessionItem(BaseModel):
    id: UUID
    game_name: str
    game_id: str
    score: int
    accuracy: float
    duration_seconds: int
    level_achieved: int
    difficulty: str
    completed_at: datetime


class CaretakerPatientAnalyticsResponse(BaseModel):
    patient_id: UUID

    # Overall Cognitive Summary
    overall_score: float
    risk_level: str
    trend: str
    cognitive_scores: dict[str, float]  # memory, attention, executive, language
    insights: list[str] = []
    recommendations: list[str] = []

    # Task Analytics (Calculated from real DB records)
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    missed_tasks: int
    task_completion_rate: float  # 0.0 - 100.0%

    # Medication Analytics (Calculated from real DB records)
    total_medications_scheduled: int
    medications_taken: int
    medications_pending: int
    medications_missed: int
    medication_adherence_rate: float  # 0.0 - 100.0%

    # Game Analytics (Calculated from real DB records)
    total_games_played: int
    average_game_score: float
    average_game_accuracy: float
    best_game_score: int
    total_game_duration_seconds: int
    games_played: list[str] = []
    recent_game_sessions: list[CaretakerGameSessionItem] = []

    # Historical Daily Scores for Trends Chart
    daily_scores: list[dict[str, Any]] = []
