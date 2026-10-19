import pytest
import json
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)


def _generate_test_token(user_id="user_test_123", email="testuser@example.com"):
    payload = {
        "sub": user_id,
        "email": email,
        "role": "authenticated"
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


def test_unauthenticated_profile_access_denied():
    """Verify endpoint rejects requests without Bearer token."""
    res = client.get("/api/user/profile")
    assert res.status_code == 401
    assert "Authentication required" in res.json()["detail"]


def test_authenticated_profile_flow():
    """Verify profile creation and retrieval with Supabase token."""
    token = _generate_test_token("user_sarah_connor", "sarah@cyberdyne.org")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch profile (auto-provisions on first call)
    res = client.get("/api/user/profile", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["auth_user_id"] == "user_sarah_connor"
    assert data["email"] == "sarah@cyberdyne.org"

    # 2. Update profile
    update_payload = {
        "display_name": "Sarah Connor",
        "current_country_code": "US",
        "current_role_title": "Security Analyst",
        "target_career_slug": "cybersecurity-analyst",
        "target_country_code": "US",
        "target_annual_salary": 115000,
        "weekly_study_hours": 15,
        "target_timeline_weeks": 16,
        "skills": [
            {"skill_slug": "python", "skill_name": "Python", "proficiency": "intermediate"},
            {"skill_slug": "sql", "skill_name": "SQL", "proficiency": "advanced"}
        ]
    }
    res_up = client.put("/api/user/profile", json=update_payload, headers=headers)
    assert res_up.status_code == 200
    up_data = res_up.json()
    assert up_data["display_name"] == "Sarah Connor"
    assert len(up_data["skills"]) == 2


def test_roadmap_save_and_progress_flow():
    """Verify saving a roadmap, listing it, and updating progress items."""
    token = _generate_test_token("user_alex_chen", "alex@careergps.ai")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Save Roadmap
    roadmap_payload = {
        "title": "My 12-Week Machine Learning Roadmap",
        "target_role_slug": "machine-learning-engineer",
        "target_role_title": "Machine Learning Engineer",
        "target_country_code": "US",
        "experience_level": "Entry-level",
        "total_weeks": 12,
        "weekly_hours": 15,
        "roadmap_data": {
            "career_goal": {"role": "Machine Learning Engineer", "country": "US"},
            "weekly_plan": [
                {
                    "week_number": 1,
                    "title": "Mathematics & Linear Algebra",
                    "skills": ["Math"],
                    "practice_exercises": ["Matrix multiplications in NumPy", "Gradient descent derivation"]
                },
                {
                    "week_number": 2,
                    "title": "Scikit-Learn Classifiers",
                    "skills": ["Machine Learning"],
                    "practice_exercises": ["Train Random Forest on tabular data"]
                }
            ]
        }
    }
    res_save = client.post("/api/user/roadmaps", json=roadmap_payload, headers=headers)
    assert res_save.status_code == 200
    saved_meta = res_save.json()
    roadmap_id = saved_meta["id"]
    assert saved_meta["total_tasks"] == 3
    assert saved_meta["completed_tasks"] == 0

    # 2. List Roadmaps
    res_list = client.get("/api/user/roadmaps", headers=headers)
    assert res_list.status_code == 200
    list_items = res_list.json()
    assert any(r["id"] == roadmap_id for r in list_items)

    # 3. Update Task Progress
    task_res = client.put(
        f"/api/user/roadmaps/{roadmap_id}/tasks/1/w1_t0",
        json={"is_completed": True, "actual_hours_spent": 4.5, "user_notes": "Completed exercises"},
        headers=headers
    )
    assert task_res.status_code == 200
    assert task_res.json()["is_completed"] is True

    # 4. Check Detail
    res_detail = client.get(f"/api/user/roadmaps/{roadmap_id}", headers=headers)
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["completion_percentage"] > 0
    assert detail["total_hours_invested"] == 4.5


def test_cross_user_isolation():
    """Ensure User B cannot access or modify User A's roadmaps."""
    token_a = _generate_test_token("user_alice", "alice@example.com")
    token_b = _generate_test_token("user_bob", "bob@example.com")

    # Alice saves roadmap
    res_save = client.post(
        "/api/user/roadmaps",
        json={
            "title": "Alice Secret Roadmap",
            "target_role_slug": "data-analyst",
            "target_role_title": "Data Analyst",
            "target_country_code": "US",
            "total_weeks": 8,
            "weekly_hours": 10,
            "roadmap_data": {"weekly_plan": []}
        },
        headers={"Authorization": f"Bearer {token_a}"}
    )
    alice_roadmap_id = res_save.json()["id"]

    # Bob attempts to access Alice's roadmap
    res_unauth = client.get(
        f"/api/user/roadmaps/{alice_roadmap_id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert res_unauth.status_code == 404


def test_product_analytics_telemetry_and_admin_dashboard():
    """Test client telemetry logging and internal admin analytics aggregation."""
    # 1. Log anonymous telemetry event
    res_event = client.post("/api/user/telemetry/event", json={
        "event_name": "career_planner_started",
        "session_id": "sess_unit_test_999",
        "role_slug": "data-scientist",
        "country_code": "US",
        "properties": {"source": "landing_cta"}
    })
    assert res_event.status_code == 200
    assert res_event.json()["status"] == "recorded"

    # 2. Query admin dashboard without key -> 403 Forbidden
    res_unauth = client.get("/api/user/admin/product-analytics")
    assert res_unauth.status_code == 403

    # 3. Query admin dashboard with correct key -> 200 OK
    res_admin = client.get(
        "/api/user/admin/product-analytics",
        headers={"X-Admin-Key": settings.ADMIN_API_KEY}
    )
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert "kpis" in data
    assert "funnel_analysis" in data
    assert len(data["funnel_analysis"]) == 4
