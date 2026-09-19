"""
Statistical Ability Controller v2.0
====================================

A transparent Bayesian / Elo-style per-patient, per-game psychometric ability
estimator. Replaces black-box synthetic GradientBoosting classifiers with an
interpretable, defensible statistical controller grounded in Item Response Theory (IRT).

Key Principles
--------------
1. **Target Challenge Zone**: Targets an expected success rate of 75%–80% (centered
   at 77.5%), rather than premature 100% mastery or frustrating failure.
2. **Bayesian State Tracking**: Maintains a belief state (theta, sigma) for each
   patient-game pair. Theta represents latent capability on the [1.0, max_level] scale;
   sigma represents uncertainty (standard error).
3. **Multi-Feature Telemetry Ingestion**:
   - Accuracy vs. expected accuracy at the level played
   - Reaction-time variance & response stability
   - Error patterns & mistake severity
   - Circadian diurnal effects (evening sundowning vs. morning peak)
   - Forgetting drift (inactivity intervals ≥ 7 days)
4. **Clinical Safety Guard-Rails**:
   - Max 1 level step per session (no double-jumps)
   - 30-minute anti-oscillation cooldown (never raise level within 30 min of a lowering)
   - Strict caregiver manual override support per game
"""

import logging
import math
import os
from datetime import datetime, timezone
from typing import Any, Final

from app.ai.game_domain_mapping import ALL_GAMES

logger = logging.getLogger("statistical_difficulty")

# Canonical list of games (alias for backwards compatibility)
ALL_GAME_TYPES: Final[list[str]] = [g.replace("-", "_") for g in ALL_GAMES]
MODEL_FILENAME = "statistical_controller.json"

# Controller hyper-parameters
TARGET_ACCURACY: Final[float] = 0.775  # Centered in 75%-80% zone
LOGIT_TARGET: Final[float] = math.log(TARGET_ACCURACY / (1.0 - TARGET_ACCURACY))  # ~1.237
DISCRIMINATION_ALPHA: Final[float] = 0.60
BASE_OBS_VARIANCE: Final[float] = 0.22
PROCESS_VARIANCE_Q: Final[float] = 0.08  # Cognitive dynamic learning / session transition variance
INITIAL_SIGMA: Final[float] = 1.50
MIN_SIGMA: Final[float] = 0.30
MAX_SIGMA: Final[float] = 2.00
COOLDOWN_MINUTES: Final[int] = 30


# ---------------------------------------------------------------------------
# Psychometric response model
# ---------------------------------------------------------------------------

def expected_accuracy(
    theta: float,
    level: int,
    alpha: float = DISCRIMINATION_ALPHA,
    target_p: float = TARGET_ACCURACY,
) -> float:
    """
    Calculate expected accuracy A in (0.0, 1.0) for a patient with ability theta
    playing at game level L.

    When theta == level, expected accuracy equals target_p (77.5%).
    When theta > level, expected accuracy > 77.5%.
    When theta < level, expected accuracy < 77.5%.
    """
    logit_p = math.log(target_p / (1.0 - target_p))
    z = alpha * (theta - float(level)) + logit_p
    # Clamp z to avoid numerical overflow
    z_clamped = max(-10.0, min(10.0, z))
    return 1.0 / (1.0 + math.exp(-z_clamped))


# ---------------------------------------------------------------------------
# Feature extraction & telemetry variance modulation
# ---------------------------------------------------------------------------

def compute_telemetry_variance_modifiers(
    metrics: dict[str, Any] | None,
    completed_at: datetime | None,
    duration_seconds: float = 60.0,
) -> tuple[float, list[str]]:
    """
    Evaluates expanded telemetry beyond raw accuracy:
    - Reaction-time variance / lapses
    - Error patterns / mistakes
    - Circadian time-of-day (sundowning)
    Returns (variance_penalty, telemetry_notes).
    """
    var_mod = 0.0
    notes: list[str] = []

    # 1. Circadian time-of-day (Sundowning effect common in elderly/MCI patients)
    if completed_at:
        dt = completed_at if completed_at.tzinfo else completed_at.replace(tzinfo=timezone.utc)
        hour = dt.hour
        if hour >= 17 or hour < 6:
            var_mod += 0.08
            notes.append("evening diurnal factor observed")

    if not metrics:
        return var_mod, notes

    # 2. Reaction time analysis
    rt = metrics.get("reaction_time_ms")
    rt_variance = metrics.get("reaction_time_variance") or metrics.get("rt_variance")
    if rt_variance is not None and float(rt_variance) > 50000.0:
        var_mod += 0.10
        notes.append("high reaction-time variance (attentional fluctuation)")
    elif rt is not None and float(rt) > 2500.0:
        var_mod += 0.05
        notes.append("prolonged response latency")

    # 3. Error count and error type analysis
    mistakes = metrics.get("mistakes") or metrics.get("errors") or 0
    error_type = metrics.get("error_type")
    if error_type in ("perseverative", "repetition", "omission"):
        var_mod += 0.08
        notes.append(f"repeated {error_type} error pattern")
    elif int(mistakes) >= 4:
        var_mod += 0.06
        notes.append("elevated error cluster")

    return var_mod, notes


# ---------------------------------------------------------------------------
# Bayesian State Update
# ---------------------------------------------------------------------------

def update_ability_state(
    current_theta: float,
    current_sigma: float,
    accuracy: float,
    level_played: int,
    metrics: dict[str, Any] | None = None,
    completed_at: datetime | None = None,
    last_session_at: datetime | None = None,
    max_level: int = 10,
) -> tuple[float, float, float, float]:
    """
    Updates patient ability (theta, sigma) following a completed session.

    Returns:
        (new_theta, new_sigma, expected_acc, residual_delta)
    """
    # 1. State transition variance (cognitive learning/volatility) & forgetting drift
    sigma_sq = (current_sigma ** 2) + PROCESS_VARIANCE_Q
    if completed_at and last_session_at:
        t_curr = completed_at if completed_at.tzinfo else completed_at.replace(tzinfo=timezone.utc)
        t_prev = last_session_at if last_session_at.tzinfo else last_session_at.replace(tzinfo=timezone.utc)
        days_gap = max(0.0, (t_curr - t_prev).total_seconds() / 86400.0)
        if days_gap >= 7.0:
            drift = min(0.5, 0.04 * (days_gap - 7.0))
            sigma_sq += drift

    # 2. Expected accuracy at level played
    exp_acc = expected_accuracy(current_theta, level_played)
    obs_acc = max(0.0, min(100.0, accuracy)) / 100.0
    delta = obs_acc - exp_acc

    # 3. Observation variance modulated by expanded features
    var_mod, _ = compute_telemetry_variance_modifiers(metrics, completed_at)
    obs_variance = BASE_OBS_VARIANCE + var_mod

    # 4. Kalman gain
    k_gain = sigma_sq / (sigma_sq + obs_variance)

    # 5. Updated theta (clamped to level range)
    shift = k_gain * (delta / DISCRIMINATION_ALPHA)
    new_theta = max(1.0, min(float(max_level), current_theta + shift))

    # 6. Updated uncertainty sigma
    new_sigma_sq = (1.0 - k_gain) * sigma_sq
    new_sigma = max(MIN_SIGMA, min(MAX_SIGMA, math.sqrt(max(1e-4, new_sigma_sq))))

    return (
        round(new_theta, 3),
        round(new_sigma, 3),
        round(exp_acc, 3),
        round(delta, 3),
    )


# ---------------------------------------------------------------------------
# Recommendation Engine with Clinical Guardrails
# ---------------------------------------------------------------------------

def compute_difficulty_recommendation(
    theta: float,
    sigma: float,
    current_level: int,
    max_level: int,
    n_sessions: int,
    fatigue_detected: bool = False,
    last_lowered_at: datetime | None = None,
    manual_override_level: int | None = None,
    now: datetime | None = None,
    rolling_accuracy: float | None = None,
    telemetry_notes: list[str] | None = None,
) -> dict[str, Any]:
    """
    Computes difficulty recommendation with strict safety guardrails:
    - Never move more than one level per session.
    - Never raise a level within 30 minutes of a lowering.
    - Strict adherence to manual caregiver overrides.
    - Targeting 75-80% success zone.
    """
    current_time = now or datetime.now(timezone.utc)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)

    # Confidence rating based on uncertainty sigma and session depth
    if sigma <= 0.85 and n_sessions >= 3:
        confidence = "high"
    elif sigma <= 1.15 and n_sessions >= 2:
        confidence = "medium"
    else:
        confidence = "low"

    # Guardrail 1: Manual Caregiver Override takes strict precedence
    if manual_override_level is not None and 1 <= manual_override_level <= max_level:
        return {
            "recommended_level": manual_override_level,
            "confidence": "high",
            "rationale": f"Manual caregiver override active (Level {manual_override_level})",
            "based_on_sessions": n_sessions,
            "ai_difficulty_enabled": True,
            "model_type": "statistical_controller",
            "theta": round(theta, 2),
            "sigma": round(sigma, 2),
            "manual_override_level": manual_override_level,
            "cooldown_active": False,
            "last_lowered_at": last_lowered_at,
        }

    # Guardrail 2: 30-Minute Cooldown Check
    cooldown_active = False
    if last_lowered_at:
        dt_lowered = last_lowered_at if last_lowered_at.tzinfo else last_lowered_at.replace(tzinfo=timezone.utc)
        elapsed_minutes = (current_time - dt_lowered).total_seconds() / 60.0
        if elapsed_minutes < COOLDOWN_MINUTES:
            cooldown_active = True

    # Compute raw target level from theta
    raw_target = int(round(theta))
    raw_target = max(1, min(max_level, raw_target))

    # Guardrail 3: Max 1 level step per session
    delta = max(-1, min(1, raw_target - current_level))
    proposed_level = max(1, min(max_level, current_level + delta))

    new_lowered_at = last_lowered_at

    # Fatigue penalty overrides upward or maintained requests
    if fatigue_detected:
        proposed_level = max(1, current_level - 1)
        new_lowered_at = current_time
        rationale = "Lowered: recent session telemetry indicates potential fatigue"
    elif cooldown_active and proposed_level > current_level:
        # Guardrail 4: Never raise within 30 min of lowering
        proposed_level = current_level
        rationale = (
            f"Maintained at Level {current_level}: level increase held during "
            f"{COOLDOWN_MINUTES}-minute recovery cooldown after recent step-down"
        )
    elif proposed_level > current_level:
        acc_str = f" ({rolling_accuracy:.0f}% accuracy)" if rolling_accuracy is not None else ""
        rationale = (
            f"Raised: steady performance{acc_str} indicates readiness for Level {proposed_level} "
            f"(target 75-80% challenge band, θ={theta:.2f})"
        )
    elif proposed_level < current_level:
        new_lowered_at = current_time
        acc_str = f" ({rolling_accuracy:.0f}% accuracy)" if rolling_accuracy is not None else ""
        rationale = (
            f"Lowered: recent performance{acc_str} suggests Level {proposed_level} to maintain supportive challenge"
        )
    else:
        rationale = (
            f"Maintained: consistent performance at Level {current_level} within target 75-80% band (θ={theta:.2f})"
        )

    # Append any telemetry observations (RT variance, sundowning)
    if telemetry_notes:
        rationale += f" [{'; '.join(telemetry_notes)}]"

    return {
        "recommended_level": proposed_level,
        "confidence": confidence,
        "rationale": rationale,
        "based_on_sessions": n_sessions,
        "ai_difficulty_enabled": True,
        "model_type": "statistical_controller",
        "theta": round(theta, 2),
        "sigma": round(sigma, 2),
        "manual_override_level": None,
        "cooldown_active": cooldown_active,
        "last_lowered_at": new_lowered_at,
    }


# ---------------------------------------------------------------------------
# Compatibility interface & legacy ML training pipeline support
# ---------------------------------------------------------------------------

def get_model_target_path(custom_path: str | None = None) -> str:
    """Resolves target path for legacy ML model serialization."""
    from app.core.config import settings
    raw_path = custom_path or getattr(settings, "ML_MODEL_PATH", "ml/models")
    abs_path = os.path.abspath(raw_path)

    if abs_path.endswith(".joblib") or abs_path.endswith(".json"):
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        return abs_path

    os.makedirs(abs_path, exist_ok=True)
    return os.path.join(abs_path, MODEL_FILENAME)


def resolve_model_file(custom_path: str | None = None) -> str | None:
    """Statistical controller does not require an opaque serialized model file."""
    return None


def create_training_pipeline():
    """Constructs a scikit-learn Pipeline for legacy tests."""
    from sklearn.compose import ColumnTransformer
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder, StandardScaler

    num_features = ["accuracy", "duration_seconds", "level_achieved"]
    cat_features = ["game_type"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_features),
            ("cat", OneHotEncoder(categories=[ALL_GAME_TYPES], handle_unknown="ignore", sparse_output=False), cat_features),
        ]
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                GradientBoostingClassifier(
                    n_estimators=30,
                    learning_rate=0.1,
                    max_depth=3,
                    random_state=42,
                ),
            ),
        ]
    )
    return pipeline


def prepare_features(
    accuracy: float,
    duration_seconds: float,
    level_achieved: int,
    game_type: str,
):
    """Prepares single-row DataFrame for legacy feature schema."""
    import pandas as pd
    norm_game = game_type.replace("-", "_")
    return pd.DataFrame(
        [
            {
                "accuracy": float(max(0.0, min(100.0, accuracy))),
                "duration_seconds": float(max(1.0, duration_seconds)),
                "level_achieved": int(max(1, min(10, level_achieved))),
                "game_type": norm_game,
            }
        ]
    )


def generate_training_dataset(samples_per_game: int = 50):
    """Generates synthetic training dataset for legacy ML tests."""
    import numpy as np
    import pandas as pd

    rng = np.random.RandomState(42)
    rows: list[dict[str, Any]] = []
    targets: list[int] = []

    for game in ALL_GAME_TYPES:
        for _ in range(samples_per_game):
            level = int(rng.randint(1, 11))
            cluster = rng.choice(["high", "moderate", "struggling"], p=[0.4, 0.4, 0.2])
            if cluster == "high":
                accuracy = float(rng.uniform(85.0, 100.0))
                duration = float(rng.uniform(15.0, 60.0))
                target = min(10, level + 1)
            elif cluster == "struggling":
                accuracy = float(rng.uniform(20.0, 49.0))
                duration = float(rng.uniform(60.0, 150.0))
                target = max(1, level - 1)
            else:
                accuracy = float(rng.uniform(50.0, 84.0))
                duration = float(rng.uniform(30.0, 90.0))
                target = level

            rows.append({
                "accuracy": accuracy,
                "duration_seconds": duration,
                "level_achieved": level,
                "game_type": game,
            })
            targets.append(target)

    return pd.DataFrame(rows), pd.Series(targets, dtype=int)


def train_and_save_model(custom_path: str | None = None) -> str:
    """Trains and serializes model for legacy pipeline testing."""
    import joblib
    target_path = get_model_target_path(custom_path)
    X, y = generate_training_dataset(samples_per_game=2)
    pipeline = create_training_pipeline()
    pipeline.fit(X, y)
    joblib.dump(pipeline, target_path)
    logger.info("Successfully trained and saved adaptive difficulty model to %s", target_path)
    return target_path


def predict_adaptive_level(
    model: Any,
    accuracy: float,
    duration_seconds: float,
    level_achieved: int,
    game_type: str,
    n_sessions: int,
    fatigue_detected: bool = False,
    max_level: int = 10,
) -> dict[str, Any]:
    """Compatibility interface delegating to statistical psychometric controller."""
    # Derive instantaneous theta estimate from accuracy at level achieved
    theta_est = float(level_achieved) + (accuracy - 77.5) / 25.0
    sigma_est = max(0.4, 1.5 / math.sqrt(max(1, n_sessions)))
    rec = compute_difficulty_recommendation(
        theta=theta_est,
        sigma=sigma_est,
        current_level=level_achieved,
        max_level=max_level,
        n_sessions=n_sessions,
        fatigue_detected=fatigue_detected,
        rolling_accuracy=accuracy,
    )
    rec["model_type"] = "ml"
    return rec
