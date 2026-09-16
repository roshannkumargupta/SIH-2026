import json
import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.game import GameSession
from app.models.hydration import HydrationLog, HydrationSource
from app.models.medication import MedicationLog, MedicationSchedule
from app.models.memory import Memory
from app.models.mood_checkin import MoodCheckin, MoodType
from app.models.notification import Notification, NotificationType
from app.models.task import Task
from app.schemas.sync import SyncBatchRequest, SyncBatchResponse
from app.services.mood_checkin_service import (
    ALERT_DEBOUNCE_HOURS,
    detect_persistent_distress,
)
from app.services.notification_service import create_notification

logger = logging.getLogger("sync_service")


def process_offline_sync(
    db: Session,
    patient_id: UUID,
    data: SyncBatchRequest,
) -> SyncBatchResponse:
    now = datetime.now(timezone.utc)
    synced_games = 0
    synced_meds = 0
    synced_tasks = 0
    synced_memories = 0
    synced_voice_logs = 0
    synced_hydration = 0
    synced_moods = 0
    conflicts = []

    try:
        # 1. Process Game Events
        for ge in data.game_events:
            # Check for duplicate session by matching time, patient, and game
            existing = db.scalar(
                select(GameSession).where(
                    GameSession.patient_id == patient_id,
                    GameSession.completed_at == ge.completed_at,
                    GameSession.game_id == ge.game_id,
                )
            )
            if not existing:
                session = GameSession(
                    patient_id=patient_id,
                    game_type=ge.game_type,
                    game_id=ge.game_id,
                    score=ge.score,
                    accuracy=ge.accuracy,
                    duration_seconds=ge.duration_seconds,
                    difficulty=ge.difficulty,
                    metrics=json.dumps({"client_event_id": ge.client_event_id}),
                    completed_at=ge.completed_at,
                )
                db.add(session)
                synced_games += 1

        # 2. Process Medication Events
        for me in data.medication_events:
            if me.log_id:
                log = db.get(MedicationLog, me.log_id)
                if log and log.patient_id == patient_id:
                    log.status = me.status
                    log.taken_at = me.taken_at or now
                    synced_meds += 1
                else:
                    conflicts.append(f"Medication log {me.log_id} not found for patient")
            elif me.schedule_id:
                sched = db.get(MedicationSchedule, me.schedule_id)
                if sched and sched.patient_id == patient_id:
                    log = MedicationLog(
                        patient_id=patient_id,
                        schedule_id=sched.id,
                        scheduled_at=me.taken_at or now,
                        status=me.status,
                        taken_at=me.taken_at or now,
                    )
                    db.add(log)
                    synced_meds += 1
                else:
                    conflicts.append(f"Schedule {me.schedule_id} not found for patient")

        # 3. Process Task Events
        for te in data.task_events:
            task = db.get(Task, te.task_id)
            if task and task.patient_id == patient_id:
                task.status = te.status
                task.completed_at = te.completed_at or now
                synced_tasks += 1
            else:
                conflicts.append(f"Task {te.task_id} not found for patient")

        # 4. Process Memory Events
        for me_evt in data.memory_events:
            existing_mem = None
            if me_evt.memory_id:
                existing_mem = db.get(Memory, me_evt.memory_id)
            
            if not existing_mem:
                # Check for duplicate by patient + title
                existing_mem = db.scalar(
                    select(Memory).where(
                        Memory.patient_id == patient_id,
                        Memory.title == me_evt.title,
                    )
                )

            if existing_mem:
                existing_mem.description = me_evt.description
                if me_evt.category:
                    existing_mem.category = me_evt.category
                if me_evt.image_url:
                    existing_mem.image_url = me_evt.image_url
                synced_memories += 1
            else:
                new_mem = Memory(
                    patient_id=patient_id,
                    title=me_evt.title,
                    category=me_evt.category or "Family",
                    description=me_evt.description,
                    date_or_era=me_evt.date_or_era,
                    image_url=me_evt.image_url,
                    created_at=me_evt.created_at or now,
                )
                db.add(new_mem)
                synced_memories += 1

        # 5. Process Voice Events
        for ve in data.voice_events:
            synced_voice_logs += 1

        # 6. Process Hydration Events
        for he in data.hydration_events:
            logged_time = he.logged_at or now
            existing_hydration = db.scalar(
                select(HydrationLog).where(
                    HydrationLog.patient_id == patient_id,
                    HydrationLog.amount_ml == he.amount_ml,
                    HydrationLog.logged_at == logged_time,
                )
            )
            if not existing_hydration:
                hydration_record = HydrationLog(
                    patient_id=patient_id,
                    amount_ml=he.amount_ml,
                    logged_at=logged_time,
                    source=he.source or HydrationSource.MANUAL,
                    created_at=logged_time,
                )
                db.add(hydration_record)
                synced_hydration += 1

        # 7. Process Mood Events
        for me_checkin in data.mood_events:
            checkin_time = me_checkin.created_at or now
            existing_mood = db.scalar(
                select(MoodCheckin).where(
                    MoodCheckin.patient_id == patient_id,
                    MoodCheckin.mood == me_checkin.mood,
                    MoodCheckin.created_at == checkin_time,
                )
            )
            if not existing_mood:
                mood_record = MoodCheckin(
                    patient_id=patient_id,
                    mood=me_checkin.mood,
                    note=me_checkin.note,
                    created_at=checkin_time,
                )
                db.add(mood_record)
                synced_moods += 1

        # Evaluate persistent distress if new moods were recorded
        if synced_moods > 0:
            db.flush()
            is_distressed, reason = detect_persistent_distress(db, patient_id)
            if is_distressed:
                debounce_cutoff = now - timedelta(hours=ALERT_DEBOUNCE_HOURS)
                existing_alert = db.scalar(
                    select(Notification).where(
                        Notification.patient_id == patient_id,
                        Notification.type == NotificationType.MOOD_ALERT,
                        Notification.created_at >= debounce_cutoff,
                    )
                )
                if not existing_alert:
                    create_notification(
                        db=db,
                        patient_id=patient_id,
                        notification_type=NotificationType.MOOD_ALERT,
                        title="Well-being Alert: Distress Pattern Detected",
                        message=f"Notice: {reason} It may help to check in, call, or visit.",
                        scheduled_for=now,
                    )

        db.commit()

    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to process offline sync: {exc}", exc_info=True)
        raise

    return SyncBatchResponse(
        success=True,
        synced_games=synced_games,
        synced_medications=synced_meds,
        synced_tasks=synced_tasks,
        synced_memories=synced_memories,
        synced_voice_logs=synced_voice_logs,
        synced_hydration=synced_hydration,
        synced_moods=synced_moods,
        conflicts=conflicts,
        server_timestamp=now,
    )

