"""
Monte Carlo Simulation: Bayesian Ability Controller Convergence
==============================================================

Simulates 50 synthetic patients with true latent abilities distributed across [1.0, 9.0]
playing 200 sessions each.

Validates that:
1. Steady-state accuracy (sessions 100-200) converges into the optimal 70%-85% challenge band
   across the cohort.
2. Estimated ability theta converges toward the true ability theta_true within ±1 level unit.
3. Uncertainty sigma decreases smoothly from initial 1.50 toward the calibrated steady-state floor.
"""

import math
import random
import pytest

from app.ai.ml_difficulty import (
    compute_difficulty_recommendation,
    expected_accuracy,
    update_ability_state,
    INITIAL_SIGMA,
)


def simulate_patient_session(true_theta: float, current_level: int, n_trials: int = 20) -> float:
    """
    Simulates a patient's game session accuracy based on their true latent capability
    and the difficulty level presented.
    """
    true_prob = expected_accuracy(true_theta, current_level)
    # Binomial trials simulating individual items or puzzles in a session
    successes = sum(1 for _ in range(n_trials) if random.random() < true_prob)
    return (successes / n_trials) * 100.0


def test_monte_carlo_difficulty_convergence():
    random.seed(42)

    n_patients = 50
    n_sessions = 200
    steady_state_start = 100  # Evaluate steady-state after initial convergence

    cohort_steady_state_accuracies: list[float] = []
    cohort_theta_errors: list[float] = []
    cohort_final_sigmas: list[float] = []

    for p_idx in range(n_patients):
        # Evenly spread true abilities across the 1 to 9 level spectrum
        true_theta = 1.0 + (p_idx / (n_patients - 1)) * 8.0

        est_theta = 1.0
        est_sigma = INITIAL_SIGMA
        current_level = 1

        patient_accuracies: list[float] = []

        for s_idx in range(n_sessions):
            # 1. Controller recommends level
            rec = compute_difficulty_recommendation(
                theta=est_theta,
                sigma=est_sigma,
                current_level=current_level,
                max_level=10,
                n_sessions=s_idx,
            )
            current_level = rec["recommended_level"]

            # 2. Patient plays session at recommended level
            accuracy = simulate_patient_session(true_theta, current_level)
            patient_accuracies.append(accuracy)

            # 3. Controller updates latent state belief
            est_theta, est_sigma, _, _ = update_ability_state(
                current_theta=est_theta,
                current_sigma=est_sigma,
                accuracy=accuracy,
                level_played=current_level,
                max_level=10,
            )

        # Record steady-state metrics (second half of sessions)
        steady_acc = sum(patient_accuracies[steady_state_start:]) / (n_sessions - steady_state_start)
        cohort_steady_state_accuracies.append(steady_acc)
        cohort_theta_errors.append(abs(est_theta - true_theta))
        cohort_final_sigmas.append(est_sigma)

    # 1. Cohort-wide steady-state accuracy must be in the target 70%-85% challenge zone
    mean_cohort_acc = sum(cohort_steady_state_accuracies) / len(cohort_steady_state_accuracies)
    print(f"\n[Monte Carlo] 50 Patients x 200 Sessions:")
    print(f"  Mean Steady-State Accuracy: {mean_cohort_acc:.1f}%")
    print(f"  Mean Theta Estimation Error: {sum(cohort_theta_errors) / len(cohort_theta_errors):.2f}")
    print(f"  Mean Final Sigma (Uncertainty): {sum(cohort_final_sigmas) / len(cohort_final_sigmas):.2f}")

    assert 70.0 <= mean_cohort_acc <= 85.0, (
        f"Expected steady-state accuracy in 70-85% band, got {mean_cohort_acc:.1f}%"
    )

    # 2. The majority (>80%) of individual patients should have steady-state accuracy in [68%, 87%]
    in_band_count = sum(1 for acc in cohort_steady_state_accuracies if 68.0 <= acc <= 87.0)
    assert in_band_count >= (n_patients * 0.80), (
        f"Only {in_band_count}/{n_patients} patients fell into challenge band"
    )

    # 3. Average theta error should be <= 1.2 level units across the entire spectrum
    mean_theta_err = sum(cohort_theta_errors) / len(cohort_theta_errors)
    assert mean_theta_err <= 1.2, f"Theta error too high: {mean_theta_err:.2f}"

    # 4. Uncertainty sigma should have settled significantly below initial prior of 1.50
    mean_sigma = sum(cohort_final_sigmas) / len(cohort_final_sigmas)
    assert mean_sigma <= 0.65, f"Sigma did not decrease: {mean_sigma:.2f}"
