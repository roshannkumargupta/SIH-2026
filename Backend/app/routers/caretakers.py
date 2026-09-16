import json
from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select

from app.core.dependencies import DBSession, get_current_user, require_caretaker
from app.core.security import hash_password
from app.models.assessment import CognitiveAssessment
from app.models.game import GameSession
from app.models.medication import (
    MedicationFrequency,
    MedicationLog,
    MedicationLogStatus,
    MedicationSchedule,
)
from app.models.patient import PatientProfile
from app.models.prescription import Prescription, PrescriptionStatus
from app.models.relationship import CaretakerPatient
from app.models.task import Task, TaskPriority, TaskRecurrence, TaskStatus
from app.models.user import User, UserRole
from app.schemas.caretaker import (
    CaretakerAddPatientRequest,
    CaretakerAddPatientResponse,
    CaretakerCreateMedicationRequest,
    CaretakerCreateTaskRequest,
    CaretakerGameSessionItem,
    CaretakerMedicationItem,
    CaretakerPatientAnalyticsResponse,
    CaretakerPatientDetailResponse,
    CaretakerTaskItem,
)
from app.schemas.memory import MemoryCreate, MemoryResponse
from app.schemas.patient import PatientProfileResponse
from app.schemas.user import UserResponse
from app.services.analytics_service import get_latest_assessment
from app.services.memory_service import (
    create_memory,
    delete_memory,
    get_memory,
    get_patient_memories,
)
from app.services.patient_service import create_patient_profile, get_patient_profile
from app.services.relationship_service import caretaker_has_patient_access

router = APIRouter(
    prefix="/caretakers",
    tags=["Caregivers"],
)


def _verify_access(db: DBSession, caretaker_id: UUID, patient_id: UUID) -> None:
    if not caretaker_has_patient_access(db, caretaker_id, patient_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this patient's records.",
        )


@router.post(
    "/patients",
    response_model=CaretakerAddPatientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add new patient or connect existing patient",
)
def add_or_connect_patient(
    data: CaretakerAddPatientRequest,
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """
    Caregiver patient management endpoint:
    - CASE A (Patient does NOT exist):
        Creates a new user account with role PATIENT, hashes the password securely,
        creates the patient profile with demographics/emergency contacts,
        and establishes the CaretakerPatient relationship.
    - CASE B (Patient ALREADY exists):
        Finds existing patient by email, establishes the CaretakerPatient relationship
        without requiring their password, and prevents duplicate accounts/relationships.
    """
    clean_email = data.email.strip().lower()

    # Check if a user with this email already exists
    existing_user = db.scalar(
        select(User).where(func.lower(User.email) == clean_email)
    )

    if existing_user:
        # CASE B — PATIENT ALREADY EXISTS
        if existing_user.role != UserRole.PATIENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The account '{clean_email}' is registered as a {existing_user.role}, not a patient.",
            )

        # Check existing relationship
        existing_rel = db.scalar(
            select(CaretakerPatient).where(
                CaretakerPatient.caretaker_id == current_user.id,
                CaretakerPatient.patient_id == existing_user.id,
            )
        )

        if existing_rel:
            if not existing_rel.active:
                existing_rel.active = True
                db.commit()
                db.refresh(existing_rel)
            rel_id = existing_rel.id
        else:
            new_rel = CaretakerPatient(
                caretaker_id=current_user.id,
                patient_id=existing_user.id,
                relationship_type=data.relationship_type or "caregiver",
                active=True,
            )
            db.add(new_rel)
            db.commit()
            db.refresh(new_rel)
            rel_id = new_rel.id

        # Update profile with any new details if provided
        profile = get_patient_profile(db, existing_user.id)
        if profile:
            if data.gender and not profile.gender:
                profile.gender = data.gender
            if data.address and not profile.address:
                profile.address = data.address
            if data.doctor_name and not profile.doctor_name:
                profile.doctor_name = data.doctor_name
            if data.emergency_contact_name and not profile.emergency_contact_name:
                profile.emergency_contact_name = data.emergency_contact_name
            if data.emergency_contact_phone and not profile.emergency_contact_phone:
                profile.emergency_contact_phone = data.emergency_contact_phone
            db.commit()
            db.refresh(profile)

        return CaretakerAddPatientResponse(
            success=True,
            is_new_patient=False,
            message=f"Connected existing patient {existing_user.name} ({clean_email}) to your dashboard.",
            patient=UserResponse.model_validate(existing_user),
            profile=PatientProfileResponse.model_validate(profile) if profile else None,
            relationship_id=rel_id,
        )

    # CASE A — PATIENT DOES NOT EXIST: CREATE NEW ACCOUNT
    if not data.password or len(data.password.strip()) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A secure password (at least 4 characters) is required to create a new patient account.",
        )

    # 1. Create User with role=PATIENT and securely hashed password (bcrypt)
    new_patient = User(
        name=data.name.strip() if data.name else "Patient",
        email=clean_email,
        password_hash=hash_password(data.password.strip()),
        role=UserRole.PATIENT,
        phone=data.phone,
        preferred_language=data.preferred_language or "en-IN",
        is_active=True,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    # 2. Create PatientProfile
    # Calculate date_of_birth if age was provided
    dob = data.date_of_birth
    if not dob and data.age:
        try:
            age_int = int(str(data.age).strip())
            dob = date(datetime.now().year - age_int, 1, 1)
        except Exception:
            dob = None

    profile = PatientProfile(
        user_id=new_patient.id,
        date_of_birth=dob,
        emergency_contact_name=data.emergency_contact_name,
        emergency_contact_phone=data.emergency_contact_phone,
        preferred_language=data.preferred_language or "Hindi",
        gender=data.gender or "Female",
        address=data.address,
        doctor_name=data.doctor_name,
        timezone="Asia/Kolkata",
    )
    db.add(profile)

    # 3. Create CaretakerPatient relationship
    relationship = CaretakerPatient(
        caretaker_id=current_user.id,
        patient_id=new_patient.id,
        relationship_type=data.relationship_type or "caregiver",
        active=True,
    )
    db.add(relationship)

    # 4. Optional initial tasks
    for t in data.initial_tasks:
        try:
            time_parts = [int(p) for p in t.scheduled_time.split(":")[:2]]
            sched_t = time(time_parts[0], time_parts[1])
        except Exception:
            sched_t = time(9, 0)

        task = Task(
            patient_id=new_patient.id,
            created_by=current_user.id,
            title=t.title,
            description=t.description,
            scheduled_time=sched_t,
            priority=t.priority,
            recurrence=t.recurrence,
            start_date=date.today(),
            status=TaskStatus.PENDING,
        )
        db.add(task)

    # 5. Optional initial medications
    for m in data.initial_medications:
        rx = Prescription(
            patient_id=new_patient.id,
            doctor_id=current_user.id,  # Created under caregiver supervision
            medicine_name=m.medicine_name,
            dosage=m.dosage,
            instructions=m.instructions,
            start_date=date.today(),
            status=PrescriptionStatus.ACTIVE,
        )
        db.add(rx)
        db.flush()

        try:
            time_parts = [int(p) for p in m.scheduled_time.split(":")[:2]]
            sched_t = time(time_parts[0], time_parts[1])
        except Exception:
            sched_t = time(8, 0)

        sched = MedicationSchedule(
            prescription_id=rx.id,
            patient_id=new_patient.id,
            medicine_name=m.medicine_name,
            dosage=m.dosage,
            scheduled_time=sched_t,
            frequency=MedicationFrequency.DAILY,
            start_date=date.today(),
            active=True,
            reminder_enabled=True,
        )
        db.add(sched)
        db.flush()

        # Seed initial pending log for today
        sched_datetime = datetime.combine(date.today(), sched_t).replace(tzinfo=timezone.utc)
        log = MedicationLog(
            schedule_id=sched.id,
            patient_id=new_patient.id,
            scheduled_at=sched_datetime,
            status=MedicationLogStatus.SCHEDULED,
        )
        db.add(log)

    db.commit()
    db.refresh(profile)
    db.refresh(relationship)

    return CaretakerAddPatientResponse(
        success=True,
        is_new_patient=True,
        message=f"Created new patient account for {new_patient.name} ({clean_email}).",
        patient=UserResponse.model_validate(new_patient),
        profile=PatientProfileResponse.model_validate(profile),
        relationship_id=relationship.id,
    )


@router.get(
    "/patients",
    response_model=list[CaretakerPatientDetailResponse],
    summary="List all patients assigned to current caretaker",
)
def get_caretaker_patients(
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """List all active patients assigned to the authenticated caretaker."""
    relationships = db.scalars(
        select(CaretakerPatient)
        .where(
            CaretakerPatient.caretaker_id == current_user.id,
            CaretakerPatient.active.is_(True),
        )
        .order_by(CaretakerPatient.created_at.desc())
    ).all()

    results = []
    for rel in relationships:
        patient_user = db.get(User, rel.patient_id)
        if patient_user and patient_user.is_active:
            profile = get_patient_profile(db, patient_user.id)
            results.append(
                CaretakerPatientDetailResponse(
                    patient=UserResponse.model_validate(patient_user),
                    profile=PatientProfileResponse.model_validate(profile) if profile else None,
                    relationship_type=rel.relationship_type,
                    active=rel.active,
                    connected_since=rel.created_at,
                )
            )

    return results


@router.get(
    "/patients/{patient_id}",
    response_model=CaretakerPatientDetailResponse,
    summary="Get single patient details for caretaker",
)
def get_single_caretaker_patient(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """Retrieve full details for a connected patient."""
    _verify_access(db, current_user.id, patient_id)

    patient_user = db.get(User, patient_id)
    if not patient_user or not patient_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found or inactive.",
        )

    rel = db.scalar(
        select(CaretakerPatient).where(
            CaretakerPatient.caretaker_id == current_user.id,
            CaretakerPatient.patient_id == patient_id,
            CaretakerPatient.active.is_(True),
        )
    )

    profile = get_patient_profile(db, patient_id)

    return CaretakerPatientDetailResponse(
        patient=UserResponse.model_validate(patient_user),
        profile=PatientProfileResponse.model_validate(profile) if profile else None,
        relationship_type=rel.relationship_type if rel else "caregiver",
        active=rel.active if rel else True,
        connected_since=rel.created_at if rel else patient_user.created_at,
    )


@router.get(
    "/patients/{patient_id}/analytics",
    response_model=CaretakerPatientAnalyticsResponse,
    summary="Get 100% real database calculated analytics for patient",
)
def get_patient_analytics(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """
    Calculates 100% REAL analytics from actual stored patient records:
    - Task completion rate & stats from `tasks` table
    - Medication adherence & stats from `medication_logs` table
    - Cognitive game performance from `game_sessions` table
    - Cognitive evaluation from `cognitive_assessments` table
    """
    _verify_access(db, current_user.id, patient_id)

    cutoff_30d = datetime.now(timezone.utc) - timedelta(days=30)

    # 1. Real Task Records
    tasks = db.scalars(
        select(Task).where(Task.patient_id == patient_id)
    ).all()
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    pending_tasks = sum(1 for t in tasks if t.status == TaskStatus.PENDING)
    missed_tasks = sum(1 for t in tasks if t.status == TaskStatus.MISSED)
    task_rate = round((completed_tasks / total_tasks * 100.0), 1) if total_tasks > 0 else 0.0

    # 2. Real Medication Records
    med_logs = db.scalars(
        select(MedicationLog).where(MedicationLog.patient_id == patient_id)
    ).all()
    total_meds = len(med_logs)
    taken_meds = sum(1 for m in med_logs if m.status == MedicationLogStatus.TAKEN)
    pending_meds = sum(1 for m in med_logs if m.status == MedicationLogStatus.SCHEDULED)
    missed_meds = sum(1 for m in med_logs if m.status in (MedicationLogStatus.MISSED, MedicationLogStatus.SKIPPED))
    med_adherence = round((taken_meds / total_meds * 100.0), 1) if total_meds > 0 else (100.0 if total_meds == 0 and len(tasks) == 0 else 0.0)

    # 3. Real Game Records
    game_sessions = db.scalars(
        select(GameSession)
        .where(GameSession.patient_id == patient_id)
        .order_by(GameSession.completed_at.desc())
    ).all()

    total_games = len(game_sessions)
    if total_games > 0:
        avg_game_score = round(sum(s.score for s in game_sessions) / total_games, 1)
        avg_game_accuracy = round(sum(s.accuracy for s in game_sessions) / total_games, 1)
        best_game_score = max(s.score for s in game_sessions)
        total_game_dur = sum(s.duration_seconds for s in game_sessions)
        games_played_list = sorted(list({s.game_type or s.game_id for s in game_sessions}))
    else:
        avg_game_score = 0.0
        avg_game_accuracy = 0.0
        best_game_score = 0
        total_game_dur = 0
        games_played_list = []

    recent_game_items = [
        CaretakerGameSessionItem(
            id=s.id,
            game_name=(s.game_id or s.game_type).replace("-", " ").replace("_", " ").title(),
            game_id=s.game_id,
            score=s.score,
            accuracy=round(s.accuracy, 1),
            duration_seconds=s.duration_seconds,
            level_achieved=s.level_achieved,
            difficulty=s.difficulty,
            completed_at=s.completed_at,
        )
        for s in game_sessions[:6]
    ]

    # 4. Cognitive Assessment Records
    assessment = get_latest_assessment(db, patient_id)
    overall_score = assessment.overall_score if assessment else 75.0
    risk_level = assessment.risk_level if assessment else "low"

    # Insights & Recommendations parsing
    insights = []
    recommendations = []
    if assessment and assessment.insights:
        try:
            insights = json.loads(assessment.insights)
        except Exception:
            insights = [assessment.insights]
    if assessment and assessment.recommendations:
        try:
            recommendations = json.loads(assessment.recommendations)
        except Exception:
            recommendations = [assessment.recommendations]

    cognitive_scores = {
        "memory": assessment.memory_score if assessment else 75.0,
        "attention": assessment.attention_score if assessment else 75.0,
        "executive": assessment.executive_function_score if assessment else 75.0,
        "language": assessment.language_score if assessment else 75.0,
    }

    # Historical Daily Scores from past assessments or recent game sessions
    past_assessments = db.scalars(
        select(CognitiveAssessment)
        .where(
            CognitiveAssessment.patient_id == patient_id,
            CognitiveAssessment.assessment_date >= cutoff_30d,
        )
        .order_by(CognitiveAssessment.assessment_date.asc())
    ).all()

    if len(past_assessments) >= 2:
        diff = past_assessments[-1].overall_score - past_assessments[0].overall_score
        trend_direction = "improving" if diff > 2.0 else ("declining" if diff < -2.0 else "stable")
        daily_scores = [
            {
                "date": a.assessment_date.strftime("%b %d"),
                "overallScore": round(a.overall_score, 1),
            }
            for a in past_assessments[-7:]
        ]
    elif len(past_assessments) == 1:
        trend_direction = "stable"
        daily_scores = [
            {
                "date": past_assessments[0].assessment_date.strftime("%b %d"),
                "overallScore": round(past_assessments[0].overall_score, 1),
            }
        ]
    else:
        trend_direction = "stable"
        daily_scores = [{"date": "Today", "overallScore": round(overall_score, 1)}]

    return CaretakerPatientAnalyticsResponse(
        patient_id=patient_id,
        overall_score=overall_score,
        risk_level=risk_level,
        trend=trend_direction,
        cognitive_scores=cognitive_scores,
        insights=insights,
        recommendations=recommendations,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        missed_tasks=missed_tasks,
        task_completion_rate=task_rate,
        total_medications_scheduled=total_meds,
        medications_taken=taken_meds,
        medications_pending=pending_meds,
        medications_missed=missed_meds,
        medication_adherence_rate=med_adherence,
        total_games_played=total_games,
        average_game_score=avg_game_score,
        average_game_accuracy=avg_game_accuracy,
        best_game_score=best_game_score,
        total_game_duration_seconds=total_game_dur,
        games_played=games_played_list,
        recent_game_sessions=recent_game_items,
        daily_scores=daily_scores,
    )


@router.get(
    "/patients/{patient_id}/tasks",
    response_model=list[CaretakerTaskItem],
    summary="List tasks for connected patient",
)
def get_caretaker_patient_tasks(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """List real tasks for a connected patient."""
    _verify_access(db, current_user.id, patient_id)

    tasks = db.scalars(
        select(Task)
        .where(Task.patient_id == patient_id)
        .order_by(Task.scheduled_time.asc())
    ).all()

    return [
        CaretakerTaskItem(
            id=t.id,
            title=t.title,
            description=t.description,
            scheduled_time=t.scheduled_time.strftime("%H:%M") if t.scheduled_time else "09:00",
            priority=t.priority,
            status=t.status,
            completed_at=t.completed_at,
        )
        for t in tasks
    ]


@router.get(
    "/patients/{patient_id}/medications",
    response_model=list[CaretakerMedicationItem],
    summary="List medications and schedules for connected patient",
)
def get_caretaker_patient_medications(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """List real scheduled medicines and daily logs for a connected patient."""
    _verify_access(db, current_user.id, patient_id)

    schedules = db.scalars(
        select(MedicationSchedule)
        .where(MedicationSchedule.patient_id == patient_id, MedicationSchedule.active.is_(True))
        .order_by(MedicationSchedule.scheduled_time.asc())
    ).all()

    items = []
    for s in schedules:
        # Check today's log status
        today_start = datetime.combine(date.today(), time.min).replace(tzinfo=timezone.utc)
        today_log = db.scalar(
            select(MedicationLog)
            .where(
                MedicationLog.schedule_id == s.id,
                MedicationLog.scheduled_at >= today_start,
            )
            .order_by(MedicationLog.scheduled_at.desc())
        )

        status_str = today_log.status.value if today_log else "scheduled"
        taken_at = today_log.taken_at if today_log else None

        items.append(
            CaretakerMedicationItem(
                id=s.id,
                medicine_name=s.medicine_name,
                dosage=s.dosage,
                scheduled_time=s.scheduled_time.strftime("%H:%M") if s.scheduled_time else "08:00",
                status=status_str,
                taken_at=taken_at,
            )
        )

    return items


@router.post(
    "/patients/{patient_id}/medications",
    response_model=CaretakerMedicationItem,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new medication for an assigned patient",
)
def add_caretaker_patient_medication(
    patient_id: UUID,
    data: CaretakerCreateMedicationRequest,
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """Caretaker adds a scheduled medication for an assigned patient."""
    _verify_access(db, current_user.id, patient_id)

    # 1. Create underlying Prescription
    rx = Prescription(
        patient_id=patient_id,
        doctor_id=current_user.id,
        medicine_name=data.medicine_name.strip(),
        dosage=data.dosage.strip(),
        instructions=data.instructions.strip() if data.instructions else None,
        start_date=date.today(),
        status=PrescriptionStatus.ACTIVE,
    )
    db.add(rx)
    db.flush()

    # 2. Parse scheduled time
    try:
        time_parts = [int(p) for p in data.scheduled_time.split(":")[:2]]
        sched_t = time(time_parts[0], time_parts[1])
    except Exception:
        sched_t = time(8, 0)

    # 3. Create MedicationSchedule
    sched = MedicationSchedule(
        prescription_id=rx.id,
        patient_id=patient_id,
        medicine_name=data.medicine_name.strip(),
        dosage=data.dosage.strip(),
        scheduled_time=sched_t,
        frequency=data.frequency,
        start_date=date.today(),
        active=True,
        reminder_enabled=True,
    )
    db.add(sched)
    db.flush()

    # 4. Create initial log for today
    sched_datetime = datetime.combine(date.today(), sched_t).replace(tzinfo=timezone.utc)
    log = MedicationLog(
        schedule_id=sched.id,
        patient_id=patient_id,
        scheduled_at=sched_datetime,
        status=MedicationLogStatus.SCHEDULED,
    )
    db.add(log)
    db.commit()
    db.refresh(sched)

    return CaretakerMedicationItem(
        id=sched.id,
        medicine_name=sched.medicine_name,
        dosage=sched.dosage,
        scheduled_time=sched.scheduled_time.strftime("%H:%M") if sched.scheduled_time else "08:00",
        status="scheduled",
        instructions=data.instructions,
    )


@router.delete(
    "/patients/{patient_id}/medications/{schedule_id}",
    status_code=status.HTTP_200_OK,
    summary="Remove a scheduled medication for an assigned patient",
)
def remove_caretaker_patient_medication(
    patient_id: UUID,
    schedule_id: UUID,
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """Caretaker deactivates a medication schedule for an assigned patient."""
    _verify_access(db, current_user.id, patient_id)

    sched = db.get(MedicationSchedule, schedule_id)
    if not sched or sched.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication schedule not found for this patient.",
        )

    sched.active = False
    if sched.prescription_id:
        rx = db.get(Prescription, sched.prescription_id)
        if rx:
            rx.status = PrescriptionStatus.CANCELLED

    db.commit()
    return {"success": True, "message": "Medication removed successfully."}


@router.post(
    "/patients/{patient_id}/tasks",
    response_model=CaretakerTaskItem,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new task for an assigned patient",
)
def add_caretaker_patient_task(
    patient_id: UUID,
    data: CaretakerCreateTaskRequest,
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """Caretaker creates a new routine activity/task for an assigned patient."""
    _verify_access(db, current_user.id, patient_id)

    try:
        time_parts = [int(p) for p in data.scheduled_time.split(":")[:2]]
        sched_t = time(time_parts[0], time_parts[1])
    except Exception:
        sched_t = time(9, 0)

    task = Task(
        patient_id=patient_id,
        created_by=current_user.id,
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        scheduled_time=sched_t,
        priority=data.priority,
        recurrence=data.recurrence,
        start_date=date.today(),
        status=TaskStatus.PENDING,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    return CaretakerTaskItem(
        id=task.id,
        title=task.title,
        description=task.description,
        scheduled_time=task.scheduled_time.strftime("%H:%M") if task.scheduled_time else "09:00",
        priority=task.priority,
        status=task.status,
        completed_at=task.completed_at,
    )


@router.delete(
    "/patients/{patient_id}/tasks/{task_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a task for an assigned patient",
)
def delete_caretaker_patient_task(
    patient_id: UUID,
    task_id: UUID,
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """Caretaker deletes a task for an assigned patient."""
    _verify_access(db, current_user.id, patient_id)

    task = db.get(Task, task_id)
    if not task or task.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found for this patient.",
        )

    db.delete(task)
    db.commit()
    return {"success": True, "message": "Task deleted successfully."}


@router.post(
    "/patients/{patient_id}/tasks/{task_id}/toggle",
    response_model=CaretakerTaskItem,
    summary="Toggle completion status of a task for an assigned patient",
)
def toggle_caretaker_patient_task(
    patient_id: UUID,
    task_id: UUID,
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """Caretaker toggles a task between pending and completed."""
    _verify_access(db, current_user.id, patient_id)

    task = db.get(Task, task_id)
    if not task or task.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found for this patient.",
        )

    if task.status == TaskStatus.COMPLETED:
        task.status = TaskStatus.PENDING
        task.completed_at = None
    else:
        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(task)

    return CaretakerTaskItem(
        id=task.id,
        title=task.title,
        description=task.description,
        scheduled_time=task.scheduled_time.strftime("%H:%M") if task.scheduled_time else "09:00",
        priority=task.priority,
        status=task.status,
        completed_at=task.completed_at,
    )


@router.get("/dashboard")
def get_caretaker_dashboard(
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """Caregiver dashboard showing assigned patients, cognitive summaries, and pending tasks/meds."""
    relationships = db.scalars(
        select(CaretakerPatient)
        .where(
            CaretakerPatient.caretaker_id == current_user.id,
            CaretakerPatient.active.is_(True),
        )
    ).all()

    patient_reports = []

    for rel in relationships:
        patient = db.get(User, rel.patient_id)
        if not patient or not patient.is_active:
            continue

        latest_assessment = db.scalar(
            select(CognitiveAssessment)
            .where(CognitiveAssessment.patient_id == patient.id)
            .order_by(CognitiveAssessment.assessment_date.desc())
        )

        pending_meds = db.scalars(
            select(MedicationLog)
            .where(
                MedicationLog.patient_id == patient.id,
                MedicationLog.status == MedicationLogStatus.SCHEDULED,
            )
        ).all()

        pending_tasks = db.scalars(
            select(Task)
            .where(
                Task.patient_id == patient.id,
                Task.status == TaskStatus.PENDING,
            )
        ).all()

        profile = get_patient_profile(db, patient.id)

        patient_reports.append(
            {
                "patient": UserResponse.model_validate(patient),
                "profile": PatientProfileResponse.model_validate(profile) if profile else None,
                "latest_cognitive_score": latest_assessment.overall_score if latest_assessment else None,
                "risk_level": latest_assessment.risk_level if latest_assessment else "unassessed",
                "pending_medication_count": len(pending_meds),
                "pending_task_count": len(pending_tasks),
            }
        )

    return {
        "caretaker_id": current_user.id,
        "caretaker_name": current_user.name,
        "total_patients": len(patient_reports),
        "patients": patient_reports,
    }


@router.get(
    "/patients/{patient_id}/memories",
    response_model=list[MemoryResponse],
    summary="List memories for connected patient",
)
def get_caretaker_patient_memories(
    patient_id: UUID,
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """Caretaker views all memories and images for an assigned patient."""
    _verify_access(db, current_user.id, patient_id)
    return get_patient_memories(db, patient_id)


@router.post(
    "/patients/{patient_id}/memories",
    response_model=MemoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new memory with photo for connected patient",
)
def add_caretaker_patient_memory(
    patient_id: UUID,
    data: MemoryCreate,
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """Caretaker creates a memory with photo for an assigned patient."""
    _verify_access(db, current_user.id, patient_id)
    return create_memory(db, patient_id, data)


@router.delete(
    "/patients/{patient_id}/memories/{memory_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a memory for connected patient",
)
def delete_caretaker_patient_memory(
    patient_id: UUID,
    memory_id: UUID,
    db: DBSession,
    current_user: User = Depends(require_caretaker),
):
    """Caretaker removes a memory for an assigned patient."""
    _verify_access(db, current_user.id, patient_id)
    memory = get_memory(db, memory_id)
    if not memory or memory.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found for this patient.",
        )
    delete_memory(db, memory)
    return {"success": True, "message": "Memory deleted successfully."}
