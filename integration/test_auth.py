"""INT-AUTH-001: registration, session lifecycle and profile updates."""

import os
import uuid

CLIENT_PASSWORD = os.getenv("INTEGRATION_CLIENT_PASSWORD", "Password123!")


def test_register_login_me_logout_flow(api):
    email = f"it-auth-{uuid.uuid4().hex}@agency.travel"
    register = api["user"].post(
        "/api/auth/register",
        json={"email": email, "password": CLIENT_PASSWORD},
    )
    assert register.status_code == 201, register.text
    session = register.json()["data"]
    assert session["jeton"]
    assert session["user"]["email"] == email
    assert session["user"]["role"] == "CLIENT"

    me = api["user"].get("/api/auth/me", token=session["jeton"])
    assert me.status_code == 200, me.text
    assert me.json()["data"]["email"] == email

    login = api["user"].post(
        "/api/auth/login",
        json={"email": email, "password": CLIENT_PASSWORD},
    )
    assert login.status_code == 200, login.text
    assert login.json()["data"]["user"]["id"] == session["user"]["id"]

    logout = api["user"].post("/api/auth/logout", token=login.json()["data"]["jeton"])
    assert logout.status_code == 200
    after = api["user"].get("/api/auth/me", token=login.json()["data"]["jeton"])
    assert after.status_code == 401
    assert after.json()["error"]["code"] == "UNAUTHENTICATED"


def test_profile_update_is_persisted(api, client):
    update = api["user"].post(
        "/api/auth/me",
        token=client["token"],
        json={
            "name": "Integration Tester",
            "phone": "+212600000099",
            "address": "1 Test Street, Casablanca",
        },
    )
    assert update.status_code == 200, update.text

    me = api["user"].get("/api/auth/me", token=client["token"])
    assert me.status_code == 200
    profile = me.json()["data"]
    assert profile["name"] == "Integration Tester"
    assert profile["phone"] == "+212600000099"


def test_duplicate_registration_is_rejected(api):
    email = f"it-dup-{uuid.uuid4().hex}@agency.travel"
    payload = {"email": email, "password": CLIENT_PASSWORD}
    first = api["user"].post("/api/auth/register", json=payload)
    assert first.status_code == 201
    second = api["user"].post("/api/auth/register", json=payload)
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "DUPLICATE"


def test_bad_credentials_return_401(api):
    response = api["user"].post(
        "/api/auth/login",
        json={"email": "admin@agency.travel", "password": "wrong-password"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"


def test_protected_profile_requires_token(api):
    response = api["user"].get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"
