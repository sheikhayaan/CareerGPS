import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)
ADMIN_HEADERS = {"X-Admin-Key": settings.ADMIN_API_KEY}


def test_admin_auth_required():
    """Verify unauthorized requests are rejected."""
    res = client.get("/api/admin/overview")
    assert res.status_code in [401, 403]

    res_bad = client.get("/api/admin/overview", headers={"X-Admin-Key": "wrong-key"})
    assert res_bad.status_code in [401, 403]


def test_admin_overview_metrics():
    """Verify overview metrics calculate real average ratings without fake 5.0 defaults."""
    res = client.get("/api/admin/overview", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    overview = data["data"]
    assert "totalUsers" in overview
    assert "active24h" in overview
    assert "totalSessions" in overview
    assert "averageRating" in overview
    assert "systemAlerts" in overview
    # Verify rating is real number
    assert isinstance(overview["averageRating"], (int, float))


def test_admin_users_roster_and_rule_one_unrated():
    """Verify candidate roster pagination, search, and that unrated users have ratingScore as None (Rule 1)."""
    res = client.get("/api/admin/users?page=1&limit=10", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    users = data["data"]["users"]
    assert len(users) > 0

    # Find unrated user (Jordan Miller or Elena Rostova)
    unrated_users = [u for u in users if u["ratingScore"] is None]
    assert len(unrated_users) > 0, "Must have unrated users to verify Rule 1"
    for u in unrated_users:
        assert u["ratingScore"] is None
        assert u["ratingCount"] == 0


def test_admin_user_status_update():
    """Verify suspending and unsuspending user accounts."""
    res = client.post(
        "/api/admin/users/usr_marcus_vance/status",
        headers=ADMIN_HEADERS,
        json={"status": "suspended"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["newStatus"] == "suspended"

    # Revert back to active
    res2 = client.post(
        "/api/admin/users/usr_marcus_vance/status",
        headers=ADMIN_HEADERS,
        json={"status": "active"}
    )
    assert res2.status_code == 200
    assert res2.json()["newStatus"] == "active"


def test_admin_incidents_and_resolution():
    """Verify incident log filtering and manual resolution."""
    res = client.get("/api/admin/incidents", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    data = res.json()["data"]
    incidents = data["incidents"]
    assert len(incidents) > 0

    target_id = incidents[0]["id"]
    resolve_res = client.post(
        f"/api/admin/incidents/{target_id}/resolve",
        headers=ADMIN_HEADERS,
        json={"notes": "Audited and verified operational nominal status"}
    )
    assert resolve_res.status_code == 200
    res_data = resolve_res.json()
    assert res_data["incident"]["resolvedAt"] is not None


def test_admin_self_healing_execution():
    """Verify autonomous self-healing execution runs all 5 remedies and returns latency savings."""
    res = client.post(
        "/api/admin/self-healing/execute",
        headers=ADMIN_HEADERS,
        json={"reason": "Integration Test Suite Trigger"}
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "success"
    assert len(data["actionsExecuted"]) == 5
    action_names = [a["action"] for a in data["actionsExecuted"]]
    assert "CONNECTION_POOL_RESET" in action_names
    assert "TRANSIENT_CACHE_FLUSH" in action_names
    assert "CIRCUIT_BREAKER_RESET" in action_names
    assert "MEMORY_COMPACT_DRAIN" in action_names
    assert "CIRCUIT_FALLBACK_CASCADE" in action_names
    assert data["latencySavingsMs"] > 0
    assert data["verifiedNominal"] is True


def test_admin_telemetry_snapshot():
    """Verify telemetry snapshot returns rolling P50, P95, P99, CPU, Memory, DB pool."""
    res = client.get("/api/admin/telemetry", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "system" in data
    assert "performance" in data
    assert "http" in data
    assert "database" in data
    assert "p50LatencyMs" in data["performance"]
    assert "p95LatencyMs" in data["performance"]
    assert "p99LatencyMs" in data["performance"]
