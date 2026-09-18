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

    # Real-time WebSocket delivery hook to caregiver dashboard (non-blocking)
    try:
        from app.core.websocket import broadcast_notification_to_caregivers
        type_str = notification.type.value if hasattr(notification.type, "value") else str(notification.type)
        is_high = (
            notification.type in [NotificationType.MOOD_ALERT, NotificationType.MEDICATION]
            or any(k in notification.title.lower() for k in ["missed", "distress", "fatigue", "alert", "urgent"])
        )
        notif_dict = {
            "id": str(notification.id),
            "patient_id": str(notification.patient_id),
            "type": type_str,
            "title": notification.title,
            "message": notification.message,
            "scheduled_for": notification.scheduled_for.isoformat() if notification.scheduled_for else None,
            "status": notification.status.value if hasattr(notification.status, "value") else str(notification.status),
            "priority": "HIGH" if is_high else "NORMAL",
            "related_entity_id": str(notification.related_entity_id) if notification.related_entity_id else None,
        }
        broadcast_notification_to_caregivers(notif_dict, notification.patient_id, db=db)
    except Exception:
        pass

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