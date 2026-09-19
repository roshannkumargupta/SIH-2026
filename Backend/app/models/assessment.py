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

    overall_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    risk_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="unassessable",
        index=True,
    )

    memory_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    attention_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    executive_function_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    language_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    visuospatial_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
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
        default="2.0-heuristic",
    )

    method_description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    medication_adherence_rate: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    task_adherence_rate: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
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
