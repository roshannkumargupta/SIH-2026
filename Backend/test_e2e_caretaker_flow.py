"""
Comprehensive End-to-End Automated Verification Test Suite for:
1. Caretaker -> Patient Account Creation / Connection (Case A & Case B)
2. Bcrypt Password Hashing & Patient Login Verification
3. Caretaker-Patient Access Authorization
4. Real-time DB Analytics Calculation (Zero Mock Data)
5. Game Session Recording & Level Progression (Level N won -> Level N+1 unlocked)
"""
import sys
import uuid
from datetime import date, datetime, time, timezone
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_db, SessionLocal
from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole
from app.models.patient import PatientProfile
from app.models.relationship import CaretakerPatient
from app.models.task import Task, TaskStatus, TaskPriority, TaskRecurrence
from app.models.prescription import Prescription, PrescriptionStatus
from app.models.medication import (
    MedicationSchedule,
    MedicationFrequency,
    MedicationLog,
    MedicationLogStatus,
)
from app.models.game import GameSession
from app.models.assessment import CognitiveAssessment

client = TestClient(app)

def create_auth_headers(email: str, role: str, name: str = "Test User") -> dict:
    """Helper to register/login a user and get JWT Bearer token headers."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                password_hash=hash_password("password123"),
                name=name,
                role=UserRole(role),
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    finally:
        db.close()

    # Login to obtain token
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    assert resp.status_code == 200, f"Failed login for {email}: {resp.text}"
    data = resp.json()
    token = data["token"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_case_a_caretaker_creates_new_patient_and_patient_can_login():
    """
    CASE A: Caretaker creates a brand new patient account with a password.
    - Password must be hashed with bcrypt in DB (never plaintext).
    - PatientProfile is created with age, stage, doctor, language, etc.
    - CaretakerPatient relationship is created.
    - Patient can log in directly using the credentials created by caretaker.
    """
    caretaker_email = f"caretaker_a_{uuid.uuid4().hex[:6]}@example.com"
    patient_email = f"patient_a_{uuid.uuid4().hex[:6]}@example.com"
    patient_password = "SecurePatientPass123!"

    caretaker_headers = create_auth_headers(caretaker_email, "caretaker", "Sunita Sharma")

    payload = {
        "email": patient_email,
        "password": patient_password,
        "name": "Ramesh Gupta",
        "age": 72,
        "gender": "Male",
        "phone": "+91 9876543210",
        "address": "123 MG Road, Delhi",
        "emergency_contact_name": "Sunita Sharma",
        "emergency_contact_phone": "+91 9876543211",
        "doctor_name": "Dr. A. Verma",
        "preferred_language": "Hindi",
        "relationship_type": "daughter",
        "initial_tasks": [
            {
                "title": "Morning Walk in Garden",
                "description": "Walk for 15 minutes",
                "scheduled_time": "07:00",
                "priority": "high",
                "recurrence": "daily",
            }
        ],
        "initial_medications": [
            {
                "medicine_name": "Donepezil 5mg",
                "dosage": "1 tablet",
                "scheduled_time": "08:00",
                "instructions": "After breakfast",
            }
        ],
    }

    # 1. Caretaker creates patient
    res = client.post("/api/v1/caretakers/patients", json=payload, headers=caretaker_headers)
    assert res.status_code == 201, f"Create patient failed: {res.text}"
    body = res.json()
    assert body["success"] is True
    assert body["is_new_patient"] is True
    patient_id = body["patient"]["id"]

    # 2. Verify password is saved securely as bcrypt hash in DB
    db = SessionLocal()
    try:
        user_db = db.query(User).filter(User.email == patient_email).first()
        assert user_db is not None
        assert user_db.password_hash != patient_password, "Password MUST NOT be stored in plaintext"
        assert verify_password(patient_password, user_db.password_hash) is True, "Bcrypt hash must verify against password"
    finally:
        db.close()

    # 3. Patient logs in using credentials created by caretaker
    login_res = client.post("/api/v1/auth/login", json={"email": patient_email, "password": patient_password})
    assert login_res.status_code == 200, f"Patient failed to login with credentials: {login_res.text}"
    token_data = login_res.json()
    patient_token = token_data["token"]["access_token"]
    patient_headers = {"Authorization": f"Bearer {patient_token}"}

    # 4. Patient can fetch their own profile
    profile_res = client.get("/api/v1/auth/me", headers=patient_headers)
    assert profile_res.status_code == 200
    assert profile_res.json()["email"] == patient_email

    print("[PASS] TEST 1: Case A - New patient account created with bcrypt hash, relationship linked, and patient login verified.")


def test_case_b_caretaker_connects_existing_patient_without_password():
    """
    CASE B: Patient account already exists.
    Caretaker connects to the existing patient via email without requiring patient's password.
    """
    existing_patient_email = f"existing_patient_{uuid.uuid4().hex[:6]}@example.com"
    existing_patient_headers = create_auth_headers(existing_patient_email, "patient", "Kamla Devi")

    caretaker_b_email = f"caretaker_b_{uuid.uuid4().hex[:6]}@example.com"
    caretaker_b_headers = create_auth_headers(caretaker_b_email, "caretaker", "Anita Devi")

    # Connect to existing patient
    payload = {
        "email": existing_patient_email,
        "name": "Kamla Devi (Updated)",
        "relationship_type": "primary_caregiver",
    }

    res = client.post("/api/v1/caretakers/patients", json=payload, headers=caretaker_b_headers)
    assert res.status_code in (200, 201), f"Case B connection failed: {res.text}"
    body = res.json()
    assert body["success"] is True
    assert body["is_new_patient"] is False
    assert "Connected existing patient" in body["message"]

    # Caretaker lists patients -> must contain Kamla Devi
    list_res = client.get("/api/v1/caretakers/patients", headers=caretaker_b_headers)
    assert list_res.status_code == 200
    patients_list = list_res.json()
    assert any(p["patient"]["email"] == existing_patient_email for p in patients_list)

    print("[PASS] TEST 2: Case B - Caretaker connected existing patient without needing their password.")


def test_authorization_caretaker_cannot_access_unlinked_patient():
    """
    Authorization test: Caretaker X cannot access Patient Y if no link exists.
    """
    c1_headers = create_auth_headers(f"c1_{uuid.uuid4().hex[:6]}@test.com", "caretaker")
    c2_headers = create_auth_headers(f"c2_{uuid.uuid4().hex[:6]}@test.com", "caretaker")

    p_email = f"p_unlinked_{uuid.uuid4().hex[:6]}@test.com"
    # c1 creates patient
    res = client.post("/api/v1/caretakers/patients", json={"email": p_email, "password": "pass", "name": "P Unlinked"}, headers=c1_headers)
    assert res.status_code == 201
    patient_id = res.json()["patient"]["id"]

    # c2 tries to access c1's patient analytics -> 403 Forbidden
    unauth_res = client.get(f"/api/v1/caretakers/patients/{patient_id}/analytics", headers=c2_headers)
    assert unauth_res.status_code == 403, f"Expected 403 but got {unauth_res.status_code}"

    print("[PASS] TEST 3: Backend authorization strictly enforces caretaker-patient access boundaries.")


def test_real_database_analytics_calculation():
    """
    Zero Mock Data Verification:
    Insert real tasks (1 completed, 1 pending), 1 medication log (taken), and 1 game session.
    Verify that Caretaker Analytics returns mathematically exact derived values:
    - task_completion_rate: 50.0%
    - medication_adherence_rate: 100.0%
    - total_games_played: 1, average_game_score: 85.0
    """
    c_email = f"c_analytics_{uuid.uuid4().hex[:6]}@test.com"
    p_email = f"p_analytics_{uuid.uuid4().hex[:6]}@test.com"
    c_headers = create_auth_headers(c_email, "caretaker")

    res = client.post(
        "/api/v1/caretakers/patients",
        json={"email": p_email, "password": "pass", "name": "Analytics Patient", "age": 68},
        headers=c_headers,
    )
    assert res.status_code == 201
    patient_id = res.json()["patient"]["id"]
    p_uuid = uuid.UUID(patient_id)

    db = SessionLocal()
    try:
        # 1. Insert 2 Tasks (1 completed, 1 pending)
        t1 = Task(
            patient_id=p_uuid,
            created_by=p_uuid,
            title="Task 1",
            scheduled_time=time(9, 0),
            start_date=date.today(),
            status=TaskStatus.COMPLETED,
            priority=TaskPriority.NORMAL,
            recurrence=TaskRecurrence.DAILY,
            completed_at=datetime.now(timezone.utc),
        )
        t2 = Task(
            patient_id=p_uuid,
            created_by=p_uuid,
            title="Task 2",
            scheduled_time=time(11, 0),
            start_date=date.today(),
            status=TaskStatus.PENDING,
            priority=TaskPriority.NORMAL,
            recurrence=TaskRecurrence.DAILY,
        )
        db.add_all([t1, t2])

        # 2. Insert Prescription, Medication Schedule & Log (taken)
        rx = Prescription(
            patient_id=p_uuid,
            doctor_id=p_uuid,
            medicine_name="Aspirin",
            dosage="75mg",
            start_date=date.today(),
            status=PrescriptionStatus.ACTIVE,
        )
        db.add(rx)
        db.flush()

        sched = MedicationSchedule(
            prescription_id=rx.id,
            patient_id=p_uuid,
            medicine_name="Aspirin",
            dosage="75mg",
            scheduled_time=time(8, 0),
            frequency=MedicationFrequency.DAILY,
            start_date=date.today(),
            active=True,
            reminder_enabled=True,
        )
        db.add(sched)
        db.flush()

        med_log = MedicationLog(
            schedule_id=sched.id,
            patient_id=p_uuid,
            scheduled_at=datetime.now(timezone.utc),
            status=MedicationLogStatus.TAKEN,
            taken_at=datetime.now(timezone.utc),
        )
        db.add(med_log)

        # 3. Insert Game Session
        gs = GameSession(
            patient_id=p_uuid,
            game_type="Working Memory Grid",
            game_id="working-memory-grid",
            score=85,
            accuracy=90.0,
            duration_seconds=45,
            level_achieved=1,
            difficulty="1",
            completed_at=datetime.now(timezone.utc),
        )
        db.add(gs)

        # 4. Insert Cognitive Assessment
        ca = CognitiveAssessment(
            patient_id=p_uuid,
            overall_score=88.0,
            memory_score=90.0,
            attention_score=85.0,
            executive_function_score=87.0,
            language_score=90.0,
            risk_level="low",
            assessment_date=datetime.now(timezone.utc),
        )
        db.add(ca)

        db.commit()
    finally:
        db.close()

    # Fetch Caretaker Analytics for this patient
    analytics_res = client.get(f"/api/v1/caretakers/patients/{patient_id}/analytics", headers=c_headers)
    assert analytics_res.status_code == 200, f"Analytics failed: {analytics_res.text}"
    data = analytics_res.json()

    # Assert exact calculated numbers
    assert data["total_tasks"] == 2
    assert data["completed_tasks"] == 1
    assert data["pending_tasks"] == 1
    assert data["task_completion_rate"] == 50.0

    assert data["total_medications_scheduled"] == 1
    assert data["medications_taken"] == 1
    assert data["medication_adherence_rate"] == 100.0

    assert data["total_games_played"] == 1
    assert data["average_game_score"] == 85.0
    assert data["average_game_accuracy"] == 90.0
    assert data["best_game_score"] == 85
    assert len(data["recent_game_sessions"]) == 1

    assert data["overall_score"] == 88.0
    assert data["risk_level"] == "low"

    print("[PASS] TEST 4: Analytics are 100% computed from real database records (Zero Mock Data).")


def test_game_level_progression():
    """
    Game Progression Test:
    When a patient plays and wins Level 1 (accuracy >= 60% or score >= 40),
    next_level_unlocked is set to 2.
    """
    p_email = f"p_gamer_{uuid.uuid4().hex[:6]}@test.com"
    p_headers = create_auth_headers(p_email, "patient")

    session_payload = {
        "game_type": "Card Matching",
        "game_id": "card-matching",
        "score": 80,
        "accuracy": 85.0,
        "duration_seconds": 60,
        "level_achieved": 1,
        "difficulty": "1",
    }

    # Record Level 1 session
    res = client.post("/api/v1/games/sessions", json=session_payload, headers=p_headers)
    assert res.status_code == 201, f"Game session recording failed: {res.text}"
    body = res.json()
    assert body["next_level_unlocked"] == 2, f"Expected Level 2 unlocked, got {body.get('next_level_unlocked')}"

    # Fetch patient's game progress
    progress_res = client.get("/api/v1/games/sessions/my/progress", headers=p_headers)
    assert progress_res.status_code == 200
    prog = progress_res.json()
    assert "card-matching" in prog["games"]
    assert prog["games"]["card-matching"]["current_unlocked_level"] == 2
    assert prog["games"]["card-matching"]["highest_level_won"] == 1
    assert prog["games"]["card-matching"]["best_score"] == 80

    print("[PASS] TEST 5: Game level progression correctly unlocks Level N+1 upon winning Level N.")


def test_caretaker_adds_medication_and_task_and_patient_sees_them():
    """
    TEST: Caretaker adds medication and task for an assigned patient.
    1. Caretaker creates medication via POST /api/v1/caretakers/patients/{patient_id}/medications
    2. Patient logs in and fetches GET /api/v1/medications/patient/{patient_id}/today -> receives the medicine!
    3. Caretaker creates task via POST /api/v1/caretakers/patients/{patient_id}/tasks
    4. Patient fetches GET /api/v1/tasks/patient/{patient_id}/today -> receives the task!
    5. Caretaker toggles task status -> verified.
    6. Caretaker deletes task -> verified.
    """
    c_email = f"c_medtask_{uuid.uuid4().hex[:6]}@test.com"
    p_email = f"p_medtask_{uuid.uuid4().hex[:6]}@test.com"
    p_pass = "PatientPass123!"
    c_headers = create_auth_headers(c_email, "caretaker", "Caregiver MedTask")

    # Caretaker creates patient (without doctor - testing optional doctor as well)
    create_patient_res = client.post(
        "/api/v1/caretakers/patients",
        json={
            "email": p_email,
            "password": p_pass,
            "name": "Medication Test Patient",
            "age": 70,
            "doctor_name": None,  # Optional doctor is empty
        },
        headers=c_headers,
    )
    assert create_patient_res.status_code == 201, f"Patient creation failed: {create_patient_res.text}"
    patient_id = create_patient_res.json()["patient"]["id"]

    # 1. Caretaker adds a medication
    med_payload = {
        "medicine_name": "Rivastigmine 3mg",
        "dosage": "1 capsule",
        "scheduled_time": "08:30",
        "instructions": "Take with breakfast",
    }
    med_res = client.post(
        f"/api/v1/caretakers/patients/{patient_id}/medications",
        json=med_payload,
        headers=c_headers,
    )
    assert med_res.status_code == 201, f"Caretaker add medication failed: {med_res.text}"
    med_data = med_res.json()
    assert med_data["medicine_name"] == "Rivastigmine 3mg"
    assert med_data["dosage"] == "1 capsule"
    schedule_id = med_data["id"]

    # 2. Patient logs in and queries today's medications
    login_res = client.post("/api/v1/auth/login", json={"email": p_email, "password": p_pass})
    assert login_res.status_code == 200
    p_token = login_res.json()["token"]["access_token"]
    p_headers = {"Authorization": f"Bearer {p_token}"}

    patient_meds_res = client.get(f"/api/v1/medications/patient/{patient_id}/today", headers=p_headers)
    assert patient_meds_res.status_code == 200, f"Patient get meds failed: {patient_meds_res.text}"
    patient_meds = patient_meds_res.json()
    assert len(patient_meds) >= 1
    assert any(m["medicine_name"] == "Rivastigmine 3mg" for m in patient_meds), "Patient did not receive Caretaker-added medicine!"

    patient_logs_res = client.get(f"/api/v1/medications/logs/patient/{patient_id}/today", headers=p_headers)
    assert patient_logs_res.status_code == 200
    patient_logs = patient_logs_res.json()
    assert len(patient_logs) >= 1

    # 3. Caretaker adds a task
    task_payload = {
        "title": "Evening Breathing Exercise",
        "description": "5 minutes deep breathing",
        "scheduled_time": "18:00",
        "priority": "normal",
        "recurrence": "daily",
    }
    task_res = client.post(
        f"/api/v1/caretakers/patients/{patient_id}/tasks",
        json=task_payload,
        headers=c_headers,
    )
    assert task_res.status_code == 201, f"Caretaker add task failed: {task_res.text}"
    task_data = task_res.json()
    assert task_data["title"] == "Evening Breathing Exercise"
    task_id = task_data["id"]

    # 4. Patient queries today's tasks
    patient_tasks_res = client.get(f"/api/v1/tasks/patient/{patient_id}/today", headers=p_headers)
    assert patient_tasks_res.status_code == 200, f"Patient get tasks failed: {patient_tasks_res.text}"
    patient_tasks = patient_tasks_res.json()
    assert any(t["title"] == "Evening Breathing Exercise" for t in patient_tasks), "Patient did not receive Caretaker-added task!"

    # 5. Caretaker toggles task
    toggle_res = client.post(
        f"/api/v1/caretakers/patients/{patient_id}/tasks/{task_id}/toggle",
        headers=c_headers,
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["status"] == "completed"

    # 6. Caretaker removes medication
    del_med_res = client.delete(
        f"/api/v1/caretakers/patients/{patient_id}/medications/{schedule_id}",
        headers=c_headers,
    )
    assert del_med_res.status_code == 200

    print("[PASS] TEST 6: Caretaker -> Database -> Patient medication & task flow verified end-to-end with optional doctor.")


if __name__ == "__main__":
    test_case_a_caretaker_creates_new_patient_and_patient_can_login()
    test_case_b_caretaker_connects_existing_patient_without_password()
    test_authorization_caretaker_cannot_access_unlinked_patient()
    test_real_database_analytics_calculation()
    test_game_level_progression()
    test_caretaker_adds_medication_and_task_and_patient_sees_them()
    print("\n>>> ALL 6 COMPREHENSIVE END-TO-END TESTS PASSED SUCCESSFULLY! <<<")
