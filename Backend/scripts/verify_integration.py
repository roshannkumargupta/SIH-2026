import urllib.request
import urllib.error
import json
import base64

BASE_URL = "http://127.0.0.1:8000/api/v1"

def request(method, path, body=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        return e.code, json.loads(content) if content else {}

def run_tests():
    print("🚀 Starting End-to-End API Integration Contract Verification...\n")
    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  ✅ PASS: {name}")
        else:
            print(f"  ❌ FAIL: {name} - {details}")

    # 1. Health
    status, data = request("GET", "/health")
    assert_test("Health Check", status == 200 and data.get("database") == "connected")

    # 2. Patient Auth Login
    status, data = request("POST", "/auth/login", {"email": "lalita@smritisetu.com", "password": "Password123!"})
    assert_test("Patient Login (Lalita)", status == 200 and "token" in data)
    patient_token = data.get("token", {}).get("access_token")
    patient_id = data.get("user", {}).get("id")

    # 3. Doctor Auth Login
    status, data = request("POST", "/auth/login", {"email": "doctor@smritisetu.com", "password": "Password123!"})
    assert_test("Doctor Login (Dr. Sharma)", status == 200 and data.get("user", {}).get("role") == "doctor")
    doctor_token = data.get("token", {}).get("access_token")

    # 4. Caretaker Auth Login
    status, data = request("POST", "/auth/login", {"email": "caregiver@smritisetu.com", "password": "Password123!"})
    assert_test("Caregiver Login (Rahul)", status == 200 and data.get("user", {}).get("role") == "caretaker")
    caretaker_token = data.get("token", {}).get("access_token")

    # 5. Patient Profile
    status, data = request("GET", "/patients/me/profile", token=patient_token)
    assert_test("Patient Profile Retrieval", status == 200 and data.get("user_id") == patient_id)

    # 6. Today's Medications
    status, data = request("GET", f"/medications/patient/{patient_id}/today", token=patient_token)
    assert_test("Today Medications Schedule", status == 200 and isinstance(data, list))

    # 7. Today's Medication Logs
    status, data = request("GET", f"/medications/logs/patient/{patient_id}/today", token=patient_token)
    assert_test("Today Medication Logs", status == 200 and len(data) > 0, details=f"status={status}, data={data}")
    log_id = data[0]["id"] if data else None

    # 8. Update Medication Status
    if log_id:
        status, data = request("POST", f"/medications/logs/{log_id}/status", {"status": "taken"}, token=patient_token)
        assert_test("Take Medicine Action", status == 200 and data.get("status") == "taken")

    # 9. Today's Tasks
    status, data = request("GET", f"/tasks/patient/{patient_id}/today", token=patient_token)
    assert_test("Today Tasks Retrieval", status == 200 and len(data) > 0)
    task_id = data[0]["id"] if data else None

    # 10. Complete Task
    if task_id:
        status, data = request("POST", f"/tasks/{task_id}/complete", token=patient_token)
        assert_test("Complete Task Action", status == 200 and data.get("status") == "completed")

    # 11. Games Types
    status, data = request("GET", "/games/types")
    assert_test("Cognitive Games Types", status == 200 and len(data) > 0)

    # 12. Submit Game Session
    game_payload = {
        "game_type": "memory_match",
        "game_id": "memory_match",
        "score": 92,
        "accuracy": 95.0,
        "duration_seconds": 40,
        "difficulty": "medium",
        "level_achieved": 1
    }
    status, data = request("POST", "/games/sessions", game_payload, token=patient_token)
    assert_test("Submit Game Score", status == 201 and data.get("score") == 92)

    # 13. Game Performance Summary
    status, data = request("GET", f"/games/sessions/patient/{patient_id}/summary", token=patient_token)
    assert_test("Game Performance Summary", status == 200 and data.get("total_sessions", 0) > 0)

    # 14. AI Cognitive Assessment Trigger
    status, data = request("POST", f"/analytics/patient/{patient_id}/assess", token=patient_token)
    assert_test("Trigger AI Assessment", status == 201 and "overall_score" in data)

    # 15. Latest Cognitive Assessment
    status, data = request("GET", f"/analytics/patient/{patient_id}/latest", token=patient_token)
    assert_test("Latest Cognitive Assessment", status == 200 and data.get("risk_level") in ["low", "moderate", "high", "critical"])

    # 16. Patient Notifications
    status, data = request("GET", "/notifications", token=patient_token)
    assert_test("Notifications Retrieval", status == 200 and isinstance(data, list))
    if data:
        notif_id = data[0]["id"]
        status, read_data = request("POST", f"/notifications/{notif_id}/read", token=patient_token)
        assert_test("Mark Notification Read", status == 200 and read_data.get("status") == "read")

    # 17. Caretaker Dashboard
    status, data = request("GET", "/caretakers/dashboard", token=caretaker_token)
    assert_test("Caregiver Dashboard", status == 200 and data.get("total_patients", 0) > 0)

    # 18. Doctor Dashboard
    status, data = request("GET", "/doctors/dashboard", token=doctor_token)
    assert_test("Doctor Dashboard", status == 200 and "patients" in data)

    # 19. Write Prescription by Doctor
    rx_payload = {
        "patient_id": patient_id,
        "medicine_name": "Rivastigmine",
        "dosage": "1.5mg",
        "route": "Oral",
        "instructions": "Twice daily with meals",
        "start_date": "2026-09-12"
    }
    status, data = request("POST", "/prescriptions", rx_payload, token=doctor_token)
    assert_test("Doctor Write Prescription", status == 201 and data.get("medicine_name") == "Rivastigmine")

    # 20. Voice Speech Transcription
    audio_b64 = base64.b64encode(b"sample-audio-data-payload").decode("utf-8")
    status, data = request("POST", "/voice/transcribe", {"audio_base64": audio_b64, "language_code": "en-IN"}, token=patient_token)
    assert_test("Voice Speech Transcription", status == 200 and "transcribed_text" in data)

    # 21. Multilingual Translation
    status, data = request("POST", "/translate", {"text": "Please take your medication", "target_language": "hi"}, token=patient_token)
    assert_test("Multilingual Translation", status == 200 and "translated_text" in data)

    # 22. Voice Indic Languages
    status, data = request("GET", "/voice/languages")
    assert_test("Voice Indic Languages", status == 200 and len(data) >= 7)

    # 23. Voice Intent Interpretation
    status, data = request("POST", "/voice/interpret", {"text": "Play memory match", "language": "en-IN"}, token=patient_token)
    assert_test("Voice Intent Interpretation", status == 200 and data.get("intent") == "OPEN_GAME" and data.get("entity") == "MEMORY_MATCH")

    # 24. Voice Speech Synthesis
    status, data = request("POST", "/voice/synthesize", {"text": "Opening Memory Match", "language_code": "en-IN"}, token=patient_token)
    assert_test("Voice Speech Synthesis", status == 200 and "audio_base64" in data)

    print(f"\n📊 Summary: {passed}/{total} tests passed ({round(passed/total*100)}%)\n")
    return passed == total

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
