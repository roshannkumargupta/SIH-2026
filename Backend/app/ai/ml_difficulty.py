import logging
import os
from datetime import datetime, timezone
from typing import Any, Literal
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.core.config import settings

logger = logging.getLogger("ml_difficulty")

# Standard list of all cognitive games in SmritiSetu
ALL_GAME_TYPES = [
    "water_jugs",
    "tower_of_hanoi",
    "ball_sort",
    "n_back",
    "logic_puzzles",
    "stroop",
    "mental_rotation",
    "schulte_table",
    "maze",
    "pattern_matrix",
    "quick_math",
    "word_scramble",
    "simon_says",
    "card_matching",
    "reaction_time",
    "number_sequence",
    "dual_task",
    "visual_search",
    "anagram_solver",
    "trail_making",
    "working_memory_grid",
    "delayed_recall",
    "daily_routine_recall",
    "cultural_object_recognition",
]

MODEL_FILENAME = "adaptive_difficulty_model.joblib"


def get_model_target_path(custom_path: str | None = None) -> str:
    """
    Resolves the exact file path where the joblib model should be saved.
    Supports either a directory (e.g. '../ml/models') or a direct file path.
    """
    raw_path = custom_path or settings.ML_MODEL_PATH
    abs_path = os.path.abspath(raw_path)

    if abs_path.endswith(".joblib"):
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        return abs_path

    os.makedirs(abs_path, exist_ok=True)
    return os.path.join(abs_path, MODEL_FILENAME)


def resolve_model_file(custom_path: str | None = None) -> str | None:
    """
    Searches for the trained ML model file in settings.ML_MODEL_PATH and common repository locations.
    Returns the absolute path if found, or None if not yet trained.
    """
    raw_path = custom_path or settings.ML_MODEL_PATH
    candidates = [
        raw_path,
        os.path.abspath(raw_path),
        os.path.join(raw_path, MODEL_FILENAME),
        os.path.join(os.path.abspath(raw_path), MODEL_FILENAME),
    ]

    # Also check relative to Backend and project root
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    repo_root = os.path.abspath(os.path.join(backend_dir, ".."))
    candidates.extend([
        os.path.join(repo_root, "ml", "models", MODEL_FILENAME),
        os.path.join(backend_dir, "ml", "models", MODEL_FILENAME),
        os.path.join(backend_dir, raw_path, MODEL_FILENAME),
    ])

    for cand in candidates:
        if cand and os.path.isfile(cand):
            return os.path.abspath(cand)
    return None


def create_training_pipeline() -> Pipeline:
    """
    Constructs a lightweight scikit-learn Pipeline with:
    - StandardScaler for numerical game telemetry (accuracy, duration, current level)
    - OneHotEncoder for game_type
    - GradientBoostingClassifier to predict optimal next difficulty level (1 to 10)
    """
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
                    n_estimators=60,
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
) -> pd.DataFrame:
    """
    Prepares a single-row DataFrame for inference matching model schema.
    """
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
    """
    Runs inference through the trained scikit-learn model and formats clinical rationale.
    """
    features_df = prepare_features(accuracy, duration_seconds, level_achieved, game_type)

    try:
        predicted = model.predict(features_df)[0]
        rec_level = int(np.clip(int(predicted), 1, max_level))
    except Exception as e:
        logger.warning(f"ML inference error: {e}. Defaulting to level adjustment math.")
        if accuracy >= 85.0:
            rec_level = min(max_level, level_achieved + 1)
        elif accuracy < 50.0:
            rec_level = max(1, level_achieved - 1)
        else:
            rec_level = level_achieved

    # Clinical safety rule: If fatigue is detected, step down or maintain
    if fatigue_detected:
        rec_level = max(1, min(rec_level, level_achieved - 1))
        rationale = "Lowered: recent session frequency indicates potential fatigue"
        confidence = "high" if n_sessions >= 3 else "medium"
    else:
        delta = rec_level - level_achieved
        if delta > 0:
            rationale = f"Raised: last {n_sessions} sessions averaged {accuracy:.0f}% accuracy"
            confidence = "high" if n_sessions >= 4 else "medium"
        elif delta < 0:
            rationale = f"Lowered: recent accuracy ({accuracy:.0f}%) suggests gentler pace"
            confidence = "high" if n_sessions >= 3 else "medium"
        else:
            rationale = f"Maintained: consistent performance across {n_sessions} sessions"
            confidence = "high" if n_sessions >= 3 else "medium"

    return {
        "recommended_level": rec_level,
        "confidence": confidence,
        "rationale": rationale,
        "based_on_sessions": n_sessions,
        "ai_difficulty_enabled": True,
        "model_type": "ml",
    }


def generate_training_dataset(samples_per_game: int = 50) -> tuple[pd.DataFrame, pd.Series]:
    """
    Generates synthetic training dataset modeling cognitive game progressions:
    - High accuracy (>85%) -> level + 1
    - Poor accuracy (<50%) -> level - 1
    - Moderate accuracy -> level
    With realistic duration and noise distributions.
    """
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
    """
    Trains the scikit-learn GradientBoosting adaptive difficulty model and serializes it via joblib.
    Returns the absolute path to the saved model file.
    """
    target_path = get_model_target_path(custom_path)
    X, y = generate_training_dataset()
    pipeline = create_training_pipeline()
    pipeline.fit(X, y)
    joblib.dump(pipeline, target_path)
    logger.info(f"Successfully trained and saved adaptive difficulty model to {target_path}")
    return target_path
