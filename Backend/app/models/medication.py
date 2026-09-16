
from datetime import date, datetime, time, timezone
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    String,
    Time,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
class MedicationFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    CUSTOM = "custom"


class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    prescription_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "prescriptions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    medicine_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    dosage: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    scheduled_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    frequency: Mapped[MedicationFrequency] = mapped_column(
        SQLEnum(MedicationFrequency),
        default=MedicationFrequency.DAILY,
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

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    reminder_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
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
class MedicationLogStatus(str, Enum):
    SCHEDULED = "scheduled"
    TAKEN = "taken"
    MISSED = "missed"
    SKIPPED = "skipped"


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    schedule_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "medication_schedules.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    taken_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    status: Mapped[MedicationLogStatus] = mapped_column(
        SQLEnum(MedicationLogStatus),
        default=MedicationLogStatus.SCHEDULED,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )