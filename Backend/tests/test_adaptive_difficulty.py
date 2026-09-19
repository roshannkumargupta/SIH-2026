from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.ai.cognitive_engine import engine
from app.models.game import GameSession
from app.models.patient import PatientCalibration


def test_adaptive_level_insufficient_history(db, patient_user):
    patient_id = patient_user["user"].id

    # No sessions exist yet
    rec = engine.recommend_level(db, patient_id, "daily-routine-recall")
    assert rec["recommended_level"] == 1
    assert rec["confidence"] == "low"
    assert rec["based_on_sessions"] == 0
    assert "starting level" in rec["rationale"].lower() or "baseline" in rec["rationale"].lower()


def test_adaptive_level_calibration_prior(db, patient_user):
    patient_id = patient_user["user"].id

    # Create caregiver baseline calibration with medium difficulty
    cal = PatientCalibration(
        patient_id=patient_id,
        total_score=11,
        initial_difficulty="medium",
        ai_difficulty_enabled=True,
    )
    db.add(cal)
    db.commit()

    # 0 sessions played, should recommend level 3 from calibration prior
    rec = engine.recommend_level(db, patient_id, "daily-routine-recall")
    assert rec["recommended_level"] == 3
    assert rec["confidence"] == "low"
    assert rec["based_on_sessions"] == 0
    assert rec["ai_difficulty_enabled"] is True


def test_adaptive_level_high_accuracy_increases_level(db, patient_user):
    patient_id = patient_user["user"].id
    now = datetime.now(timezone.utc)

    # Patient completed 4 sessions at level 2 with high accuracy (90-95%)
    for i in range(4):
        s = GameSession(
            patient_id=patient_id,
            game_id="card-matching",
            game_type="card_matching",
            score=95,
            accuracy=92.0,
            duration_seconds=60 - i * 5,  # Latency improving
            difficulty="2",
            level_achieved=2,
            completed_at=now - timedelta(days=4 - i),
        )
        db.add(s)
    db.commit()

    rec = engine.recommend_level(db, patient_id, "card-matching")
    assert rec["recommended_level"] == 3  # Increased from 2 to 3
    assert rec["confidence"] == "high"
    assert rec["based_on_sessions"] == 4
    assert "raised" in rec["rationale"].lower()


def test_adaptive_level_low_accuracy_decreases_level(db, patient_user):
    patient_id = patient_user["user"].id
    now = datetime.now(timezone.utc)

    # Patient completed 3 sessions at level 4 with low accuracy (35-45%)
    for i in range(3):
        s = GameSession(
            patient_id=patient_id,
            game_id="simon-says",
            game_type="simon_says",
            score=40,
            accuracy=42.0,
            duration_seconds=90,
            difficulty="4",
            level_achieved=4,
            completed_at=now - timedelta(days=3 - i),
        )
        db.add(s)
    db.commit()

    rec = engine.recommend_level(db, patient_id, "simon-says")
    assert rec["recommended_level"] == 3  # Decreased from 4 to 3
    assert rec["confidence"] == "high"
    assert "lowered" in rec["rationale"].lower()


def test_adaptive_level_fatigue_penalty(db, patient_user):
    patient_id = patient_user["user"].id
    now = datetime.now(timezone.utc)

    # Patient played 3 times earlier today with good accuracy (~80%)
    for i in range(3):
        s = GameSession(
            patient_id=patient_id,
            game_id="daily-routine-recall",
            game_type="daily_routine_recall",
            score=80,
            accuracy=80.0,
            duration_seconds=70,
            difficulty="3",
            level_achieved=3,
            completed_at=now - timedelta(hours=3 - i),
        )
        db.add(s)

    # 4th session completed minutes ago with a sharp drop to 40%
    latest = GameSession(
        patient_id=patient_id,
        game_id="daily-routine-recall",
        game_type="daily_routine_recall",
        score=30,
        accuracy=40.0,
        duration_seconds=120,
        difficulty="3",
        level_achieved=3,
        completed_at=now - timedelta(minutes=10),
    )
    db.add(latest)
    db.commit()

    rec = engine.recommend_level(db, patient_id, "daily-routine-recall")
    assert rec["recommended_level"] == 2  # Scaled down to prevent frustration
    assert "fatigue" in rec["rationale"].lower()


def test_adaptive_level_api_endpoint(client, patient_user, caretaker_user, setup_relationships):
    patient_id = str(patient_user["user"].id)

    # 1. Patient access own adaptive level
    res = client.get(
        f"/api/v1/games/adaptive-level/{patient_id}/cultural-object-recognition",
        headers=patient_user["headers"],
    )
    assert res.status_code == 200
    data = res.json()
    assert "recommended_level" in data
    assert "confidence" in data
    assert "rationale" in data
    assert data["based_on_sessions"] == 0

    # 2. Caretaker with relationship access
    res_ct = client.get(
        f"/api/v1/games/adaptive-level/{patient_id}/cultural-object-recognition",
        headers=caretaker_user["headers"],
    )
    assert res_ct.status_code == 200

    # 3. Unrelated patient tries to access -> 403
    unrelated_user_id = str(uuid4())
    res_forbidden = client.get(
        f"/api/v1/games/adaptive-level/{unrelated_user_id}/cultural-object-recognition",
        headers=patient_user["headers"],
    )
    assert res_forbidden.status_code == 403


def test_calibration_api_endpoints(client, patient_user, caretaker_user, setup_relationships):
    patient_id = str(patient_user["user"].id)

    # 1. Save calibration
    payload = {
        "total_score": 10,
        "initial_difficulty": "medium",
        "note": None,
        "answers": [
            {"question_id": "Q1", "selected_option_id": "Q1_A"},
            {"question_id": "Q2", "selected_option_id": "Q2_B"},
            {"question_id": "Q3", "selected_option_id": "Q3_A"},
            {"question_id": "Q4", "selected_option_id": "Q4_A"},
        ],
        "ai_difficulty_enabled": True,
    }
    save_res = client.post(
        f"/api/v1/patients/{patient_id}/calibration",
        headers=caretaker_user["headers"],
        json=payload,
    )
    assert save_res.status_code == 200
    cal_data = save_res.json()
    assert cal_data["total_score"] == 10
    assert cal_data["initial_difficulty"] == "medium"
    assert cal_data["ai_difficulty_enabled"] is True

    # 2. Retrieve calibration
    get_res = client.get(
        f"/api/v1/patients/{patient_id}/calibration",
        headers=patient_user["headers"],
    )
    assert get_res.status_code == 200
    assert get_res.json()["total_score"] == 10

    # 3. Toggle AI difficulty preference
    toggle_res = client.put(
        f"/api/v1/patients/{patient_id}/ai-difficulty",
        headers=caretaker_user["headers"],
        json={"enabled": False},
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["ai_difficulty_enabled"] is False

    # 4. Check adaptive level now reflects ai_difficulty_enabled = False
    adaptive_res = client.get(
        f"/api/v1/games/adaptive-level/{patient_id}/n-back",
        headers=patient_user["headers"],
    )
    assert adaptive_res.status_code == 200
    assert adaptive_res.json()["ai_difficulty_enabled"] is False


def test_adaptive_level_no_double_jumps(db, patient_user):
    """Guardrail: never jump more than 1 level per recommendation."""
    from app.models.game import PatientGameAbility

    patient_id = patient_user["user"].id
    ability = PatientGameAbility(
        patient_id=patient_id,
        game_id="water-jugs",
        theta=8.5,  # High latent ability
        sigma=0.3,
        last_level_played=1,  # Played level 1
        sessions_count=5,
    )
    db.add(ability)
    db.commit()

    rec = engine.recommend_level(db, patient_id, "water-jugs")
    # Even though theta=8.5, max step is +1 (from 1 to 2)
    assert rec["recommended_level"] == 2
    assert "raised" in rec["rationale"].lower()


def test_adaptive_level_anti_oscillation_cooldown(db, patient_user):
    """Guardrail: never raise level within 30 minutes of a lowering."""
    from app.models.game import PatientGameAbility

    patient_id = patient_user["user"].id
    now = datetime.now(timezone.utc)

    ability = PatientGameAbility(
        patient_id=patient_id,
        game_id="ball-sort",
        theta=3.2,
        sigma=0.4,
        last_level_played=2,
        sessions_count=5,
        last_lowered_at=now - timedelta(minutes=10),  # Lowered 10 min ago
    )
    db.add(ability)
    db.commit()

    rec = engine.recommend_level(db, patient_id, "ball-sort")
    # Should maintain at level 2 because 10 minutes < 30-minute cooldown
    assert rec["recommended_level"] == 2
    assert rec["cooldown_active"] is True
    assert "cooldown" in rec["rationale"].lower()


def test_adaptive_level_manual_override_precedence(db, patient_user):
    """Guardrail: caregiver manual override strictly takes precedence."""
    from app.models.game import PatientGameAbility

    patient_id = patient_user["user"].id
    ability = PatientGameAbility(
        patient_id=patient_id,
        game_id="tower-of-hanoi",
        theta=1.0,
        sigma=0.4,
        last_level_played=1,
        manual_override_level=4,
        sessions_count=5,
    )
    db.add(ability)
    db.commit()

    rec = engine.recommend_level(db, patient_id, "tower-of-hanoi")
    assert rec["recommended_level"] == 4
    assert rec["manual_override_level"] == 4
    assert "manual caregiver override" in rec["rationale"].lower()


def test_patient_abilities_api_and_override_workflow(client, patient_user, caretaker_user, setup_relationships):
    """Verify GET /abilities across all 24 games and PUT /ability-override."""
    patient_id = str(patient_user["user"].id)

    # 1. GET abilities overview
    res = client.get(
        f"/api/v1/games/patient/{patient_id}/abilities",
        headers=caretaker_user["headers"],
    )
    assert res.status_code == 200
    data = res.json()
    assert data["controller_type"] == "statistical_controller"
    assert "75%" in data["target_accuracy_band"]
    assert len(data["abilities"]) == 24  # All 24 games registered

    first_game = data["abilities"][0]
    game_id = first_game["game_id"]
    assert first_game["current_level"] >= 1
    assert first_game["max_level"] >= 1

    # 2. Caregiver sets manual override for that game
    override_res = client.put(
        f"/api/v1/games/patient/{patient_id}/ability-override",
        headers=caretaker_user["headers"],
        json={"game_id": game_id, "override_level": 5},
    )
    assert override_res.status_code == 200
    updated_item = override_res.json()
    assert updated_item["manual_override_level"] == 5
    assert updated_item["recommended_level"] == 5

    # 3. Verify adaptive recommendation endpoint now returns the override level
    rec_res = client.get(
        f"/api/v1/games/adaptive-level/{patient_id}/{game_id}",
        headers=patient_user["headers"],
    )
    assert rec_res.status_code == 200
    assert rec_res.json()["recommended_level"] == 5

    # 4. Clear override (set back to None)
    clear_res = client.put(
        f"/api/v1/games/patient/{patient_id}/ability-override",
        headers=caretaker_user["headers"],
        json={"game_id": game_id, "override_level": None},
    )
    assert clear_res.status_code == 200
    assert clear_res.json()["manual_override_level"] is None


def test_assessment_caching_and_invalidation(db, patient_user):
    """Verify daily in-memory assessment caching and cache invalidation."""
    patient_id = patient_user["user"].id

    # 1. First evaluation computes and caches
    eval1 = engine.evaluate_cognition(db, patient_id, use_cache=True)
    today_key = (patient_id, datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    assert today_key in engine._assessment_cache

    # 2. Subsequent call returns cached dictionary
    eval2 = engine.evaluate_cognition(db, patient_id, use_cache=True)
    assert eval2 is eval1

    # 3. Explicit invalidation removes it
    engine.invalidate_assessment_cache(patient_id)
    assert today_key not in engine._assessment_cache

