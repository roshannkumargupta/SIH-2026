"""
Cognitive Engine v2.0-heuristic
===============================

Computes per-domain cognitive scores from *actual* game session data using the
shared game→domain mapping.  No fake defaults, no medication proxies blended
into cognitive scores.

Method
------
For each of the five clinical domains (Memory, Attention, Executive Function,
Language, Visuospatial) the engine:

1. Collects all completed ``GameSession`` rows whose ``game_type`` or
   ``game_id`` is mapped to that domain (via ``game_domain_mapping``).
2. Applies **difficulty normalisation**: raw accuracy is scaled by the
   session's ``level_achieved`` —
   ``normalised = min(100, accuracy * (1 + 0.05 * (level - 1)))``.
   A 90 % accuracy at level 5 counts more than 90 % at level 1.
3. Applies **exponential-decay recency weighting** with a 7-day half-life:
   ``weight = exp(-λ * days_old)`` where ``λ = ln(2) / 7``.
4. The domain score is the weighted mean of the normalised accuracies.
5. If a domain has **zero sessions** in the window the score is ``None``
   (status ``"insufficient_data"``), never a fabricated number.
6. An overall composite score is the weighted average of non-null domain
   scores only.  Weights: Memory 0.25, Attention 0.20, Executive Function
   0.25, Language 0.15, Visuospatial 0.15.
7. Risk level is only assessed when ≥ 3 domains have data; otherwise
   ``"unassessable"``.

Medication and task adherence are computed separately and returned in an
``adherence`` key — never mixed into cognitive scores.
"""

import logging
import math
import os
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.game_domain_mapping import (
    CLINICAL_DOMAINS,
    DOMAIN_GAME_IDS,
    GAME_MAX_LEVELS,
    GAME_TO_DOMAINS,
    get_max_level_for_game,
    normalize_game_id,
)
from app.ai.ml_difficulty import (
    INITIAL_SIGMA,
    compute_difficulty_recommendation,
    compute_telemetry_variance_modifiers,
    update_ability_state,
)
from app.core.config import settings
from app.models.game import GameSession, PatientGameAbility
from app.models.medication import MedicationLog, MedicationLogStatus
from app.models.task import Task, TaskStatus

logger = logging.getLogger("cognitive_engine")

# Exponential-decay half-life in days
_HALF_LIFE_DAYS: float = 7.0
_LAMBDA: float = math.log(2) / _HALF_LIFE_DAYS

# Domain weights for overall composite (must sum to 1.0)
_DOMAIN_WEIGHTS: dict[str, float] = {
    "memory": 0.25,
    "attention": 0.20,
    "executive_function": 0.25,
    "language": 0.15,
    "visuospatial": 0.15,
}

# Model version — this is a rules-based heuristic, not a validated clinical model
MODEL_VERSION = "2.0-heuristic"
METHOD_DESCRIPTION = (
    "Scores are computed from game-play accuracy using exponential-decay "
    "recency weighting (7-day half-life) and difficulty-level normalisation. "
    "Domain scores are the weighted mean of normalised accuracies for games "
    "mapped to each clinical domain. This is a heuristic estimate and has "
    "NOT been validated in a clinical trial. It does not constitute a "
    "clinical diagnosis."
)


def _difficulty_normalise(accuracy: float, level: int) -> float:
    """Scale accuracy upward based on difficulty level achieved.

    Higher levels represent harder play, so the same raw accuracy at a
    harder level is more impressive.

    Returns a value capped at 100.0.
    """
    return min(100.0, accuracy * (1.0 + 0.05 * (level - 1)))


def _recency_weight(completed_at: datetime, now: datetime) -> float:
    """Exponential-decay weight based on session age."""
    if completed_at.tzinfo is None:
        completed_at = completed_at.replace(tzinfo=timezone.utc)
    delta = (now - completed_at).total_seconds()
    days_old = max(delta / 86400.0, 0.0)
    return math.exp(-_LAMBDA * days_old)


class CognitiveEngine:
    def __init__(self):
        # Daily in-memory assessment cache: (patient_id, YYYY-MM-DD) -> (cached_time, result)
        self._assessment_cache: dict[tuple[UUID, str], tuple[datetime, dict[str, Any]]] = {}
        logger.info("CognitiveEngine initialized with daily assessment caching and Bayesian controller.")

    def invalidate_assessment_cache(self, patient_id: UUID | None = None) -> None:
        """Invalidate in-memory assessment cache for a specific patient or all patients."""
        if patient_id is None:
            self._assessment_cache.clear()
        else:
            keys_to_delete = [k for k in self._assessment_cache if k[0] == patient_id]
            for k in keys_to_delete:
                del self._assessment_cache[k]

    # ------------------------------------------------------------------
    # Core evaluation
    # ------------------------------------------------------------------
    def evaluate_cognition(
        self,
        db: Session,
        patient_id: UUID,
        use_cache: bool = True,
    ) -> dict[str, Any]:
        """
        Compute a comprehensive cognitive profile from real game-play data.

        Returns a dict with per-domain scores (or None when data is
        insufficient), overall composite, risk level, adherence stats,
        insights and recommendations.
        """
        now = datetime.now(timezone.utc)
        cache_key = (patient_id, now.strftime("%Y-%m-%d"))
        if use_cache and cache_key in self._assessment_cache:
            cached_time, cached_res = self._assessment_cache[cache_key]
            if (now - cached_time).total_seconds() < 21600:
                return cached_res

        cutoff_date = now - timedelta(days=30)

        # -- 1. Fetch game sessions in the scoring window -----------------
        games = list(
            db.scalars(
                select(GameSession).where(
                    GameSession.patient_id == patient_id,
                    GameSession.completed_at >= cutoff_date,
                )
            ).all()
        )

        # -- 2. Bucket sessions by clinical domain -----------------------
        domain_sessions: dict[str, list[GameSession]] = {d: [] for d in CLINICAL_DOMAINS}

        for g in games:
            # Match on either game_type or game_id
            game_key = g.game_type or g.game_id or ""
            game_key_alt = normalize_game_id(game_key)
            domains = GAME_TO_DOMAINS.get(game_key) or GAME_TO_DOMAINS.get(game_key_alt) or []
            for d in domains:
                domain_sessions[d].append(g)

        # -- 3. Compute per-domain recency-weighted, difficulty-normalised scores
        domain_scores: dict[str, float | None] = {}
        domain_statuses: dict[str, str] = {}
        domain_session_counts: dict[str, int] = {}

        for domain in CLINICAL_DOMAINS:
            sessions = domain_sessions[domain]
            domain_session_counts[domain] = len(sessions)

            if not sessions:
                domain_scores[domain] = None
                domain_statuses[domain] = "insufficient_data"
                continue

            weighted_sum = 0.0
            weight_total = 0.0
            for s in sessions:
                w = _recency_weight(s.completed_at, now)
                norm_acc = _difficulty_normalise(s.accuracy, s.level_achieved)
                weighted_sum += norm_acc * w
                weight_total += w

            if weight_total > 0:
                score = round(max(0.0, min(100.0, weighted_sum / weight_total)), 1)
            else:
                score = None

            domain_scores[domain] = score
            domain_statuses[domain] = "scored" if score is not None else "insufficient_data"

        # -- 4. Overall composite (only non-null domains) ----------------
        non_null = {d: s for d, s in domain_scores.items() if s is not None}
        if non_null:
            total_weight = sum(_DOMAIN_WEIGHTS[d] for d in non_null)
            overall_score = round(
                sum(score * _DOMAIN_WEIGHTS[d] / total_weight for d, score in non_null.items()),
                1,
            )
        else:
            overall_score = None

        # -- 5. Risk level (requires ≥ 3 domains with data) -------------
        if len(non_null) >= 3 and overall_score is not None:
            if overall_score >= 80.0:
                risk_level = "low"
            elif overall_score >= 60.0:
                risk_level = "moderate"
            elif overall_score >= 40.0:
                risk_level = "high"
            else:
                risk_level = "critical"
        else:
            risk_level = "unassessable"

        # -- 6. Adherence (separate, never blended) ----------------------
        med_logs = list(
            db.scalars(
                select(MedicationLog).where(
                    MedicationLog.patient_id == patient_id,
                    MedicationLog.scheduled_at >= cutoff_date,
                )
            ).all()
        )
        total_meds = len(med_logs)
        taken_meds = sum(1 for m in med_logs if m.status == MedicationLogStatus.TAKEN)
        med_adherence = round(taken_meds / total_meds * 100.0, 1) if total_meds > 0 else None

        tasks = list(
            db.scalars(
                select(Task).where(
                    Task.patient_id == patient_id,
                    Task.created_at >= cutoff_date,
                )
            ).all()
        )
        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
        task_adherence = round(completed_tasks / total_tasks * 100.0, 1) if total_tasks > 0 else None

        # -- 7. Insights and recommendations -----------------------------
        insights: list[str] = []
        recommendations: list[str] = []

        for domain in CLINICAL_DOMAINS:
            score = domain_scores[domain]
            label = domain.replace("_", " ").title()
            if score is None:
                insights.append(f"{label}: insufficient game data to assess.")
                recommendations.append(
                    f"Play games targeting {label} to enable assessment."
                )
            elif score < 50.0:
                insights.append(
                    f"{label} score is {score}/100 — significantly below expected baseline."
                )
                recommendations.append(
                    f"Increase daily {label.lower()} exercises and consider clinical review."
                )
            elif score < 65.0:
                insights.append(
                    f"{label} score ({score}/100) shows mild decline from normal range."
                )
                recommendations.append(
                    f"Schedule additional {label.lower()} stimulation exercises."
                )
            else:
                insights.append(f"{label} performance ({score}/100) is within normal range.")

        if risk_level in ("high", "critical"):
            recommendations.append(
                "Schedule a comprehensive clinical assessment with the attending neurologist."
            )

        result = {
            "overall_score": overall_score,
            "risk_level": risk_level,
            "memory_score": domain_scores["memory"],
            "attention_score": domain_scores["attention"],
            "executive_function_score": domain_scores["executive_function"],
            "language_score": domain_scores["language"],
            "visuospatial_score": domain_scores["visuospatial"],
            "domain_statuses": domain_statuses,
            "domain_session_counts": domain_session_counts,
            "insights": insights,
            "recommendations": recommendations,
            "adherence": {
                "medication_rate": med_adherence,
                "task_rate": task_adherence,
            },
            "model_version": MODEL_VERSION,
            "method_description": METHOD_DESCRIPTION,
            "assessment_date": now,
        }
        self._assessment_cache[cache_key] = (now, result)
        return result

    # ------------------------------------------------------------------
    # Adaptive difficulty recommendation (Bayesian Ability Controller)
    # ------------------------------------------------------------------
    def recommend_level(
        self,
        db: Session,
        patient_id: UUID,
        game_id: str,
    ) -> dict[str, Any]:
        """
        Calculates an adaptive difficulty recommendation for a patient and specific game
        using the Bayesian psychometric ability controller targeting the 75-80% challenge zone.
        """
        import json
        from app.models.patient import PatientCalibration

        norm_game_id = normalize_game_id(game_id)
        max_level = get_max_level_for_game(norm_game_id)

        # 1. Fetch patient calibration prior (if any)
        calibration = db.scalars(
            select(PatientCalibration).where(PatientCalibration.patient_id == patient_id)
        ).first()
        ai_enabled = calibration.ai_difficulty_enabled if calibration else True

        # Default prior level from calibration
        prior_level = 1
        if calibration:
            if calibration.initial_difficulty == "medium":
                prior_level = 3
            elif calibration.initial_difficulty == "easy":
                prior_level = 1 if calibration.note == "flag_extra_simplified_content" else 2

        # 2. Fetch or initialize PatientGameAbility record
        ability = db.scalars(
            select(PatientGameAbility).where(
                PatientGameAbility.patient_id == patient_id,
                PatientGameAbility.game_id.in_([game_id, norm_game_id, game_id.replace("_", "-")]),
            )
        ).first()

        now = datetime.now(timezone.utc)

        # 3. If no ability record exists yet, check past sessions or create initial baseline
        if ability is None:
            past_sessions = list(
                db.scalars(
                    select(GameSession)
                    .where(
                        GameSession.patient_id == patient_id,
                        (GameSession.game_id.in_([game_id, norm_game_id, game_id.replace("_", "-")]))
                        | (GameSession.game_type.in_([game_id, norm_game_id, game_id.replace("_", "-")])),
                    )
                    .order_by(GameSession.completed_at.desc())
                    .limit(5)
                ).all()
            )

            if past_sessions:
                t = float(past_sessions[-1].level_achieved)
                s_val = INITIAL_SIGMA
                for s in reversed(past_sessions):
                    t, s_val, _, _ = update_ability_state(
                        current_theta=t,
                        current_sigma=s_val,
                        accuracy=s.accuracy,
                        level_played=s.level_achieved,
                        max_level=max_level,
                    )
                init_theta = t
                init_sigma = s_val
                last_lvl = past_sessions[0].level_achieved
                sessions_cnt = len(past_sessions)
            else:
                init_theta = float(prior_level)
                init_sigma = INITIAL_SIGMA
                last_lvl = prior_level
                sessions_cnt = 0

            ability = PatientGameAbility(
                patient_id=patient_id,
                game_id=norm_game_id,
                theta=init_theta,
                sigma=init_sigma,
                last_level_played=last_lvl,
                sessions_count=sessions_cnt,
            )
            db.add(ability)
            db.commit()
            db.refresh(ability)

        # 4. Check if AI difficulty is disabled by caregiver
        if not ai_enabled:
            target_level = ability.manual_override_level or ability.last_level_played or prior_level
            target_level = max(1, min(max_level, target_level))
            return {
                "recommended_level": target_level,
                "confidence": "high" if ability.manual_override_level else "low",
                "rationale": (
                    f"Manual caregiver override active (Level {target_level})"
                    if ability.manual_override_level
                    else f"AI difficulty adaptation is paused by caregiver settings (Level {target_level})"
                ),
                "based_on_sessions": ability.sessions_count,
                "ai_difficulty_enabled": False,
                "model_type": "statistical_controller",
                "theta": round(ability.theta, 2),
                "sigma": round(ability.sigma, 2),
                "manual_override_level": ability.manual_override_level,
                "cooldown_active": False,
                "last_lowered_at": ability.last_lowered_at,
            }

        # 5. Check if patient has zero sessions recorded
        if ability.sessions_count == 0 and ability.manual_override_level is None:
            # Check if sessions were added directly
            recent_direct = list(
                db.scalars(
                    select(GameSession)
                    .where(
                        GameSession.patient_id == patient_id,
                        (GameSession.game_id.in_([game_id, norm_game_id, game_id.replace("_", "-")]))
                        | (GameSession.game_type.in_([game_id, norm_game_id, game_id.replace("_", "-")])),
                    )
                    .order_by(GameSession.completed_at.desc())
                    .limit(5)
                ).all()
            )
            if not recent_direct:
                target_level = prior_level
                return {
                    "recommended_level": target_level,
                    "confidence": "low",
                    "rationale": (
                        "Baseline prior set from initial caregiver assessment"
                        if calibration
                        else "Default starting level for new activity (baseline calibration)"
                    ),
                    "based_on_sessions": 0,
                    "ai_difficulty_enabled": True,
                    "model_type": "statistical_controller",
                    "theta": round(ability.theta, 2),
                    "sigma": round(ability.sigma, 2),
                    "manual_override_level": None,
                    "cooldown_active": False,
                    "last_lowered_at": None,
                }
            else:
                t = float(recent_direct[-1].level_achieved)
                s_val = INITIAL_SIGMA
                for s in reversed(recent_direct):
                    t, s_val, _, _ = update_ability_state(
                        current_theta=t,
                        current_sigma=s_val,
                        accuracy=s.accuracy,
                        level_played=s.level_achieved,
                        max_level=max_level,
                    )
                ability.theta = t
                ability.sigma = s_val
                ability.last_level_played = recent_direct[0].level_achieved
                ability.sessions_count = len(recent_direct)
                db.commit()

        # 6. Fetch recent sessions for rolling metrics & telemetry
        recent_sessions = list(
            db.scalars(
                select(GameSession)
                .where(
                    GameSession.patient_id == patient_id,
                    (GameSession.game_id.in_([game_id, norm_game_id, game_id.replace("_", "-")]))
                    | (GameSession.game_type.in_([game_id, norm_game_id, game_id.replace("_", "-")])),
                )
                .order_by(GameSession.completed_at.desc())
                .limit(5)
            ).all()
        )

        # 6a. Mastery-reset check: if the most recent session has mastery_reset=true
        # in its metrics JSON, reset this patient's ability state back to level 1 so
        # the AI recommendation agrees with the frontend's useGameProgress() hook.
        if recent_sessions:
            latest_session = recent_sessions[0]
            latest_metrics: dict | None = None
            if latest_session.metrics:
                try:
                    latest_metrics = (
                        json.loads(latest_session.metrics)
                        if isinstance(latest_session.metrics, str)
                        else latest_session.metrics
                    )
                except Exception:
                    pass
            if isinstance(latest_metrics, dict) and latest_metrics.get("mastery_reset") is True:
                logger.info(
                    "Mastery reset detected for patient %s game %s — resetting ability state to L1",
                    patient_id,
                    norm_game_id,
                )
                ability.theta = 1.0
                ability.sigma = INITIAL_SIGMA
                ability.last_level_played = 1
                ability.last_recommended_level = 1
                db.commit()
                return {
                    "recommended_level": 1,
                    "confidence": "high",
                    "rationale": "Mastery cycle completed — starting fresh from Level 1",
                    "based_on_sessions": ability.sessions_count,
                    "ai_difficulty_enabled": True,
                    "model_type": "statistical_controller",
                    "theta": 1.0,
                    "sigma": round(INITIAL_SIGMA, 2),
                    "manual_override_level": ability.manual_override_level,
                    "cooldown_active": False,
                    "last_lowered_at": None,
                }

        rolling_acc: float | None = None
        telemetry_notes: list[str] = []
        if recent_sessions:
            rolling_acc = sum(s.accuracy for s in recent_sessions) / len(recent_sessions)
            latest = recent_sessions[0]
            metrics_dict = None
            if latest.metrics:
                try:
                    metrics_dict = json.loads(latest.metrics) if isinstance(latest.metrics, str) else latest.metrics
                except Exception:
                    metrics_dict = None
            _, telemetry_notes = compute_telemetry_variance_modifiers(metrics_dict, latest.completed_at)

        # Fatigue detection: check sessions completed within the last 12 hours
        twelve_hours_ago = now - timedelta(hours=12)
        day_sessions = list(
            db.scalars(
                select(GameSession)
                .where(
                    GameSession.patient_id == patient_id,
                    GameSession.completed_at >= twelve_hours_ago,
                )
                .order_by(GameSession.completed_at.desc())
            ).all()
        )

        fatigue_detected = False
        if len(day_sessions) >= 3:
            latest_acc = day_sessions[0].accuracy
            prev_accs = [s.accuracy for s in day_sessions[1:]]
            avg_prev = sum(prev_accs) / len(prev_accs)
            if latest_acc < avg_prev - 15.0 or len(day_sessions) >= 4:
                fatigue_detected = True

        # Cached cognitive assessment check
        cog_profile = self.evaluate_cognition(db, patient_id, use_cache=True)
        overall_cog_score = cog_profile.get("overall_score")

        # 6. Compute recommendation using the statistical psychometric controller
        current_lvl = ability.last_level_played or prior_level
        rec = compute_difficulty_recommendation(
            theta=ability.theta,
            sigma=ability.sigma,
            current_level=current_lvl,
            max_level=max_level,
            n_sessions=ability.sessions_count,
            fatigue_detected=fatigue_detected,
            last_lowered_at=ability.last_lowered_at,
            manual_override_level=ability.manual_override_level,
            now=now,
            rolling_accuracy=rolling_acc,
            telemetry_notes=telemetry_notes,
        )

        # Supportive step-down if overall cognitive score is critically low
        if (
            not rec.get("manual_override_level")
            and overall_cog_score is not None
            and overall_cog_score < 50.0
            and rec["recommended_level"] > 2
            and not fatigue_detected
        ):
            rec["recommended_level"] = max(1, current_lvl - 1)
            rec["rationale"] = (
                f"Lowered to Level {rec['recommended_level']}: composite cognitive score "
                f"({overall_cog_score:.0f}/100) suggests supportive pacing"
            )
            rec["last_lowered_at"] = now

        # Update persisted ability record
        ability.last_recommended_level = rec["recommended_level"]
        if rec.get("last_lowered_at"):
            ability.last_lowered_at = rec["last_lowered_at"]
        db.commit()

        return rec


engine = CognitiveEngine()
