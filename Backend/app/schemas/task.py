from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.task import (
    TaskPriority,
    TaskRecurrence,
    TaskStatus,
)


class TaskCreate(BaseModel):
    patient_id: UUID

    title: str
    description: str | None = None

    scheduled_time: time

    priority: TaskPriority = TaskPriority.NORMAL
    recurrence: TaskRecurrence = TaskRecurrence.DAILY

    days_of_week: str | None = None

    start_date: date
    end_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None

    scheduled_time: time | None = None

    priority: TaskPriority | None = None
    recurrence: TaskRecurrence | None = None

    days_of_week: str | None = None

    start_date: date | None = None
    end_date: date | None = None

    status: TaskStatus | None = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    created_by: UUID

    title: str
    description: str | None

    scheduled_time: time

    priority: TaskPriority
    recurrence: TaskRecurrence

    days_of_week: str | None

    start_date: date
    end_date: date | None

    status: TaskStatus
    completed_at: datetime | None

    created_at: datetime
    updated_at: datetime