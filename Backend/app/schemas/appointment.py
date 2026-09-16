from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    patient_id: UUID
    title: str = Field(..., min_length=2, max_length=255)
    doctor_name: str | None = Field(default=None, max_length=150)
    location: str | None = Field(default=None, max_length=255)
    appointment_datetime: datetime
    notes: str | None = None
    reminder_lead_minutes: int = Field(default=60, ge=10, le=1440)


class AppointmentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    doctor_name: str | None = Field(default=None, max_length=150)
    location: str | None = Field(default=None, max_length=255)
    appointment_datetime: datetime | None = None
    notes: str | None = None
    status: AppointmentStatus | None = None
    reminder_lead_minutes: int | None = Field(default=None, ge=10, le=1440)


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentResponse(BaseModel):
    id: UUID
    patient_id: UUID
    created_by: UUID
    title: str
    doctor_name: str | None
    location: str | None
    appointment_datetime: datetime
    notes: str | None
    status: AppointmentStatus
    reminder_lead_minutes: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
