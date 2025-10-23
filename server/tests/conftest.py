import sys
from pathlib import Path

import mongomock
import pytest
from flask import Flask
from flask_jwt_extended import JWTManager

# Ensure the application modules are importable when tests run from this package
ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from routes import alerts, auth, health, medibox, medicines, reminders  # noqa: E402  pylint: disable=wrong-import-position


@pytest.fixture
def app(monkeypatch):
    """Create a Flask app instance backed by an in-memory Mongo database."""

    test_app = Flask(__name__)
    test_app.config.update(
        TESTING=True,
        JWT_SECRET_KEY="test-secret",
    )

    mongo_client = mongomock.MongoClient()
    database = mongo_client["medibox_test"]

    # Ensure auth routes use the in-memory client rather than a real Mongo connection
    monkeypatch.setattr(auth, "MongoClient", lambda uri: mongo_client)

    test_app.config["MONGO_URI"] = "mongodb://localhost/medibox_test"
    test_app.config["MONGO_DB"] = database

    JWTManager(test_app)

    test_app.register_blueprint(auth.bp)
    test_app.register_blueprint(medibox.create_medibox_blueprint(database))
    test_app.register_blueprint(reminders.create_reminder_blueprint(database))
    test_app.register_blueprint(health.bp)
    test_app.register_blueprint(medicines.bp)
    test_app.register_blueprint(alerts.alerts_bp)

    yield test_app


@pytest.fixture
def client(app):
    """Return a Flask test client bound to the app fixture."""

    return app.test_client()


@pytest.fixture
def create_user(client):
    """Factory fixture to create and register a user for tests."""

    def _create_user(email="alice@example.com", password="Password123!", role="user"):
        payload = {"email": email, "password": password, "role": role}
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code in {201, 409}
        return {
            "email": email,
            "password": password,
            "role": role,
            "already_exists": response.status_code == 409,
        }

    return _create_user


@pytest.fixture
def auth_headers(client, create_user):
    """Register a default user and return authorization headers."""

    user = create_user()
    login_response = client.post(
        "/api/auth/login",
        json={"email": user["email"], "password": user["password"]},
    )
    assert login_response.status_code == 200
    token = login_response.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
