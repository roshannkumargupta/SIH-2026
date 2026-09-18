"""
SmritiSetu - Adaptive Game Difficulty Model Training Script
Trains a scikit-learn GradientBoostingClassifier on clinical cognitive telemetry
and serializes the pipeline to the configured ML model directory.
"""
import logging
import os
import sys

# Ensure Backend root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ai.ml_difficulty import train_and_save_model, resolve_model_file

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_model")


def main():
    logger.info("Starting SmritiSetu Adaptive Difficulty Model Training...")
    saved_path = train_and_save_model()
    logger.info(f"Model successfully saved to: {saved_path}")

    # Verify model resolution
    resolved = resolve_model_file()
    logger.info(f"Verified model resolution check: {resolved}")
    print(f"\n[OK] Adaptive Difficulty ML Model ready at: {saved_path}\n")


if __name__ == "__main__":
    main()
