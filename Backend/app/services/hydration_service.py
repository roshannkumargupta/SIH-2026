from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.hydration import (
    DailyHydrationGoal,
    HydrationLog,
    HydrationSource,
)


def log_hydration(
    db: Session,
    patient_id: UUID,
    amount_ml: int = 250,
    source: HydrationSource = HydrationSource.MANUAL,
    logged_at: datetime | None = None,
) -> HydrationLog:
    if logged_at is None:
        logged_at = datetime.now(timezone.utc)

    log = HydrationLog(
        patient_id=patient_id,
        amount_ml=amount_ml,
        source=source,
        logged_at=logged_at,
    )

    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_daily_goal(
    db: Session,
    patient_id: UUID,
) -> int:
    goal_record = db.scalar(
        select(DailyHydrationGoal).where(DailyHydrationGoal.patient_id == patient_id)
    )
    if goal_record:
        return goal_record.goal_ml
    return 1500  # Default 1500 ml (~6 glasses)


def set_daily_goal(
    db: Session,
    patient_id: UUID,
    goal_ml: int,
) -> DailyHydrationGoal:
    goal_record = db.scalar(
        select(DailyHydrationGoal).where(DailyHydrationGoal.patient_id == patient_id)
    )
    if goal_record:
        goal_record.goal_ml = goal_ml
    else:
        goal_record = DailyHydrationGoal(
            patient_id=patient_id,
            goal_ml=goal_ml,
        )
        db.add(goal_record)

    db.commit()
    db.refresh(goal_record)
    return goal_record


def get_today_summary(
    db: Session,
    patient_id: UUID,
    target_date: date | None = None,
) -> dict:
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()

    start_utc = datetime.combine(target_date, time.min).replace(tzinfo=timezone.utc)
    end_utc = datetime.combine(target_date, time.max).replace(tzinfo=timezone.utc)

    # Fetch logs for target day
    statement = (
        select(HydrationLog)
        .where(
            HydrationLog.patient_id == patient_id,
            HydrationLog.logged_at >= start_utc,
            HydrationLog.logged_at <= end_utc,
        )
        .order_by(HydrationLog.logged_at.desc())
    )
    logs = list(db.scalars(statement).all())

    total_ml = sum(l.amount_ml for l in logs)
    goal_ml = get_daily_goal(db, patient_id)
    percent = min(100, int((total_ml / goal_ml) * 100)) if goal_ml > 0 else 0

    return {
        "patient_id": patient_id,
        "total_ml": total_ml,
        "goal_ml": goal_ml,
        "percent": percent,
        "logs": logs,
    }


def get_hydration_history(
    db: Session,
    patient_id: UUID,
    days: int = 7,
) -> list[dict]:
    today = datetime.now(timezone.utc).date()
    history = []

    for i in range(days):
        day = today - timedelta(days=i)
        summary = get_today_summary(db, patient_id, target_date=day)
        history.append({
            "date": day.isoformat(),
            "total_ml": summary["total_ml"],
            "goal_ml": summary["goal_ml"],
            "percent": summary["percent"],
            "log_count": len(summary["logs"]),
        })

    return history
