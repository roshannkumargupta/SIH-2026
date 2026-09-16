from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.medication import (
    MedicationLog,
    MedicationSchedule,
)
from app.models.notification import NotificationType

from app.services.medication_service import (
    create_medication_log,
)
from app.services.notification_service import (
    create_notification,
)


def is_schedule_due_today(
    schedule: MedicationSchedule,
    target_date: date,
) -> bool:

    if not schedule.active:
        return False

    if target_date < schedule.start_date:
        return False

    if (
        schedule.end_date
        and target_date > schedule.end_date
    ):
        return False

    if schedule.frequency.value == "daily":
        return True

    if schedule.frequency.value in (
        "weekly",
        "custom",
    ):
        if not schedule.days_of_week:
            return False

        current_day = target_date.strftime(
            "%a"
        ).lower()

        days = [
            day.strip().lower()
            for day in schedule.days_of_week.split(",")
        ]

        return current_day in days

    return False


def get_due_schedules(
    db: Session,
    now: datetime,
) -> list[MedicationSchedule]:

    today = now.date()
    current_time = now.time()

    statement = (
        select(MedicationSchedule)
        .where(
            MedicationSchedule.active.is_(True),
            MedicationSchedule.reminder_enabled.is_(True),
            MedicationSchedule.start_date <= today,
            MedicationSchedule.scheduled_time <= current_time,
        )
    )

    schedules = list(
        db.scalars(statement).all()
    )

    return [
        schedule
        for schedule in schedules
        if is_schedule_due_today(
            schedule,
            today,
        )
    ]


def medication_log_exists(
    db: Session,
    schedule_id,
    scheduled_datetime,
) -> bool:

    statement = (
        select(MedicationLog)
        .where(
            MedicationLog.schedule_id
            == schedule_id,
            MedicationLog.scheduled_at
            == scheduled_datetime,
        )
    )

    return db.scalar(statement) is not None


def process_due_medications(
    db: Session,
    now: datetime | None = None,
) -> int:

    if now is None:
        now = datetime.now(timezone.utc)

    schedules = get_due_schedules(
        db,
        now,
    )

    processed_count = 0

    for schedule in schedules:

        scheduled_datetime = datetime.combine(
            now.date(),
            schedule.scheduled_time,
            tzinfo=timezone.utc,
        )

        if medication_log_exists(
            db,
            schedule.id,
            scheduled_datetime,
        ):
            continue

        log = create_medication_log(
            db,
            schedule,
            scheduled_datetime,
        )

        create_notification(
            db=db,
            patient_id=schedule.patient_id,
            notification_type=NotificationType.MEDICATION,
            title="Medication Reminder",
            message=(
                f"Please take "
                f"{schedule.medicine_name} "
                f"({schedule.dosage})."
            ),
            scheduled_for=scheduled_datetime,
            related_entity_id=log.id,
        )

        db.commit()

        processed_count += 1

    return processed_count


def process_due_appointments(
    db: Session,
    now: datetime | None = None,
) -> int:
    from datetime import timedelta
    from app.models.appointment import Appointment, AppointmentStatus
    from app.models.notification import Notification

    if now is None:
        now = datetime.now(timezone.utc)

    # Fetch scheduled appointments in the upcoming window
    statement = (
        select(Appointment)
        .where(
            Appointment.status == AppointmentStatus.SCHEDULED,
            Appointment.appointment_datetime >= now,
            Appointment.appointment_datetime <= now + timedelta(days=2),
        )
    )
    appointments = list(db.scalars(statement).all())
    processed_count = 0

    for appt in appointments:
        lead_delta = timedelta(minutes=appt.reminder_lead_minutes)
        reminder_time = appt.appointment_datetime - lead_delta

        # Check if it's time to notify (now >= reminder_time)
        if now >= reminder_time:
            # Check if notification already created
            existing_notif = db.scalar(
                select(Notification).where(
                    Notification.patient_id == appt.patient_id,
                    Notification.type == NotificationType.APPOINTMENT,
                    Notification.related_entity_id == appt.id,
                )
            )
            if existing_notif:
                continue

            doc_text = f" with {appt.doctor_name}" if appt.doctor_name else ""
            loc_text = f" at {appt.location}" if appt.location else ""
            time_str = appt.appointment_datetime.strftime("%I:%M %p")

            create_notification(
                db=db,
                patient_id=appt.patient_id,
                notification_type=NotificationType.APPOINTMENT,
                title=f"Medical Appointment: {appt.title}",
                message=f"Upcoming appointment{doc_text}{loc_text} today at {time_str}.",
                scheduled_for=now,
                related_entity_id=appt.id,
            )
            db.commit()
            processed_count += 1

    return processed_count


def process_hydration_nudges(
    db: Session,
    now: datetime | None = None,
) -> int:
    from datetime import timedelta
    from app.models.hydration import HydrationLog
    from app.models.notification import Notification
    from app.models.user import User, UserRole

    if now is None:
        now = datetime.now(timezone.utc)

    # Only send nudges during waking hours (08:00 - 20:00 UTC)
    if not (8 <= now.hour <= 20):
        return 0

    patients = list(db.scalars(select(User).where(User.role == UserRole.PATIENT, User.is_active.is_(True))).all())
    processed_count = 0
    cutoff = now - timedelta(hours=2, minutes=30)

    for patient in patients:
        # Check if patient logged water recently
        recent_log = db.scalar(
            select(HydrationLog).where(
                HydrationLog.patient_id == patient.id,
                HydrationLog.logged_at >= cutoff,
            )
        )
        if recent_log:
            continue

        # Check if hydration notification already sent recently
        recent_notif = db.scalar(
            select(Notification).where(
                Notification.patient_id == patient.id,
                Notification.type == NotificationType.HYDRATION,
                Notification.created_at >= cutoff,
            )
        )
        if recent_notif:
            continue

        create_notification(
            db=db,
            patient_id=patient.id,
            notification_type=NotificationType.HYDRATION,
            title="Drink Water Reminder",
            message="Take a gentle break and drink a glass of fresh water to stay energized.",
            scheduled_for=now,
            related_entity_id=None,
        )
        db.commit()
        processed_count += 1

    return processed_count