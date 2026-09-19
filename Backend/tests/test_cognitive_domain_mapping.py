"""
Tests for Cognitive Domain Mapping, Heuristic Scoring, and Decline Detection.
"""

from datetime import date, datetime, time, timedelta, timezone
from uuid import uuid4

import pytest
from sqlalchemy import select

from app.ai.cognitive_engine import engine
from app.ai.game_domain_mapping import (
    ALL_GAMES,
    CLINICAL_DOMAINS,
    GAME_TO_DOMAINS,
    get_domains_for_game,
)
from app.models.assessment import CognitiveAssessment
from app.models.game import GameSession
from app.models.medication import (
    MedicationFrequency,
    MedicationLog,
    MedicationLogStatus,
    MedicationSchedule,
)
from app.models.notification import Notification, NotificationType
from app.models.prescription import Prescription, PrescriptionStatus
from app.models.user import User, UserRole
from app.services.analytics_service import (
    detect_cognitive_decline,
    get_patient_cognitive_trends,
    run_patient_assessment,
)


@pytest.fixture
def test_patient(db):
    """Create a unique test patient in the database."""
    patient = User(
        id=uuid4(),
        email=f"patient_{uuid4().hex[:8]}@example.com",
        password_hash="test_hash",
        name="Cognitive Test Patient",
        role=UserRole.PATIENT,
        is_active=True,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@pytest.fixture(autouse=True)
def clear_engine_cache():
    """Ensure in-memory assessment cache is cleared before and after each test."""
    engine.invalidate_assessment_cache()
    yield
    engine.invalidate_assessment_cache()


def test_shared_json_has_all_24_games():
    """Verify that all 24 games are mapped to at least one clinical domain."""
    assert len(ALL_GAMES) == 24
    for game_id in ALL_GAMES:
        domains = get_domains_for_game(game_id)
        assert len(domains) >= 1, f"Game {game_id} has no mapped domains"
        for d in domains:
            assert d in CLINICAL_DOMAINS, f"Invalid domain {d} for {game_id}"


def test_empty_sessions_returns_insufficient_data(db, test_patient):
    """When a patient has played 0 sessions, all domain scores must be None."""
    result = engine.evaluate_cognition(db, test_patient.id)
    assert result["overall_score"] is None
    assert result["risk_level"] == "unassessable"
    assert result["memory_score"] is None
    assert result["attention_score"] is None
    assert result["executive_function_score"] is None


def test_all_24_games_contribute_to_mapped_domains(db, test_patient):
    """Every one of the 24 games must contribute to its mapped clinical domain(s)."""
    now = datetime.now(timezone.utc)

    for game_id in ALL_GAMES:
        # Clear sessions for test_patient
        db.query(GameSession).filter_by(patient_id=test_patient.id).delete()
        db.commit()
        engine.invalidate_assessment_cache(test_patient.id)

        session = GameSession(
            id=uuid4(),
            patient_id=test_patient.id,
            game_id=f"sess_{game_id}",
            game_type=game_id,
            score=800,
            accuracy=85.0,
            duration_seconds=90,
            difficulty="medium",
            level_achieved=1,
            completed_at=now,
        )
        db.add(session)
        db.commit()

        eval_res = engine.evaluate_cognition(db, test_patient.id)
        expected_domains = get_domains_for_game(game_id)

        for domain in expected_domains:
            score_key = f"{domain}_score"
            domain_score = eval_res[score_key]
            assert domain_score is not None, (
                f"Game '{game_id}' was expected to contribute to {domain} "
                f"({score_key}), but got None"
            )
            assert domain_score > 0.0


def test_recency_weighting(db, test_patient):
    """Recent sessions must have exponentially higher influence on domain score."""
    now = datetime.now(timezone.utc)

    # Session 1: 21 days ago with low accuracy (40%)
    old_session = GameSession(
        id=uuid4(),
        patient_id=test_patient.id,
        game_id="sess_old",
        game_type="delayed-recall",  # Memory domain
        score=400,
        accuracy=40.0,
        duration_seconds=60,
        difficulty="easy",
        level_achieved=1,
        completed_at=now - timedelta(days=21),
    )
    # Session 2: 1 day ago with high accuracy (90%)
    recent_session = GameSession(
        id=uuid4(),
        patient_id=test_patient.id,
        game_id="sess_recent",
        game_type="delayed-recall",  # Memory domain
        score=900,
        accuracy=90.0,
        duration_seconds=60,
        difficulty="easy",
        level_achieved=1,
        completed_at=now - timedelta(days=1),
    )
    db.add_all([old_session, recent_session])
    db.commit()

    eval_res = engine.evaluate_cognition(db, test_patient.id)
    memory_score = eval_res["memory_score"]
    assert memory_score is not None
    # Flat unweighted average would be (40 + 90)/2 = 65.0
    # Because 1-day-old session has weight exp(-0.099*1) ≈ 0.906
    # and 21-day-old session has weight exp(-0.099*21) ≈ 0.125
    # The weighted score should be > 80.0
    assert memory_score > 80.0


def test_difficulty_normalization(db, test_patient):
    """Higher levels achieved scale the normalised accuracy upward."""
    now = datetime.now(timezone.utc)

    # Level 1 session: 70% raw accuracy -> 70.0 normalised
    sess_l1 = GameSession(
        id=uuid4(),
        patient_id=test_patient.id,
        game_id="sess_l1",
        game_type="schulte-table",  # Attention domain
        score=700,
        accuracy=70.0,
        duration_seconds=60,
        difficulty="easy",
        level_achieved=1,
        completed_at=now,
    )
    db.add(sess_l1)
    db.commit()

    res_l1 = engine.evaluate_cognition(db, test_patient.id)
    score_l1 = res_l1["attention_score"]

    # Replace with Level 5 session: 70% raw accuracy -> 70 * (1 + 0.05 * 4) = 84.0
    db.delete(sess_l1)
    sess_l5 = GameSession(
        id=uuid4(),
        patient_id=test_patient.id,
        game_id="sess_l5",
        game_type="schulte-table",  # Attention domain
        score=700,
        accuracy=70.0,
        duration_seconds=60,
        difficulty="hard",
        level_achieved=5,
        completed_at=now,
    )
    db.add(sess_l5)
    db.commit()
    engine.invalidate_assessment_cache(test_patient.id)

    res_l5 = engine.evaluate_cognition(db, test_patient.id)
    score_l5 = res_l5["attention_score"]

    assert score_l1 is not None and score_l5 is not None
    assert score_l5 > score_l1
    assert pytest.approx(score_l5, rel=1e-2) == 84.0


def test_visuospatial_domain_scoring(db, test_patient):
    """Visuospatial games properly populate the visuospatial_score domain."""
    now = datetime.now(timezone.utc)
    sess = GameSession(
        id=uuid4(),
        patient_id=test_patient.id,
        game_id="sess_maze",
        game_type="maze",  # Visuospatial domain
        score=920,
        accuracy=95.0,
        duration_seconds=80,
        difficulty="medium",
        level_achieved=2,
        completed_at=now,
    )
    db.add(sess)
    db.commit()

    res = engine.evaluate_cognition(db, test_patient.id)
    assert res["visuospatial_score"] is not None
    assert res["visuospatial_score"] >= 95.0


def test_adherence_decoupling(db, test_patient):
    """Medication adherence does NOT fabricate or affect cognitive domain scores."""
    # Add a prescription and a taken medication log
    rx = Prescription(
        id=uuid4(),
        patient_id=test_patient.id,
        doctor_id=test_patient.id,
        medicine_name="Donepezil",
        dosage="5mg",
        start_date=date.today(),
        status=PrescriptionStatus.ACTIVE,
    )
    db.add(rx)
    db.flush()

    sched = MedicationSchedule(
        id=uuid4(),
        prescription_id=rx.id,
        patient_id=test_patient.id,
        medicine_name="Donepezil",
        dosage="5mg",
        scheduled_time=time(9, 0),
        frequency=MedicationFrequency.DAILY,
        start_date=date.today(),
        active=True,
    )
    db.add(sched)
    db.flush()

    log = MedicationLog(
        id=uuid4(),
        patient_id=test_patient.id,
        schedule_id=sched.id,
        status=MedicationLogStatus.TAKEN,
        scheduled_at=datetime.now(timezone.utc),
        taken_at=datetime.now(timezone.utc),
    )
    db.add(log)
    db.commit()

    # With NO game sessions played, cognitive scores must still be None
    res = engine.evaluate_cognition(db, test_patient.id)
    assert res["memory_score"] is None
    assert res["attention_score"] is None
    assert res["overall_score"] is None

    # But adherence is correctly computed and returned separately
    assert res["adherence"]["medication_rate"] == 100.0


def test_decline_detection_alert(db, test_patient):
    """Decline alert triggers when 2+ domains decline for 14+ days."""
    now = datetime.now(timezone.utc)

    # Seed 16 days of strictly declining assessments for Memory and Attention
    # Day 0 (15 days ago): 90 -> Day 15 (today): 45
    for i in range(16):
        day_offset = 15 - i
        day_date = now - timedelta(days=day_offset)
        score_val = 90.0 - (i * 3.0)  # decreases by 3 each day

        assessment = CognitiveAssessment(
            id=uuid4(),
            patient_id=test_patient.id,
            overall_score=score_val,
            risk_level="moderate" if score_val > 60 else "high",
            memory_score=score_val,
            attention_score=score_val,
            executive_function_score=75.0,  # stable
            language_score=80.0,            # stable
            visuospatial_score=85.0,        # stable
            model_version="2.0-heuristic",
            method_description="Test run",
            assessment_date=day_date,
        )
        db.add(assessment)

    db.commit()

    # Run decline detection
    alert_created = detect_cognitive_decline(db, test_patient.id)
    assert alert_created is True

    # Verify notification created
    notification = db.scalar(
        select(Notification).where(
            Notification.patient_id == test_patient.id,
            Notification.type == NotificationType.COGNITIVE_DECLINE,
        )
    )
    assert notification is not None
    assert "decline detected" in notification.message.lower()
    assert "memory" in notification.message.lower()
    assert "attention" in notification.message.lower()
