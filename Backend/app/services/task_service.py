from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import (
    Task,
    TaskStatus,
)
from app.models.user import User
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
)


def create_task(
    db: Session,
    current_user: User,
    data: TaskCreate,
) -> Task:

    task = Task(
        patient_id=data.patient_id,
        created_by=current_user.id,
        title=data.title,
        description=data.description,
        scheduled_time=data.scheduled_time,
        priority=data.priority,
        recurrence=data.recurrence,
        days_of_week=data.days_of_week,
        start_date=data.start_date,
        end_date=data.end_date,
        status=TaskStatus.PENDING,
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


def get_task(
    db: Session,
    task_id: UUID,
) -> Task | None:

    return db.scalar(
        select(Task).where(
            Task.id == task_id,
        )
    )


def get_patient_tasks(
    db: Session,
    patient_id: UUID,
    task_date: date | None = None,
) -> list[Task]:

    query = select(Task).where(
        Task.patient_id == patient_id,
    )

    if task_date is not None:
        query = query.where(
            Task.start_date <= task_date,
            (
                (Task.end_date.is_(None))
                | (Task.end_date >= task_date)
            ),
        )

    query = query.order_by(
        Task.scheduled_time.asc(),
    )

    return list(db.scalars(query).all())


def update_task(
    db: Session,
    task: Task,
    data: TaskUpdate,
) -> Task:

    update_data = data.model_dump(
        exclude_unset=True,
    )

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task


def complete_task(
    db: Session,
    task: Task,
) -> Task:

    task.status = TaskStatus.COMPLETED
    task.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(task)

    return task


def reset_task(
    db: Session,
    task: Task,
) -> Task:

    task.status = TaskStatus.PENDING
    task.completed_at = None

    db.commit()
    db.refresh(task)

    return task


def delete_task(
    db: Session,
    task: Task,
) -> None:

    db.delete(task)
    db.commit()