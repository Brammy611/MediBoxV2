def test_register_and_login_flow(client):
    register_payload = {
        "email": "user@example.com",
        "password": "Secret123!",
        "role": "user",
    }

    register_response = client.post("/api/auth/register", json=register_payload)
    assert register_response.status_code == 201
    body = register_response.get_json()
    assert body["user"]["email"] == register_payload["email"]

    login_response = client.post(
        "/api/auth/login",
        json={"email": register_payload["email"], "password": register_payload["password"]},
    )
    assert login_response.status_code == 200
    login_body = login_response.get_json()
    assert "access_token" in login_body
    assert login_body["user"]["role"] == "user"

    token = login_body["access_token"]
    profile_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert profile_response.status_code == 200
    profile_body = profile_response.get_json()
    assert profile_body["user"]["email"] == register_payload["email"]


def test_login_rejects_invalid_credentials(client, create_user):
    user = create_user(email="login-test@example.com", password="CorrectHorseBatteryStaple")

    failed_response = client.post(
        "/api/auth/login",
        json={"email": user["email"], "password": "wrong"},
    )
    assert failed_response.status_code == 401
    error_body = failed_response.get_json()
    assert error_body["message"] == "invalid credentials"
