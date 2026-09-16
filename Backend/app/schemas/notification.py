from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.notification import (
    NotificationStatus,
    NotificationType,
)


class NotificationResponse(BaseModel):
    id: UUID
    patient_id: UUID

    type: NotificationType

    title: str
    message: str

    scheduled_for: datetime
    sent_at: datetime | None = None

    status: NotificationStatus

    related_entity_id: UUID | None = None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )