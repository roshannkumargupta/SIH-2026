from datetime import datetime, timezone
import json
import pytest
from app.models.notification import NotificationType
from app.services.notification_service import create_notification

def test_websocket_caregiver_connection(client):
    caregiver_id = "test-caregiver-123"
    
    with client.websocket_connect(f"/api/v1/ws/caregiver/{caregiver_id}") as websocket:
        # Receive initial connected status
        data = websocket.receive_json()
        assert data["type"] == "CONNECTION_ESTABLISHED"
        assert data["caregiver_id"] == caregiver_id
        
        # Test heartbeat ping/pong
        websocket.send_text(json.dumps({"type": "PING"}))
        pong_data = websocket.receive_json()
        assert pong_data["type"] == "PONG"

def test_websocket_realtime_notification_broadcast(client, db, caretaker_user, patient_user, setup_relationships):
    caregiver_id = str(caretaker_user["user"].id)
    patient_id = patient_user["user"].id
    
    with client.websocket_connect(f"/api/v1/ws/caregiver/{caregiver_id}") as websocket:
        data = websocket.receive_json()
        assert data["type"] == "CONNECTION_ESTABLISHED"
        
        # Trigger high priority notification (e.g. MOOD_ALERT)
        notif = create_notification(
            db=db,
            patient_id=patient_id,
            notification_type=NotificationType.MOOD_ALERT,
            title="Distress Alert: Low mood reported",
            message="Patient indicated feeling distressed during mood check-in.",
            scheduled_for=datetime.now(timezone.utc)
        )
        assert notif is not None
        
        # Check that WebSocket received the pushed alert
        alert_data = websocket.receive_json()
        assert alert_data["type"] == "NOTIFICATION_ALERT"
        assert alert_data["data"]["title"] == "Distress Alert: Low mood reported"
        assert alert_data["data"]["priority"] == "HIGH"
        assert alert_data["data"]["type"] == "mood_alert"
