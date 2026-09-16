from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.mood_checkin import MoodCheckin, MoodType
from app.models.notification import Notification, NotificationType
from app.schemas.mood_checkin import MoodTrendResponse, MoodCheckinResponse
from app.services.notification_service import create_notification

# Distress Detection Policy Constants
DISTRESS_MOODS: set[MoodType] = {MoodType.CONFUSED, MoodType.ANXIOUS}
WINDOW_CHECKIN_COUNT: int = 5
WINDOW_DISTRESS_THRESHOLD: int = 3
CONSECUTIVE_DISTRESS_THRESHOLD: int = 2
CONSECUTIVE_DISTRESS_WINDOW_HOURS: int = 24
ALERT_DEBOUNCE_HOURS: int = 12


def detect_persistent_distress(db: Session, patient_id: UUID) -> tuple[bool, str]:
    """
    Evaluate if patient has persistent distress.
    Criteria:
      1. CONFUSED or ANXIOUS in >= 3 of the last 5 check-ins, OR
      2. >= 2 consecutive such check-ins within 24 hours.
    Returns:
      (flagged: bool, reason: str)
    """
    # Fetch recent check-ins ordered from newest to oldest
    statement = (
        select(MoodCheckin)
        .where(MoodCheckin.patient_id == patient_id)
        .order_by(MoodCheckin.created_at.desc())
        .limit(WINDOW_CHECKIN_COUNT)
    )
    checkins = list(db.scalars(statement).all())

    if not checkins:
        return False, ""

    # Rule 2 check: >= 2 consecutive distress check-ins within 24 hours
    if len(checkins) >= CONSECUTIVE_DISTRESS_THRESHOLD:
        first = checkins[0]
        second = checkins[1]
        if first.mood in DISTRESS_MOODS and second.mood in DISTRESS_MOODS:
            time_diff = abs((first.created_at - second.created_at).total_seconds())
            if time_diff <= CONSECUTIVE_DISTRESS_WINDOW_HOURS * 3600:
                return (
                    True,
                    f"Consecutive distress self-reports ({first.mood.value} and {second.mood.value}) within 24 hours.",
                )

    # Rule 1 check: >= 3 distress check-ins in the last 5
    distress_count = sum(1 for c in checkins if c.mood in DISTRESS_MOODS)
    if distress_count >= WINDOW_DISTRESS_THRESHOLD:
        return (
            True,
            f"Reported distress in {distress_count} of the last {len(checkins)} check-ins.",
        )

    return False, ""


def log_mood(
    db: Session,
    patient_id: UUID,
    mood: MoodType,
    note: str | None = None,
) -> MoodCheckin:
    """
    Record a new mood check-in. If persistent distress is detected,
    creates a caregiver alert notification (debounced by 12 hours).
    """
    checkin = MoodCheckin(
        patient_id=patient_id,
        mood=mood,
        note=note,
        created_at=datetime.now(timezone.utc),
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)

    # Evaluate distress triggers
    is_distressed, reason = detect_persistent_distress(db, patient_id)
    if is_distressed:
        # Check debounce: avoid duplicate alert within 12 hours
        debounce_cutoff = datetime.now(timezone.utc) - timedelta(hours=ALERT_DEBOUNCE_HOURS)
        existing_alert = db.scalar(
            select(Notification).where(
                Notification.patient_id == patient_id,
                Notification.type == NotificationType.MOOD_ALERT,
                Notification.created_at >= debounce_cutoff,
            )
        )
        if not existing_alert:
            create_notification(
                db=db,
                patient_id=patient_id,
                notification_type=NotificationType.MOOD_ALERT,
                title="Well-being Alert: Distress Pattern Detected",
                message=f"Notice: {reason} It may help to check in, call, or visit.",
                scheduled_for=datetime.now(timezone.utc),
                related_entity_id=checkin.id,
            )

    return checkin


def get_recent_moods(
    db: Session,
    patient_id: UUID,
    days: int = 7,
) -> list[MoodCheckin]:
    """Retrieve mood check-ins for patient over the last N days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    statement = (
        select(MoodCheckin)
        .where(
            MoodCheckin.patient_id == patient_id,
            MoodCheckin.created_at >= cutoff,
        )
        .order_by(MoodCheckin.created_at.desc())
    )
    return list(db.scalars(statement).all())


def get_mood_trend(
    db: Session,
    patient_id: UUID,
    days: int = 7,
) -> MoodTrendResponse:
    """Summarize mood distributions, recent items, and distress status."""
    checkins = get_recent_moods(db, patient_id, days=days)

    counts = {
        MoodType.HAPPY.value: 0,
        MoodType.CALM.value: 0,
        MoodType.CONFUSED.value: 0,
        MoodType.ANXIOUS.value: 0,
    }
    for c in checkins:
        counts[c.mood.value] = counts.get(c.mood.value, 0) + 1

    distress_flagged, distress_reason = detect_persistent_distress(db, patient_id)

    return MoodTrendResponse(
        patient_id=patient_id,
        total_checkins=len(checkins),
        days_evaluated=days,
        mood_counts=counts,
        distress_flagged=distress_flagged,
        distress_reason=distress_reason if distress_flagged else None,
        recent_checkins=[MoodCheckinResponse.model_validate(c) for c in checkins],
    )
