from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.medication import MedicationFrequency, MedicationLogStatus


class MedicationScheduleCreate(BaseModel):
    prescription_id: UUID
    patient_id: UUID
    medicine_name: str
    dosage: str
    scheduled_time: time
    frequency: MedicationFrequency = MedicationFrequency.DAILY
    days_of_week: str | None = None
    start_date: date
    end_date: date | None = None
    reminder_enabled: bool = True


class MedicationScheduleUpdate(BaseModel):
    medicine_name: str | None = None
    dosage: str | None = None
    scheduled_time: time | None = None
    frequency: MedicationFrequency | None = None
    days_of_week: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    active: bool | None = None
    reminder_enabled: bool | None = None


class MedicationScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    prescription_id: UUID
    patient_id: UUID
    medicine_name: str
    dosage: str
    scheduled_time: time
    frequency: MedicationFrequency
    days_of_week: str | None
    start_date: date
    end_date: date | None
    active: bool
    reminder_enabled: bool
    created_at: datetime
    updated_at: datetime


class MedicationActionRequest(BaseModel):
    status: MedicationLogStatus


class MedicationLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    schedule_id: UUID
    patient_id: UUID
    scheduled_at: datetime
    taken_at: datetime | None
    status: MedicationLogStatus
    notes: str | None
    created_at: datetime