import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_get_roles():
    response = client.get("/api/v1/roles")
    assert response.status_code == 200
    roles = response.json()
    assert len(roles) >= 6
    slugs = [r["slug"] for r in roles]
    assert "data-analyst" in slugs
    assert "data-scientist" in slugs


def test_get_countries():
    response = client.get("/api/v1/countries")
    assert response.status_code == 200
    countries = response.json()
    iso_codes = [c["iso_code"] for c in countries]
    assert "US" in iso_codes
    assert "IN" in iso_codes


def test_get_intelligence_data_analyst_us():
    response = client.get("/api/v1/intelligence?role=data-analyst&country=US")
    assert response.status_code == 200
    intel = response.json()
    assert intel["role"]["slug"] == "data-analyst"
    assert intel["country"]["iso_code"] == "US"
    assert intel["observed_postings_count"] >= 10
    
    # Check salary percentiles
    sal_dist = intel["salary_distribution"]
    assert sal_dist["is_sufficient"] is True
    assert sal_dist["median"] is not None
    assert sal_dist["p25"] < sal_dist["median"] < sal_dist["p75"]

    # Check top skills
    assert len(intel["top_skills"]) > 0


def test_roadmap_generation_realistic():
    payload = {
        "role_slug": "data-analyst",
        "country_code": "US",
        "current_skills": ["sql"],
        "weekly_hours": 15,
        "target_weeks": 12
    }
    response = client.post("/api/v1/roadmap/generate", json=payload)
    assert response.status_code == 200
    roadmap = response.json()
    assert roadmap["role_title"] == "Data Analyst"
    assert len(roadmap["tasks"]) > 0
    assert "sql" not in [s.lower() for s in roadmap["missing_skills"]]
