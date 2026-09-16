from datetime import date, datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    date_of_birth: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    emergency_contact_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    emergency_contact_phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    preferred_language: Mapped[str] = mapped_column(
        String(20),
        default="en",
        nullable=False,
    )

    gender: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    address: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    doctor_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    timezone: Mapped[str] = mapped_column(
        String(50),
        default="Asia/Kolkata",
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


class PatientCalibration(Base):
    __tablename__ = "patient_calibrations"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    total_score: Mapped[int] = mapped_column(
        nullable=False,
        default=8,
    )

    initial_difficulty: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="medium",
    )

    note: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    answers: Mapped[str | None] = mapped_column(
        nullable=True,
    )

    ai_difficulty_enabled: Mapped[bool] = mapped_column(
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