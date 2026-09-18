import os
import tempfile
import joblib
import pandas as pd
import pytest

from app.ai.ml_difficulty import (
    ALL_GAME_TYPES,
    MODEL_FILENAME,
    create_training_pipeline,
    generate_training_dataset,
    prepare_features,
    predict_adaptive_level,
    train_and_save_model,
    resolve_model_file,
)


def test_game_types_count():
    assert len(ALL_GAME_TYPES) == 24
    assert "daily_routine_recall" in ALL_GAME_TYPES
    assert "cultural_object_recognition" in ALL_GAME_TYPES


def test_prepare_features():
    df = prepare_features(
        accuracy=95.5,
        duration_seconds=42.0,
        level_achieved=3,
        game_type="daily-routine-recall",
    )
    assert isinstance(df, pd.DataFrame)
    assert df.shape == (1, 4)
    row = df.iloc[0]
    assert row["accuracy"] == 95.5
    assert row["duration_seconds"] == 42.0
    assert row["level_achieved"] == 3
    assert row["game_type"] == "daily_routine_recall"


def test_dataset_generation():
    X, y = generate_training_dataset(samples_per_game=10)
    assert len(X) == 24 * 10
    assert len(y) == 24 * 10
    assert set(X.columns) == {"accuracy", "duration_seconds", "level_achieved", "game_type"}
    assert y.min() >= 1
    assert y.max() <= 10


def test_train_and_predict_in_temp_dir():
    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = os.path.join(tmpdir, MODEL_FILENAME)
        saved_path = train_and_save_model(custom_path=model_path)
        assert os.path.isfile(saved_path)

        loaded_model = joblib.load(saved_path)
        assert loaded_model is not None

        # Test normal high accuracy inference
        pred = predict_adaptive_level(
            model=loaded_model,
            accuracy=92.0,
            duration_seconds=30.0,
            level_achieved=2,
            game_type="water_jugs",
            n_sessions=4,
            fatigue_detected=False,
            max_level=10,
        )
        assert 1 <= pred["recommended_level"] <= 10
        assert pred["confidence"] in ["high", "medium", "low"]
        assert pred["model_type"] == "ml"
        assert pred["ai_difficulty_enabled"] is True

        # Test fatigue override
        fatigue_pred = predict_adaptive_level(
            model=loaded_model,
            accuracy=40.0,
            duration_seconds=110.0,
            level_achieved=4,
            game_type="water_jugs",
            n_sessions=4,
            fatigue_detected=True,
            max_level=10,
        )
        assert fatigue_pred["recommended_level"] <= 4
        assert "fatigue" in fatigue_pred["rationale"].lower()
