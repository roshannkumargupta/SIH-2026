from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification import (
    Notification,
    NotificationStatus,
    NotificationType,
)


def create_notification(
    db: Session,
    patient_id: UUID,
    notification_type: NotificationType,
    title: str,
    message: str,
    scheduled_for: datetime,
    related_entity_id: UUID | None = None,
) -> Notification:

    notification = Notification(
        patient_id=patient_id,
        type=notification_type,
        title=title,
        message=message,
        scheduled_for=scheduled_for,
        status=NotificationStatus.PENDING,
        related_entity_id=related_entity_id,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


def get_notification(
    db: Session,
    notification_id: UUID,
) -> Notification | None:

    return db.get(
        Notification,
        notification_id,
    )


def get_patient_notifications(
    db: Session,
    patient_id: UUID,
) -> list[Notification]:

    statement = (
        select(Notification)
        .where(
            Notification.patient_id == patient_id,
        )
        .order_by(
            Notification.scheduled_for.desc()
        )
    )

    return list(
        db.scalars(statement).all()
    )


def mark_notification_read(
    db: Session,
    notification: Notification,
) -> Notification:

    notification.status = NotificationStatus.READ

    db.commit()
    db.refresh(notification)

    return notification