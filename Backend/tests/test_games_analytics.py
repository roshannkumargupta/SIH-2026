def test_cognitive_games_and_analytics(
    client,
    patient_user,
    doctor_user,
    setup_relationships,
):
    patient_id = str(patient_user["user"].id)

    # 1. Get available game types
    types_res = client.get("/api/v1/games/types")
    assert types_res.status_code == 200
    assert len(types_res.json()) >= 4

    # 2. Submit a memory game session
    game_res1 = client.post(
        "/api/v1/games/sessions",
        headers=patient_user["headers"],
        json={
            "game_type": "memory_match",
            "game_id": "session_001",
            "score": 850,
            "accuracy": 92.5,
            "duration_seconds": 120,
            "difficulty": "medium",
            "level_achieved": 3,
            "metrics": {"reaction_time_ms": 450, "mistakes": 2},
        },
    )
    assert game_res1.status_code == 201
    assert game_res1.json()["score"] == 850

    # 3. Submit a sequence attention game session
    game_res2 = client.post(
        "/api/v1/games/sessions",
        headers=patient_user["headers"],
        json={
            "game_type": "pattern_sequence",
            "game_id": "session_002",
            "score": 900,
            "accuracy": 88.0,
            "duration_seconds": 95,
            "difficulty": "hard",
            "level_achieved": 4,
            "metrics": {"reaction_time_ms": 380, "mistakes": 1},
        },
    )
    assert game_res2.status_code == 201

    # 4. Get game summary
    summary_res = client.get(
        f"/api/v1/games/sessions/patient/{patient_id}/summary",
        headers=patient_user["headers"],
    )
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_sessions"] == 2
    assert summary["average_score"] == 875.0
    assert summary["average_accuracy"] == 90.25

    # 5. Doctor triggers cognitive assessment
    assess_res = client.post(
        f"/api/v1/analytics/patient/{patient_id}/assess",
        headers=doctor_user["headers"],
    )
    assert assess_res.status_code == 201
    assess_data = assess_res.json()
    assert assess_data["overall_score"] >= 0.0
    assert assess_data["risk_level"] in ("low", "moderate", "high", "critical")
    assert len(assess_data["insights"]) > 0

    # 6. Retrieve latest assessment
    latest_res = client.get(
        f"/api/v1/analytics/patient/{patient_id}/latest",
        headers=patient_user["headers"],
    )
    assert latest_res.status_code == 200
    assert latest_res.json()["overall_score"] == assess_data["overall_score"]

    # 7. Retrieve cognitive trends
    trends_res = client.get(
        f"/api/v1/analytics/patient/{patient_id}/trends",
        headers=patient_user["headers"],
    )
    assert trends_res.status_code == 200
    assert len(trends_res.json()["trends"]) >= 1
