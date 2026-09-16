from datetime import datetime, timedelta, timezone
from app.models.mood_checkin import MoodCheckin, MoodType
from app.models.notification import Notification, NotificationType
from app.services.mood_checkin_service import (
    ALERT_DEBOUNCE_HOURS,
    CONSECUTIVE_DISTRESS_THRESHOLD,
    CONSECUTIVE_DISTRESS_WINDOW_HOURS,
    WINDOW_CHECKIN_COUNT,
    WINDOW_DISTRESS_THRESHOLD,
    detect_persistent_distress,
    log_mood,
)


def test_mood_checkin_lifecycle_and_history(client, patient_user):
    # 1. Patient creates a mood checkin
    res = client.post(
        "/api/v1/mood/checkin",
        headers=patient_user["headers"],
        json={"mood": "happy", "note": "Feeling peaceful this morning"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["mood"] == "happy"
    assert data["note"] == "Feeling peaceful this morning"
    assert data["patient_id"] == str(patient_user["user"].id)

    # 2. Patient retrieves history
    history_res = client.get(
        "/api/v1/mood/history",
        headers=patient_user["headers"],
    )
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) == 1
    assert history[0]["id"] == data["id"]
    assert history[0]["mood"] == "happy"


def test_mood_trend_and_caretaker_access(client, patient_user, caretaker_user, setup_relationships):
    patient_id = str(patient_user["user"].id)

    # Patient logs 3 moods
    client.post("/api/v1/mood/checkin", headers=patient_user["headers"], json={"mood": "happy"})
    client.post("/api/v1/mood/checkin", headers=patient_user["headers"], json={"mood": "calm"})
    client.post("/api/v1/mood/checkin", headers=patient_user["headers"], json={"mood": "happy"})

    # Caretaker views patient's trend
    res = client.get(
        f"/api/v1/mood/trend?patient_id={patient_id}&days=7",
        headers=caretaker_user["headers"],
    )
    assert res.status_code == 200
    trend = res.json()
    assert trend["patient_id"] == patient_id
    assert trend["mood_counts"]["happy"] == 2
    assert trend["mood_counts"]["calm"] == 1
    assert trend["mood_counts"]["confused"] == 0
    assert trend["mood_counts"]["anxious"] == 0
    assert trend["distress_flagged"] is False


def test_persistent_distress_consecutive_trigger_and_debounce(client, db, patient_user, caretaker_user, setup_relationships):
    patient_id = patient_user["user"].id

    # 1st distress checkin: anxious
    res1 = client.post(
        "/api/v1/mood/checkin",
        headers=patient_user["headers"],
        json={"mood": "anxious", "note": "I cannot find my keys"},
    )
    assert res1.status_code == 201

    # No notification yet (only 1 checkin)
    notifs1 = db.query(Notification).filter(Notification.patient_id == patient_id).all()
    assert len(notifs1) == 0

    # 2nd distress checkin: confused (2 consecutive within 24 hours -> triggers persistent distress)
    res2 = client.post(
        "/api/v1/mood/checkin",
        headers=patient_user["headers"],
        json={"mood": "confused", "note": "Where am I right now?"},
    )
    assert res2.status_code == 201
    checkin2_id = res2.json()["id"]

    # Caregiver should receive a notification of type MOOD_ALERT with related_entity_id set
    notifs2 = db.query(Notification).filter(
        Notification.patient_id == patient_id,
        Notification.type == NotificationType.MOOD_ALERT,
    ).all()
    assert len(notifs2) == 1
    assert str(notifs2[0].related_entity_id) == checkin2_id
    assert "confused or anxious" in notifs2[0].message.lower() or "distress" in notifs2[0].message.lower()

    # 3rd distress checkin immediately after -> should be debounced within 12 hours
    res3 = client.post(
        "/api/v1/mood/checkin",
        headers=patient_user["headers"],
        json={"mood": "anxious"},
    )
    assert res3.status_code == 201

    notifs3 = db.query(Notification).filter(
        Notification.patient_id == patient_id,
        Notification.type == NotificationType.MOOD_ALERT,
    ).all()
    assert len(notifs3) == 1  # Debounced, no duplicate notification within 12 hours


def test_persistent_distress_window_threshold(db, patient_user):
    patient_id = patient_user["user"].id
    now = datetime.now(timezone.utc)

    # 3 of last 5 checkins confused/anxious even if not consecutive
    # Order descending by time:
    # 1. confused (now)
    # 2. happy (now - 1h)
    # 3. anxious (now - 2h)
    # 4. calm (now - 3h)
    # 5. anxious (now - 4h)
    history = [
        (MoodType.CONFUSED, now),
        (MoodType.HAPPY, now - timedelta(hours=1)),
        (MoodType.ANXIOUS, now - timedelta(hours=2)),
        (MoodType.CALM, now - timedelta(hours=3)),
        (MoodType.ANXIOUS, now - timedelta(hours=4)),
    ]
    for mood, ts in history:
        c = MoodCheckin(patient_id=patient_id, mood=mood, created_at=ts)
        db.add(c)
    db.commit()

    is_distressed, reason = detect_persistent_distress(db, patient_id)
    assert is_distressed is True
    assert "3 of the last 5" in reason
