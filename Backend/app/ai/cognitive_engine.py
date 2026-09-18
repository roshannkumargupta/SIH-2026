import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.game import GameSession
from app.models.medication import MedicationLog, MedicationLogStatus
from app.models.task import Task, TaskStatus

logger = logging.getLogger("cognitive_engine")


class CognitiveEngine:
    def __init__(self):
        self.model = None
        self._load_external_model()

    def _load_external_model(self):
        try:
            from app.ai.ml_difficulty import resolve_model_file
            import joblib

            model_file = resolve_model_file()
            if model_file and os.path.isfile(model_file):
                self.model = joblib.load(model_file)
                logger.info(f"Loaded trained ML adaptive difficulty model from {model_file}")
            else:
                self.model = None
                logger.info("No trained ML model file found. Using resilient clinical heuristic engine.")
        except Exception as e:
            logger.warning(f"Could not load ML model: {e}. Using clinical heuristic engine.")
            self.model = None

    def evaluate_cognition(
        self,
        db: Session,
        patient_id: UUID,
    ) -> dict[str, Any]:
        """
        Calculates a comprehensive cognitive profile for the patient based on
        game scores, medication adherence, and task completions over the last 30 days.
        """
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)

        # 1. Fetch game sessions
        games = db.scalars(
            select(GameSession)
            .where(
                GameSession.patient_id == patient_id,
                GameSession.completed_at >= cutoff_date,
            )
        ).all()

        # 2. Fetch medication logs for adherence calculation
        med_logs = db.scalars(
            select(MedicationLog)
            .where(
                MedicationLog.patient_id == patient_id,
                MedicationLog.scheduled_at >= cutoff_date,
            )
        ).all()

        # 3. Fetch tasks for routine adherence
        tasks = db.scalars(
            select(Task)
            .where(
                Task.patient_id == patient_id,
                Task.created_at >= cutoff_date,
            )
        ).all()

        # Calculate domain performance
        memory_scores = [g.accuracy for g in games if g.game_type in ("memory_match", "word_recall")]
        attention_scores = [g.accuracy for g in games if g.game_type in ("pattern_sequence", "stroop_color")]
        executive_scores = [g.accuracy for g in games if g.game_type in ("math_challenge", "stroop_color")]
        language_scores = [g.accuracy for g in games if g.game_type == "word_recall"]

        # Adherence calculations
        total_meds = len(med_logs)
        taken_meds = sum(1 for m in med_logs if m.status == MedicationLogStatus.TAKEN)
        med_adherence = (taken_meds / total_meds * 100.0) if total_meds > 0 else 85.0

        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
        task_adherence = (completed_tasks / total_tasks * 100.0) if total_tasks > 0 else 85.0

        # Base scores (default to neutral baseline 75.0 if no games played yet)
        avg_mem = sum(memory_scores) / len(memory_scores) if memory_scores else (med_adherence * 0.8 + 15.0)
        avg_att = sum(attention_scores) / len(attention_scores) if attention_scores else (task_adherence * 0.8 + 15.0)
        avg_exec = sum(executive_scores) / len(executive_scores) if executive_scores else 75.0
        avg_lang = sum(language_scores) / len(language_scores) if language_scores else 75.0

        # Bound scores between 0 and 100
        mem_score = max(0.0, min(100.0, round(avg_mem, 1)))
        att_score = max(0.0, min(100.0, round(avg_att, 1)))
        exec_score = max(0.0, min(100.0, round(avg_exec, 1)))
        lang_score = max(0.0, min(100.0, round(avg_lang, 1)))

        # Composite overall cognitive score
        overall_score = round(
            (mem_score * 0.35)
            + (att_score * 0.25)
            + (exec_score * 0.25)
            + (lang_score * 0.15),
            1,
        )

        # Risk level determination
        if overall_score >= 80.0:
            risk_level = "low"
        elif overall_score >= 60.0:
            risk_level = "moderate"
        elif overall_score >= 40.0:
            risk_level = "high"
        else:
            risk_level = "critical"

        # Formulate insights and recommendations
        insights = []
        recommendations = []

        if mem_score < 65.0:
            insights.append("Short-term visual and routine recall is below expected baseline.")
            recommendations.append("Increase daily memory stimulation games and encourage daily journal review.")
        else:
            insights.append("Memory retention remains stable within normal variance.")

        if att_score < 65.0:
            insights.append("Attention span and sequence following showed minor decay.")
            recommendations.append("Engage in focused 10-minute pattern matching exercises twice daily.")

        if med_adherence < 80.0:
            insights.append(f"Medication adherence is at {med_adherence:.0f}%, which may impact cognitive consistency.")
            recommendations.append("Enable high-priority audio reminders for scheduled medication doses.")

        if risk_level in ("high", "critical"):
            recommendations.append("Schedule a comprehensive clinical assessment with the attending neurologist.")
        else:
            recommendations.append("Continue regular daily cognitive exercises and maintain physical activity.")

        return {
            "overall_score": overall_score,
            "risk_level": risk_level,
            "memory_score": mem_score,
            "attention_score": att_score,
            "executive_function_score": exec_score,
            "language_score": lang_score,
            "insights": insights,
            "recommendations": recommendations,
            "model_version": "v1.2-hybrid-clinical",
            "assessment_date": datetime.now(timezone.utc),
        }

    def recommend_level(
        self,
        db: Session,
        patient_id: UUID,
        game_id: str,
    ) -> dict[str, Any]:
        """
        Calculates an adaptive difficulty recommendation for a patient and specific game.
        Combines rolling accuracy over the last 5 sessions, latency trend, composite cognitive index,
        fatigue penalty, and baseline calibration prior.
        """
        from app.models.patient import PatientCalibration

        norm_game_id = game_id.replace("-", "_")
        hyphen_game_id = game_id.replace("_", "-")
        max_level = GAME_MAX_LEVELS.get(norm_game_id, GAME_MAX_LEVELS.get(hyphen_game_id, 10))

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

        # 2. Pull patient's last 5 completed sessions for this specific game
        specific_sessions = list(
            db.scalars(
                select(GameSession)
                .where(
                    GameSession.patient_id == patient_id,
                    (GameSession.game_id.in_([game_id, norm_game_id, hyphen_game_id]))
                    | (GameSession.game_type.in_([game_id, norm_game_id, hyphen_game_id])),
                )
                .order_by(GameSession.completed_at.desc())
                .limit(5)
            ).all()
        )

        # 3. If zero sessions for this game, check overall sessions or use calibration prior
        if not specific_sessions:
            all_recent_sessions = list(
                db.scalars(
                    select(GameSession)
                    .where(GameSession.patient_id == patient_id)
                    .order_by(GameSession.completed_at.desc())
                    .limit(5)
                ).all()
            )

            if not all_recent_sessions:
                return {
                    "recommended_level": prior_level,
                    "confidence": "low",
                    "rationale": (
                        "Baseline prior set from initial caregiver assessment"
                        if calibration
                        else "Default starting level for new activity"
                    ),
                    "based_on_sessions": 0,
                    "ai_difficulty_enabled": ai_enabled,
                    "model_type": "heuristic",
                }

            # General sessions fallback weighted lower
            mean_general_acc = sum(s.accuracy for s in all_recent_sessions) / len(all_recent_sessions)
            if mean_general_acc >= 85.0:
                gen_level = min(max_level, prior_level + 1)
                rationale = f"Started at level {gen_level} based on strong overall game performance ({mean_general_acc:.0f}%)"
            elif mean_general_acc < 50.0:
                gen_level = max(1, prior_level - 1)
                rationale = f"Started gently at level {gen_level} based on overall accuracy trend"
            else:
                gen_level = prior_level
                rationale = f"Initial level {gen_level} derived from overall activity baseline"

            return {
                "recommended_level": gen_level,
                "confidence": "low",
                "rationale": rationale,
                "based_on_sessions": len(all_recent_sessions),
                "ai_difficulty_enabled": ai_enabled,
                "model_type": "heuristic",
            }

        # 4. We have specific sessions for this game
        n_sessions = len(specific_sessions)
        current_level = specific_sessions[0].level_achieved

        # (a) Rolling accuracy (mean of last sessions' accuracy)
        rolling_acc = sum(s.accuracy for s in specific_sessions) / n_sessions

        # (b) Response latency trend
        latency_improving = True
        if n_sessions >= 2:
            latest_dur = specific_sessions[0].duration_seconds
            older_durs = [s.duration_seconds for s in specific_sessions[1:]]
            avg_older_dur = sum(older_durs) / len(older_durs)
            latency_improving = latest_dur <= (avg_older_dur * 1.15)

        # (c) Cognitive index (reuse evaluate_cognition scoring)
        cog_profile = self.evaluate_cognition(db, patient_id)
        overall_cog_score = cog_profile.get("overall_score", 75.0)

        # (d) Fatigue penalty: check sessions completed within the last 12 hours
        now = datetime.now(timezone.utc)
        recent_day_sessions = []
        for s in specific_sessions:
            if s.completed_at:
                dt = s.completed_at if s.completed_at.tzinfo else s.completed_at.replace(tzinfo=timezone.utc)
                if (now - dt).total_seconds() < 43200:
                    recent_day_sessions.append(s)

        fatigue_detected = False
        if len(recent_day_sessions) >= 3:
            latest_acc = recent_day_sessions[0].accuracy
            prev_accs = [s.accuracy for s in recent_day_sessions[1:]]
            avg_prev = sum(prev_accs) / len(prev_accs)
            if latest_acc < avg_prev - 15.0 or len(recent_day_sessions) >= 4:
                fatigue_detected = True

        # Check if trained ML difficulty model is active
        if self.model is not None:
            try:
                from app.ai.ml_difficulty import predict_adaptive_level
                ml_res = predict_adaptive_level(
                    model=self.model,
                    accuracy=rolling_acc,
                    duration_seconds=specific_sessions[0].duration_seconds,
                    level_achieved=current_level,
                    game_type=norm_game_id,
                    n_sessions=n_sessions,
                    fatigue_detected=fatigue_detected,
                    max_level=max_level,
                )
                ml_res["ai_difficulty_enabled"] = ai_enabled
                return ml_res
            except Exception as e:
                logger.warning(f"ML adaptive difficulty inference error: {e}. Falling back to clinical rules.")

        # Heuristic adjustment
        adjustment = 0
        if fatigue_detected:
            adjustment = -1
            rationale = "Lowered: recent session frequency indicates potential fatigue"
            confidence = "high" if n_sessions >= 3 else "medium"
        elif rolling_acc > 85.0 and (latency_improving or rolling_acc >= 90.0):
            adjustment = 1
            rationale = f"Raised: last {n_sessions} sessions averaged {rolling_acc:.0f}% accuracy"
            confidence = "high" if n_sessions >= 4 else "medium"
        elif rolling_acc < 50.0:
            adjustment = -1
            rationale = f"Lowered: recent accuracy ({rolling_acc:.0f}%) suggests gentler pace"
            confidence = "high" if n_sessions >= 3 else "medium"
        elif overall_cog_score < 50.0 and current_level > 2:
            adjustment = -1
            rationale = "Lowered: overall cognitive score suggests supportive level"
            confidence = "medium"
        else:
            adjustment = 0
            rationale = f"Maintained: consistent performance across {n_sessions} sessions"
            confidence = "high" if n_sessions >= 3 else "medium"

        recommended = max(1, min(max_level, current_level + adjustment))

        return {
            "recommended_level": recommended,
            "confidence": confidence,
            "rationale": rationale,
            "based_on_sessions": n_sessions,
            "ai_difficulty_enabled": ai_enabled,
            "model_type": "heuristic",
        }


# Backend mirror of maxLevel values defined in Frontend/src/features/games/data/gameRegistry.ts
# Source of truth: Frontend/src/features/games/data/gameRegistry.ts
GAME_MAX_LEVELS: dict[str, int] = {
    "water_jugs": 10,
    "tower_of_hanoi": 10,
    "ball_sort": 10,
    "n_back": 10,
    "logic_puzzles": 10,
    "stroop": 10,
    "mental_rotation": 10,
    "schulte_table": 10,
    "maze": 10,
    "pattern_matrix": 10,
    "quick_math": 10,
    "word_scramble": 10,
    "simon_says": 10,
    "card_matching": 10,
    "reaction_time": 10,
    "number_sequence": 10,
    "dual_task": 10,
    "visual_search": 10,
    "anagram_solver": 10,
    "trail_making": 10,
    "working_memory_grid": 10,
    "delayed_recall": 10,
    "daily_routine_recall": 10,
    "cultural_object_recognition": 10,
}

engine = CognitiveEngine()

