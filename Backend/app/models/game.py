from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    game_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    game_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    accuracy: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    duration_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    difficulty: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="medium",
    )

    level_achieved: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    metrics: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class GameAssignment(Base):
    __tablename__ = "game_assignments"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    game_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    assigned_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class PatientGameAbility(Base):
    """Per-patient, per-game Bayesian ability state and caregiver override."""

    __tablename__ = "patient_game_abilities"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    game_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    theta: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
    )

    sigma: Mapped[float] = mapped_column(
        Float,
        default=1.5,
        nullable=False,
    )

    manual_override_level: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    last_level_played: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    last_recommended_level: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    last_lowered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    sessions_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
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
