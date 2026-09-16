def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test User",
            "email": "pytest-user-002@example.com",
            "password": "TestPassword123!",
            "role": "patient",
            "phone": "9999999999",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == "pytest-user-002@example.com"
    assert "access_token" in data["token"]


def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "does-not-exist@example.com",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False


def test_protected_endpoint_without_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_get_me_success(client, patient_user):
    response = client.get(
        "/api/v1/auth/me",
        headers=patient_user["headers"],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "patient@example.com"