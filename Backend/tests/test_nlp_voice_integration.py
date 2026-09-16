import base64
import io


def test_voice_languages_indic_coverage(client):
    res = client.get("/api/v1/voice/languages")
    assert res.status_code == 200
    languages = res.json()
    codes = {lang["code"] for lang in languages}

    # Verify all 7 Project B primary & regional languages
    required_codes = {"en-IN", "hi-IN", "as-IN", "bn-IN", "mni-IN", "brx-IN", "ne-IN"}
    assert required_codes.issubset(codes)


def test_voice_transcribe_json_and_multipart(client, patient_user):
    # 1. JSON payload with base64 audio
    mock_b64 = base64.b64encode(b"RIFFdummydataWAVEfmt ").decode("utf-8")
    res_json = client.post(
        "/api/v1/voice/transcribe",
        headers=patient_user["headers"],
        json={"audio_base64": mock_b64, "language_code": "en-IN"},
    )
    assert res_json.status_code == 200
    data_json = res_json.json()
    assert "transcribed_text" in data_json
    assert data_json["confidence"] >= 0.8
    assert "text" in data_json

    # 2. Multipart/form-data upload (browser MediaRecorder emulation)
    audio_file = io.BytesIO(b"\x1aE\xdf\xa3webm-test-stream-bytes")
    res_multi = client.post(
        "/api/v1/voice/transcribe",
        headers=patient_user["headers"],
        files={"file": ("voice-command.webm", audio_file, "audio/webm")},
        data={"language_code": "hi-IN", "model": "saaras:v3"},
    )
    assert res_multi.status_code == 200
    data_multi = res_multi.json()
    assert "transcribed_text" in data_multi
    assert data_multi["detected_language"] == "hi-IN"


def test_voice_transcribe_empty_audio_validation(client):
    res = client.post(
        "/api/v1/voice/transcribe",
        json={"audio_base64": "", "language_code": "en-IN"},
    )
    assert res.status_code == 400


def test_voice_nlp_interpret_multilingual(client):
    test_cases = [
        ("Open games", "en-IN", "OPEN_GAMES", None),
        ("Play memory match", "en-IN", "OPEN_GAME", "MEMORY_MATCH"),
        ("Open number puzzle", "en-IN", "OPEN_GAME", "NUMBER_PUZZLE"),
        ("Play word puzzle", "en-IN", "OPEN_GAME", "WORD_PUZZLE"),
        ("What should I do today?", "en-IN", "TODAY_REMINDERS", None),
        ("Show my reminders", "en-IN", "OPEN_REMINDERS", None),
        ("Tell me my next reminder", "en-IN", "NEXT_REMINDER", None),
        ("What can I say?", "en-IN", "HELP", None),
        ("Go back to home dashboard", "en-IN", "GO_HOME", None),
        ("Show my progress", "en-IN", "OPEN_ANALYTICS", None),
        ("Open caregiver dashboard", "en-IN", "OPEN_CAREGIVER", None),
        ("Take my medicine", "en-IN", "OPEN_MEDICATIONS", None),
        # Hindi cases
        ("गेम खोलो", "hi-IN", "OPEN_GAMES", None),
        ("मेमोरी गेम खोलो", "hi-IN", "OPEN_GAME", "MEMORY_MATCH"),
        ("आज मुझे क्या करना है", "hi-IN", "TODAY_REMINDERS", None),
        ("मेरे रिमाइंडर दिखाओ", "hi-IN", "OPEN_REMINDERS", None),
        ("अगला गेम", "hi-IN", "NEXT_GAME", None),
        ("मदद", "hi-IN", "HELP", None),
        # Assamese cases
        ("খেল খোলক", "as-IN", "OPEN_GAMES", None),
        ("আজি মই কি কৰিব লাগিব", "as-IN", "TODAY_REMINDERS", None),
        # Bengali cases
        ("আজকের রিমাইন্ডার", "bn-IN", "TODAY_REMINDERS", None),
        ("গেম খেলুন", "bn-IN", "OPEN_GAMES", None),
        # Nepali cases
        ("खेल खेल्नुस्", "ne-IN", "OPEN_GAMES", None),
    ]

    for utterance, lang, expected_intent, expected_entity in test_cases:
        res = client.post(
            "/api/v1/voice/interpret",
            json={"text": utterance, "language": lang},
        )
        assert res.status_code == 200, f"Failed on '{utterance}'"
        data = res.json()
        assert data["intent"] == expected_intent, f"Expected {expected_intent} but got {data['intent']} for '{utterance}'"
        if expected_entity:
            assert data["entity"] == expected_entity, f"Expected entity {expected_entity} for '{utterance}'"
        assert data["confidence"] >= 0.75


def test_voice_synthesize_speech(client):
    # 1. Successful synthesis
    res = client.post(
        "/api/v1/voice/synthesize",
        json={"text": "Welcome to SmritiSetu", "language_code": "en-IN"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "audio_base64" in data
    assert isinstance(data["audio_base64"], str)

    # 2. Empty text validation error
    res_empty = client.post(
        "/api/v1/voice/synthesize",
        json={"text": "   ", "language_code": "en-IN"},
    )
    assert res_empty.status_code in (400, 422)
