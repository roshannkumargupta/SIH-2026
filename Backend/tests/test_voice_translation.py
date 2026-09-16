import base64
from datetime import datetime, timezone


def test_voice_and_speech_endpoints(client, patient_user):
    # 1. Supported languages
    lang_res = client.get("/api/v1/voice/languages")
    assert lang_res.status_code == 200
    languages = lang_res.json()
    assert len(languages) >= 5

    # 2. Audio transcription
    mock_audio_b64 = base64.b64encode(b"RIFFdummydataWAVEfmt ").decode("utf-8")
    tx_res = client.post(
        "/api/v1/voice/transcribe",
        headers=patient_user["headers"],
        json={"audio_base64": mock_audio_b64, "language_code": "hi-IN"},
    )
    assert tx_res.status_code == 200
    assert "transcribed_text" in tx_res.json()
    assert tx_res.json()["confidence"] > 0.8

    # 3. Speech synthesis
    tts_res = client.post(
        "/api/v1/voice/synthesize",
        headers=patient_user["headers"],
        json={"text": "Please take your medication.", "language_code": "en-IN"},
    )
    assert tts_res.status_code == 200
    assert "audio_base64" in tts_res.json()


def test_multilingual_translation(client, patient_user):
    # 1. Translate languages
    t_langs = client.get("/api/v1/translate/languages")
    assert t_langs.status_code == 200
    assert len(t_langs.json()) >= 5

    # 2. Translate clinical text
    tr_res = client.post(
        "/api/v1/translate",
        headers=patient_user["headers"],
        json={"text": "Please take your medication", "target_language": "hi"},
    )
    assert tr_res.status_code == 200
    assert tr_res.json()["translated_text"] == "कृपया अपनी दवा लें"

    # 3. Batch translate
    batch_res = client.post(
        "/api/v1/translate/batch",
        headers=patient_user["headers"],
        json={
            "texts": ["Please take your medication", "Medication reminder"],
            "target_language": "hi",
        },
    )
    assert batch_res.status_code == 200
    assert len(batch_res.json()["translations"]) == 2


def test_offline_synchronization(client, patient_user):
    now_iso = datetime.now(timezone.utc).isoformat()
    sync_res = client.post(
        "/api/v1/sync",
        headers=patient_user["headers"],
        json={
            "game_events": [
                {
                    "client_event_id": "offline_evt_1",
                    "game_type": "memory_match",
                    "game_id": "offline_game_101",
                    "score": 750,
                    "accuracy": 85.0,
                    "duration_seconds": 110,
                    "difficulty": "medium",
                    "completed_at": now_iso,
                }
            ],
            "medication_events": [],
            "task_events": [],
        },
    )
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert sync_data["success"] is True
    assert sync_data["synced_games"] == 1


def test_centralized_error_handling(client):
    # 1. 404 test
    res_404 = client.get("/api/v1/non-existent-endpoint")
    assert res_404.status_code == 404
    body_404 = res_404.json()
    assert body_404["success"] is False
    assert body_404["errorCode"] == "HTTP_404"

    # 2. 422 validation error test
    res_422 = client.post("/api/v1/auth/register", json={"email": "invalid-email"})
    assert res_422.status_code == 422
    body_422 = res_422.json()
    assert body_422["success"] is False
    assert body_422["errorCode"] == "VALIDATION_ERROR"
    assert len(body_422["details"]) > 0
