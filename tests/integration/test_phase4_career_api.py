import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_career_skills_prerequisites():
    res = client.get("/api/career/skills/prerequisites")
    assert res.status_code == 200
    data = res.json()
    assert len(data["nodes"]) > 0
    assert len(data["edges"]) > 0
    # Check that Python is prerequisite to Machine Learning
    edge_pairs = [(e["source"], e["target"]) for e in data["edges"]]
    assert ("python", "machine-learning") in edge_pairs


def test_career_profile_analyze():
    payload = {
        "target_role_slug": "data-scientist",
        "target_country_code": "US",
        "experience_level": "Entry-level",
        "current_skills": [
            {"skill_slug": "python", "proficiency": "intermediate"},
            {"skill_slug": "sql", "proficiency": "beginner"}
        ],
        "target_salary": 120000,
        "weekly_hours": 15,
        "target_weeks": 16,
        "current_role_slug": "data-analyst"
    }
    res = client.post("/api/career/profile/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["target_role"] == "Data Scientist"
    assert data["total_gaps"] > 0
    assert data["salary_evaluation"] is not None
    assert data["career_transition"] is not None
    assert data["career_transition"]["jaccard_similarity"] > 0


def test_career_skills_gap():
    payload = {
        "target_role_slug": "data-analyst",
        "target_country_code": "US",
        "experience_level": "Entry-level",
        "current_skills": [{"skill_slug": "sql", "proficiency": "advanced"}],
        "weekly_hours": 10,
        "target_weeks": 12
    }
    res = client.post("/api/career/skills/gap", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["target_role"] == "Data Analyst"
    assert len(data["prioritized_skills"]) > 0
    # SQL should not be marked missing
    sql_item = next((s for s in data["prioritized_skills"] if s["skill_slug"] == "sql"), None)
    if sql_item:
        assert sql_item["is_missing"] is False


def test_career_transition_analyze():
    payload = {
        "current_role_slug": "data-analyst",
        "target_role_slug": "data-scientist",
        "current_skills": ["sql", "excel", "power-bi", "python"]
    }
    res = client.post("/api/career/transition/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["current_role"] == "Data Analyst"
    assert data["target_role"] == "Data Scientist"
    assert "sql" in [s.lower() for s in data["transferable_skills"]]
    assert len(data["missing_target_skills"]) > 0


def test_career_salary_evaluate_realistic():
    payload = {
        "target_role_slug": "data-analyst",
        "target_country_code": "US",
        "target_salary": 75000
    }
    res = client.post("/api/career/salary/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["evaluation_status"] in ["REALISTIC_MARKET", "ABOVE_AVERAGE", "CONSERVATIVE", "AMBITIOUS_HIGH"]
    assert data["sample_size"] >= 10


def test_career_resources():
    res = client.get("/api/career/resources")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert all("http" in r["url"] for r in data)


def test_career_roadmap_generate_adaptive():
    payload = {
        "target_role_slug": "machine-learning-engineer",
        "target_country_code": "US",
        "experience_level": "Entry-level",
        "current_skills": [{"skill_slug": "python", "proficiency": "intermediate"}],
        "weekly_hours": 12,
        "target_weeks": 20
    }
    res = client.post("/api/career/roadmap/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["career_goal"]["role"] == "Machine Learning Engineer"
    assert len(data["weekly_plan"]) > 0
    assert len(data["portfolio_projects"]) > 0
    # First week must be topological prerequisite before deep learning/pytorch
    first_week_skills = data["weekly_plan"][0]["skills"]
    assert any(s in ["Statistics", "Statistical Analysis", "Machine Learning"] for s in first_week_skills)
