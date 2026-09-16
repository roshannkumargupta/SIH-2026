from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import (
    DBSession,
    get_current_user,
)
from app.models.user import User, UserRole
from app.schemas.notification import NotificationResponse
from app.services.notification_service import (
    get_notification,
    get_patient_notifications,
    mark_notification_read,
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


def verify_notification_access(
    notification,
    current_user: User,
):
    if current_user.role == UserRole.ADMIN:
        return

    if current_user.role == UserRole.PATIENT:
        if notification.patient_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own notifications",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access notifications",
    )


@router.get(
    "",
    response_model=list[NotificationResponse],
)
def list_notifications(
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access their notifications",
        )

    return get_patient_notifications(
        db,
        current_user.id,
    )


@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def read_notification(
    notification_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    notification = get_notification(
        db,
        notification_id,
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    verify_notification_access(
        notification,
        current_user,
    )

    return mark_notification_read(
        db,
        notification,
    )