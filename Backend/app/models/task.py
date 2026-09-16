from datetime import date, datetime, time, timezone
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, Enum as SQLEnum, ForeignKey, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TaskPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"


class TaskRecurrence(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    CUSTOM = "custom"


class TaskStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    MISSED = "missed"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_by: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    scheduled_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    priority: Mapped[TaskPriority] = mapped_column(
        SQLEnum(TaskPriority),
        default=TaskPriority.NORMAL,
        nullable=False,
    )

    recurrence: Mapped[TaskRecurrence] = mapped_column(
        SQLEnum(TaskRecurrence),
        default=TaskRecurrence.DAILY,
        nullable=False,
    )

    days_of_week: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    status: Mapped[TaskStatus] = mapped_column(
        SQLEnum(TaskStatus),
        default=TaskStatus.PENDING,
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )