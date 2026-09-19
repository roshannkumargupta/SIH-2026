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

    # 2. Submit real game sessions covering clinical domains
    # Game 1: card-matching (Memory + Attention)
    game_res1 = client.post(
        "/api/v1/games/sessions",
        headers=patient_user["headers"],
        json={
            "game_type": "card-matching",
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

    # Game 2: tower-of-hanoi (Executive Function + Visuospatial)
    game_res2 = client.post(
        "/api/v1/games/sessions",
        headers=patient_user["headers"],
        json={
            "game_type": "tower-of-hanoi",
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

    # Game 3: word-scramble (Language)
    game_res3 = client.post(
        "/api/v1/games/sessions",
        headers=patient_user["headers"],
        json={
            "game_type": "word-scramble",
            "game_id": "session_003",
            "score": 780,
            "accuracy": 85.0,
            "duration_seconds": 110,
            "difficulty": "medium",
            "level_achieved": 2,
            "metrics": {"reaction_time_ms": 500, "mistakes": 3},
        },
    )
    assert game_res3.status_code == 201

    # 3. Get game summary
    summary_res = client.get(
        f"/api/v1/games/sessions/patient/{patient_id}/summary",
        headers=patient_user["headers"],
    )
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_sessions"] == 3
    assert summary["average_score"] == 843.33

    # 4. Doctor triggers cognitive assessment
    assess_res = client.post(
        f"/api/v1/analytics/patient/{patient_id}/assess",
        headers=doctor_user["headers"],
    )
    assert assess_res.status_code == 201
    assess_data = assess_res.json()

    # All 5 clinical domains have data because 3 games covered them all!
    assert assess_data["memory_score"] is not None
    assert assess_data["attention_score"] is not None
    assert assess_data["executive_function_score"] is not None
    assert assess_data["language_score"] is not None
    assert assess_data["visuospatial_score"] is not None

    # Composite overall score and risk level (computed when >= 3 domains active)
    assert assess_data["overall_score"] is not None
    assert assess_data["overall_score"] >= 0.0
    assert assess_data["risk_level"] in ("low", "moderate", "high", "critical")
    assert assess_data["model_version"] == "2.0-heuristic"
    assert "heuristic" in assess_data["method_description"].lower()

    # Adherence telemetry is decoupled from cognition
    assert "adherence" in assess_data
    assert len(assess_data["insights"]) > 0

    # 5. Retrieve latest assessment as patient
    latest_res = client.get(
        f"/api/v1/analytics/patient/{patient_id}/latest",
        headers=patient_user["headers"],
    )
    assert latest_res.status_code == 200
    assert latest_res.json()["overall_score"] == assess_data["overall_score"]
    assert latest_res.json()["visuospatial_score"] == assess_data["visuospatial_score"]

    # 6. Retrieve cognitive trends
    trends_res = client.get(
        f"/api/v1/analytics/patient/{patient_id}/trends?days=90",
        headers=patient_user["headers"],
    )
    assert trends_res.status_code == 200
    trends_data = trends_res.json()
    assert len(trends_data["trends"]) >= 1
    assert "domain_slopes" in trends_data
    assert "visuospatial" in trends_data["domain_slopes"]
    assert "decline_alert_active" in trends_data
