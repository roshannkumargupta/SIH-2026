from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.medication import (
    MedicationLog,
    MedicationLogStatus,
    MedicationSchedule,
)
from app.models.prescription import Prescription
from app.models.user import User, UserRole
from app.schemas.medication import (
    MedicationScheduleCreate,
    MedicationScheduleUpdate,
)


def get_schedule(
    db: Session,
    schedule_id: UUID,
) -> MedicationSchedule | None:

    return db.get(
        MedicationSchedule,
        schedule_id,
    )


def get_patient_schedules(
    db: Session,
    patient_id: UUID,
    target_date: date | None = None,
) -> list[MedicationSchedule]:

    statement = select(
        MedicationSchedule
    ).where(
        MedicationSchedule.patient_id == patient_id,
        MedicationSchedule.active.is_(True),
    )

    if target_date:
        statement = statement.where(
            MedicationSchedule.start_date <= target_date
        )

        statement = statement.where(
            (
                MedicationSchedule.end_date.is_(None)
            )
            | (
                MedicationSchedule.end_date
                >= target_date
            )
        )

    statement = statement.order_by(
        MedicationSchedule.scheduled_time
    )

    return list(
        db.scalars(statement).all()
    )


def create_schedule(
    db: Session,
    doctor: User,
    data: MedicationScheduleCreate,
) -> MedicationSchedule:

    if doctor.role not in (UserRole.DOCTOR, UserRole.CARETAKER, UserRole.ADMIN):
        raise ValueError(
            "Only doctors or authorized caregivers can create medication schedules"
        )

    prescription = db.get(
        Prescription,
        data.prescription_id,
    )

    if not prescription:
        raise ValueError(
            "Prescription not found"
        )

    if doctor.role == UserRole.DOCTOR and prescription.doctor_id != doctor.id:
        raise ValueError(
            "Only the prescribing doctor can create "
            "a schedule for this prescription"
        )

    if (
        data.end_date
        and data.start_date
        and data.end_date < data.start_date
    ):
        raise ValueError(
            "End date cannot be before start date"
        )

    start_date = (
        data.start_date
        or prescription.start_date
    )

    end_date = (
        data.end_date
        if data.end_date is not None
        else prescription.end_date
    )

    schedule = MedicationSchedule(
        prescription_id=prescription.id,
        patient_id=prescription.patient_id,
        medicine_name=prescription.medicine_name,
        dosage=prescription.dosage,
        scheduled_time=data.scheduled_time,
        frequency=data.frequency,
        days_of_week=data.days_of_week,
        start_date=start_date,
        end_date=end_date,
        reminder_enabled=data.reminder_enabled,
        active=True,
    )

    try:
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        return schedule
    except Exception:
        db.rollback()
        raise


def update_schedule(
    db: Session,
    schedule: MedicationSchedule,
    data: MedicationScheduleUpdate,
) -> MedicationSchedule:

    update_data = data.model_dump(
        exclude_unset=True
    )

    new_start_date = update_data.get(
        "start_date",
        schedule.start_date,
    )

    new_end_date = update_data.get(
        "end_date",
        schedule.end_date,
    )

    if (
        new_end_date
        and new_end_date < new_start_date
    ):
        raise ValueError(
            "End date cannot be before start date"
        )

    for field, value in update_data.items():
        setattr(
            schedule,
            field,
            value,
        )

    try:
        db.commit()
        db.refresh(schedule)
        return schedule
    except Exception:
        db.rollback()
        raise


def create_medication_log(
    db: Session,
    schedule: MedicationSchedule,
    scheduled_datetime: datetime,
) -> MedicationLog:

    log = MedicationLog(
        patient_id=schedule.patient_id,
        schedule_id=schedule.id,
        scheduled_at=scheduled_datetime,
        status=MedicationLogStatus.SCHEDULED,
    )

    try:
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    except Exception:
        db.rollback()
        raise


def get_medication_log(
    db: Session,
    log_id: UUID,
) -> MedicationLog | None:

    return db.get(
        MedicationLog,
        log_id,
    )


def get_patient_medication_logs(
    db: Session,
    patient_id: UUID,
    target_date: date | None = None,
) -> list[MedicationLog]:

    # If querying today's logs, ensure every active schedule has a log entry for today
    if target_date == date.today():
        schedules = get_patient_schedules(db, patient_id, date.today())
        start_utc = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
        
        for s in schedules:
            existing_log = db.scalar(
                select(MedicationLog).where(
                    MedicationLog.schedule_id == s.id,
                    MedicationLog.scheduled_at >= start_utc,
                )
            )
            if not existing_log:
                sched_dt = datetime.combine(date.today(), s.scheduled_time).replace(tzinfo=timezone.utc)
                new_log = MedicationLog(
                    schedule_id=s.id,
                    patient_id=patient_id,
                    scheduled_at=sched_dt,
                    status=MedicationLogStatus.SCHEDULED,
                )
                db.add(new_log)
        try:
            db.commit()
        except Exception:
            db.rollback()

    statement = select(
        MedicationLog
    ).where(
        MedicationLog.patient_id == patient_id
    )

    if target_date:
        start_naive = datetime.combine(target_date, datetime.min.time())
        end_naive = datetime.combine(target_date, datetime.max.time())
        start_utc = start_naive.replace(tzinfo=timezone.utc)
        end_utc = end_naive.replace(tzinfo=timezone.utc)
        statement = statement.where(
            (MedicationLog.scheduled_at >= start_naive) | (MedicationLog.scheduled_at >= start_utc),
            (MedicationLog.scheduled_at <= end_naive) | (MedicationLog.scheduled_at <= end_utc),
        )

    statement = statement.order_by(
        MedicationLog.scheduled_at.desc()
    )

    return list(
        db.scalars(statement).all()
    )


def update_medication_log_status(
    db: Session,
    log: MedicationLog,
    status: MedicationLogStatus,
) -> MedicationLog:

    log.status = status

    if status == MedicationLogStatus.TAKEN:
        log.taken_at = datetime.now(
            timezone.utc
        )
    elif status != MedicationLogStatus.TAKEN:
        log.taken_at = None

    try:
        db.commit()
        db.refresh(log)
        return log
    except Exception:
        db.rollback()
        raise