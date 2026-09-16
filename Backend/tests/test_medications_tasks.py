from datetime import date


def test_prescription_and_medication_lifecycle(
    client,
    patient_user,
    doctor_user,
    setup_relationships,
):
    patient_id = str(patient_user["user"].id)

    # 1. Doctor creates prescription
    rx_res = client.post(
        "/api/v1/prescriptions",
        headers=doctor_user["headers"],
        json={
            "patient_id": patient_id,
            "medicine_name": "Donepezil",
            "dosage": "5mg",
            "route": "oral",
            "instructions": "Take once at bedtime",
            "start_date": str(date.today()),
        },
    )
    assert rx_res.status_code == 201
    rx_id = rx_res.json()["id"]

    # 2. Doctor creates medication schedule
    sched_res = client.post(
        "/api/v1/medications/schedules",
        headers=doctor_user["headers"],
        json={
            "prescription_id": rx_id,
            "patient_id": patient_id,
            "medicine_name": "Donepezil",
            "dosage": "5mg",
            "scheduled_time": "21:00:00",
            "frequency": "daily",
            "start_date": str(date.today()),
            "reminder_enabled": True,
        },
    )
    assert sched_res.status_code == 201
    sched_id = sched_res.json()["id"]

    # 3. Patient generates log (previously caused runtime crash)
    log_res = client.post(
        f"/api/v1/medications/schedules/{sched_id}/generate-log",
        headers=patient_user["headers"],
    )
    assert log_res.status_code == 201
    log_data = log_res.json()
    assert log_data["status"] == "scheduled"
    log_id = log_data["id"]

    # 4. Patient updates log status to taken
    action_res = client.post(
        f"/api/v1/medications/logs/{log_id}/status",
        headers=patient_user["headers"],
        json={"status": "taken"},
    )
    assert action_res.status_code == 200
    assert action_res.json()["status"] == "taken"
    assert action_res.json()["taken_at"] is not None

    # 5. Get today's logs (previously caused query crash)
    today_res = client.get(
        f"/api/v1/medications/logs/patient/{patient_id}/today",
        headers=patient_user["headers"],
    )
    assert today_res.status_code == 200
    assert len(today_res.json()) >= 1


def test_task_lifecycle(
    client,
    patient_user,
    doctor_user,
    setup_relationships,
):
    patient_id = str(patient_user["user"].id)

    # Doctor creates a cognitive task
    task_res = client.post(
        "/api/v1/tasks",
        headers=doctor_user["headers"],
        json={
            "patient_id": patient_id,
            "title": "Morning Memory Walk",
            "description": "Walk around garden and identify 3 plant types",
            "scheduled_time": "08:00:00",
            "priority": "normal",
            "recurrence": "daily",
            "start_date": str(date.today()),
        },
    )
    assert task_res.status_code == 201
    task_id = task_res.json()["id"]

    # Patient completes the task
    comp_res = client.post(
        f"/api/v1/tasks/{task_id}/complete",
        headers=patient_user["headers"],
    )
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "completed"

    # Reset task
    reset_res = client.post(
        f"/api/v1/tasks/{task_id}/reset",
        headers=doctor_user["headers"],
    )
    assert reset_res.status_code == 200
    assert reset_res.json()["status"] == "pending"
