import logging
from apscheduler.schedulers.background import (
    BackgroundScheduler,
)

from app.core.database import SessionLocal
from app.services.reminder_service import (
    process_due_appointments,
    process_due_medications,
    process_hydration_nudges,
)

logger = logging.getLogger("scheduler")
scheduler = BackgroundScheduler()


def scheduled_reminder_job():
    db = SessionLocal()

    try:
        med_count = process_due_medications(db)
        if med_count > 0:
            logger.info(f"Processed {med_count} due medication reminders.")

        appt_count = process_due_appointments(db)
        if appt_count > 0:
            logger.info(f"Processed {appt_count} due appointment reminders.")

        hyd_count = process_hydration_nudges(db)
        if hyd_count > 0:
            logger.info(f"Processed {hyd_count} hydration reminders.")
    except Exception as exc:
        db.rollback()
        logger.error(f"Error executing scheduled reminder job: {exc}", exc_info=True)
    finally:
        db.close()


def start_scheduler():
    if scheduler.running:
        return

    scheduler.add_job(
        scheduled_reminder_job,
        "interval",
        minutes=1,
        id="medication_reminder_job",
        replace_existing=True,
    )

    scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()