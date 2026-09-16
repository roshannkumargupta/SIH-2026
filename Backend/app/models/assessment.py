from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CognitiveAssessment(Base):
    __tablename__ = "cognitive_assessments"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    patient_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    overall_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    risk_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="low",
        index=True,
    )

    memory_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    attention_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    executive_function_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    language_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    insights: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    recommendations: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    model_version: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="v1.0-hybrid",
    )

    assessment_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
