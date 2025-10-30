import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # Reset activities before each test
    for activity in activities.values():
        activity['participants'] = [p for p in activity['participants'] if p.endswith('@mergington.edu')]


def test_signup_and_unregister():
    activity = "Chess Club"
    email = "testuser@mergington.edu"

    # Ensure not already signed up
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]
    assert "Signed up" in resp.json()["message"]

    # Duplicate signup should fail
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400
    assert "already signed up" in resp2.json()["detail"]

    # Unregister
    resp3 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp3.status_code == 200
    assert email not in activities[activity]["participants"]
    assert "Unregistered" in resp3.json()["message"]

    # Unregister again should fail
    resp4 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp4.status_code == 404
    assert "Participant not found" in resp4.json()["detail"]


def test_signup_invalid_activity():
    resp = client.post("/activities/Nonexistent/signup?email=nouser@mergington.edu")
    assert resp.status_code == 404
    assert "Activity not found" in resp.json()["detail"]


def test_unregister_invalid_activity():
    resp = client.delete("/activities/Nonexistent/participants?email=nouser@mergington.edu")
    assert resp.status_code == 404
    assert "Activity not found" in resp.json()["detail"]
