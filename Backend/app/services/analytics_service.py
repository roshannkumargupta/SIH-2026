"""
Analytics service — assessment persistence, trend computation, and cognitive
decline detection.
"""

import json
import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.cognitive_engine import engine
from app.models.assessment import CognitiveAssessment
from app.models.notification import Notification, NotificationStatus, NotificationType
from app.schemas.analytics import AdherenceResponse

logger = logging.getLogger("analytics_service")


# ---------------------------------------------------------------------------
# Core CRUD
# ---------------------------------------------------------------------------

def run_patient_assessment(
    db: Session,
    patient_id: UUID,
) -> CognitiveAssessment:
    """Run a fresh cognitive evaluation and persist the resulting assessment."""
    eval_result = engine.evaluate_cognition(db, patient_id)

    adherence = eval_result.get("adherence", {})

    assessment = CognitiveAssessment(
        patient_id=patient_id,
        overall_score=eval_result["overall_score"],
        risk_level=eval_result["risk_level"],
        memory_score=eval_result["memory_score"],
        attention_score=eval_result["attention_score"],
        executive_function_score=eval_result["executive_function_score"],
        language_score=eval_result["language_score"],
        visuospatial_score=eval_result["visuospatial_score"],
        insights=json.dumps(eval_result["insights"]),
        recommendations=json.dumps(eval_result["recommendations"]),
        model_version=eval_result["model_version"],
        method_description=eval_result["method_description"],
        medication_adherence_rate=adherence.get("medication_rate"),
        task_adherence_rate=adherence.get("task_rate"),
        assessment_date=eval_result["assessment_date"],
    )

    try:
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
    except Exception:
        db.rollback()
        raise

    # After persisting, run decline detection (non-fatal)
    try:
        detect_cognitive_decline(db, patient_id)
    except Exception as exc:
        logger.warning("Decline detection failed (non-fatal): %s", exc)

    # Attach adherence as a transient attribute for the response serialiser
    assessment.adherence = AdherenceResponse(  # type: ignore[attr-defined]
        medication_rate=adherence.get("medication_rate"),
        task_rate=adherence.get("task_rate"),
    )

    return assessment


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
    else:
        # Attach adherence from stored columns
        assessment.adherence = AdherenceResponse(  # type: ignore[attr-defined]
            medication_rate=assessment.medication_adherence_rate,
            task_rate=assessment.task_adherence_rate,
        )

    return assessment


# ---------------------------------------------------------------------------
# Trend computation
# ---------------------------------------------------------------------------

def _ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _linear_slope(values: list[float | None]) -> float | None:
    """Compute the OLS slope of a series of values (index = x).

    Returns None if fewer than 2 non-null values.
    """
    points = [(i, v) for i, v in enumerate(values) if v is not None]
    n = len(points)
    if n < 2:
        return None
    mean_x = sum(x for x, _ in points) / n
    mean_y = sum(y for _, y in points) / n
    num = sum((x - mean_x) * (y - mean_y) for x, y in points)
    den = sum((x - mean_x) ** 2 for x, _ in points)
    if den == 0:
        return 0.0
    return num / den


def get_patient_cognitive_trends(
    db: Session,
    patient_id: UUID,
    days: int = 90,
) -> dict:
    """Retrieve assessment trends over time with per-domain slope analysis."""
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

    assessments = list(
        db.scalars(
            select(CognitiveAssessment)
            .where(
                CognitiveAssessment.patient_id == patient_id,
                CognitiveAssessment.assessment_date >= cutoff_date,
            )
            .order_by(CognitiveAssessment.assessment_date.asc())
        ).all()
    )

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
            "visuospatial_score": a.visuospatial_score,
        }
        for a in assessments
    ]

    # Overall direction
    non_null_scores = [a.overall_score for a in assessments if a.overall_score is not None]
    if len(non_null_scores) >= 2:
        diff = non_null_scores[-1] - non_null_scores[0]
        if diff > 3.0:
            direction = "improving"
        elif diff < -3.0:
            direction = "declining"
        else:
            direction = "stable"
    elif non_null_scores:
        direction = "stable"
    else:
        direction = "insufficient_data"

    avg_score = round(sum(non_null_scores) / len(non_null_scores), 1) if non_null_scores else None

    # Per-domain slopes (7-day and 30-day windows)
    domain_slopes: dict[str, dict] = {}
    decline_domains: list[str] = []

    domain_attr_map = {
        "memory": "memory_score",
        "attention": "attention_score",
        "executive_function": "executive_function_score",
        "language": "language_score",
        "visuospatial": "visuospatial_score",
    }

    now = datetime.now(timezone.utc)
    for domain, attr in domain_attr_map.items():
        # 30-day window
        cutoff_30 = now - timedelta(days=30)
        values_30 = [
            getattr(a, attr, None)
            for a in assessments
            if a.assessment_date is not None and _ensure_utc(a.assessment_date) >= cutoff_30
        ]

        # 7-day window
        cutoff_7 = now - timedelta(days=7)
        values_7 = [
            getattr(a, attr, None)
            for a in assessments
            if a.assessment_date is not None and _ensure_utc(a.assessment_date) >= cutoff_7
        ]

        slope_30 = _linear_slope(values_30)
        slope_7 = _linear_slope(values_7)

        # Count consecutive declining days (negative slope for 14+ days)
        days_declining = 0
        if slope_30 is not None and slope_30 < -0.5:
            # Walk backwards through assessments to find how many consecutive
            # days the score has been non-increasing
            reversed_vals = [
                getattr(a, attr, None)
                for a in reversed(assessments)
                if getattr(a, attr, None) is not None
            ]
            if len(reversed_vals) >= 2:
                for i in range(1, len(reversed_vals)):
                    if reversed_vals[i - 1] <= reversed_vals[i]:
                        days_declining += 1
                    else:
                        break

        declining = days_declining >= 14 and slope_30 is not None and slope_30 < -0.5
        if declining:
            decline_domains.append(domain)

        domain_slopes[domain] = {
            "slope_7d": round(slope_7, 3) if slope_7 is not None else None,
            "slope_30d": round(slope_30, 3) if slope_30 is not None else None,
            "declining": declining,
            "days_declining": days_declining,
        }

    decline_alert_active = len(decline_domains) >= 2

    return {
        "patient_id": patient_id,
        "trends": trend_points,
        "average_score": avg_score,
        "trend_direction": direction,
        "domain_slopes": domain_slopes,
        "decline_alert_active": decline_alert_active,
        "decline_domains": decline_domains if decline_domains else None,
    }


# ---------------------------------------------------------------------------
# Cognitive decline detection & alerting
# ---------------------------------------------------------------------------

def detect_cognitive_decline(
    db: Session,
    patient_id: UUID,
) -> bool:
    """Check whether 2+ domains have been declining for 14+ days.

    If so, create a ``COGNITIVE_DECLINE`` notification (if one hasn't
    already been sent in the last 7 days).  Returns True if an alert was
    raised.
    """
    trend_data = get_patient_cognitive_trends(db, patient_id, days=30)

    if not trend_data.get("decline_alert_active"):
        return False

    decline_domains = trend_data.get("decline_domains") or []
    if len(decline_domains) < 2:
        return False

    # Don't spam — check if we already sent a decline alert in the last 7 days
    recent_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    existing = db.scalar(
        select(Notification).where(
            Notification.patient_id == patient_id,
            Notification.type == NotificationType.COGNITIVE_DECLINE,
            Notification.created_at >= recent_cutoff,
        )
    )
    if existing:
        return False

    domain_names = ", ".join(d.replace("_", " ").title() for d in decline_domains)
    notification = Notification(
        patient_id=patient_id,
        type=NotificationType.COGNITIVE_DECLINE,
        title="Cognitive Decline Alert",
        message=(
            f"Sustained decline detected in {len(decline_domains)} domains "
            f"({domain_names}) over the past 14+ days. A clinical review is "
            f"recommended."
        ),
        scheduled_for=datetime.now(timezone.utc),
        status=NotificationStatus.PENDING,
    )

    try:
        db.add(notification)
        db.commit()
        logger.warning(
            "COGNITIVE_DECLINE alert raised for patient %s: domains=%s",
            patient_id,
            decline_domains,
        )
        return True
    except Exception:
        db.rollback()
        raise
