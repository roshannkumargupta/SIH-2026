import json
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.cognitive_engine import engine
from app.models.assessment import CognitiveAssessment


def run_patient_assessment(
    db: Session,
    patient_id: UUID,
) -> CognitiveAssessment:
    """Run a fresh cognitive evaluation and persist the resulting assessment."""
    eval_result = engine.evaluate_cognition(db, patient_id)

    assessment = CognitiveAssessment(
        patient_id=patient_id,
        overall_score=eval_result["overall_score"],
        risk_level=eval_result["risk_level"],
        memory_score=eval_result["memory_score"],
        attention_score=eval_result["attention_score"],
        executive_function_score=eval_result["executive_function_score"],
        language_score=eval_result["language_score"],
        insights=json.dumps(eval_result["insights"]),
        recommendations=json.dumps(eval_result["recommendations"]),
        model_version=eval_result["model_version"],
        assessment_date=eval_result["assessment_date"],
    )

    try:
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        return assessment
    except Exception:
        db.rollback()
        raise


def get_latest_assessment(
    db: Session,
    patient_id: UUID,
) -> CognitiveAssessment:
    """Retrieve the most recent assessment or generate one if none exists."""
    assessment = db.scalar(
        select(CognitiveAssessment)
        .where(CognitiveAssessment.patient_id == patient_id)
        .order_by(CognitiveAssessment.assessment_date.desc())
    )

    if not assessment:
        assessment = run_patient_assessment(db, patient_id)

    return assessment


def get_patient_cognitive_trends(
    db: Session,
    patient_id: UUID,
    days: int = 30,
) -> dict:
    """Retrieve assessment trends over time."""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

    assessments = db.scalars(
        select(CognitiveAssessment)
        .where(
            CognitiveAssessment.patient_id == patient_id,
            CognitiveAssessment.assessment_date >= cutoff_date,
        )
        .order_by(CognitiveAssessment.assessment_date.asc())
    ).all()

    if not assessments:
        # Generate initial baseline assessment
        initial = run_patient_assessment(db, patient_id)
        assessments = [initial]

    trend_points = [
        {
            "date": a.assessment_date.strftime("%Y-%m-%d"),
            "overall_score": a.overall_score,
            "risk_level": a.risk_level,
            "memory_score": a.memory_score,
            "attention_score": a.attention_score,
            "executive_function_score": a.executive_function_score,
            "language_score": a.language_score,
        }
        for a in assessments
    ]

    scores = [a.overall_score for a in assessments]
    avg_score = round(sum(scores) / len(scores), 1)

    if len(scores) >= 2:
        diff = scores[-1] - scores[0]
        if diff > 3.0:
            direction = "improving"
        elif diff < -3.0:
            direction = "declining"
        else:
            direction = "stable"
    else:
        direction = "stable"

    return {
        "patient_id": patient_id,
        "trends": trend_points,
        "average_score": avg_score,
        "trend_direction": direction,
    }
