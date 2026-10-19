import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_careers():
    res = client.get("/api/careers")
    assert res.status_code == 200
    roles = res.json()
    assert len(roles) >= 6
    slugs = [r["slug"] for r in roles]
    assert "data-analyst" in slugs
    assert "software-engineer" in slugs


def test_get_countries():
    res = client.get("/api/countries")
    assert res.status_code == 200
    countries = res.json()
    iso_codes = [c["iso_code"] for c in countries]
    assert "US" in iso_codes
    assert "IN" in iso_codes


def test_get_jobs_summary():
    res = client.get("/api/jobs/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_postings"] > 0
    assert len(data["summaries"]) > 0

    # Test filtering by role and country
    res_filtered = client.get("/api/jobs/summary?role=data-analyst&country=US")
    assert res_filtered.status_code == 200
    data_filtered = res_filtered.json()
    assert len(data_filtered["summaries"]) == 1
    assert data_filtered["summaries"][0]["role_slug"] == "data-analyst"
    assert data_filtered["summaries"][0]["country_code"] == "US"


def test_get_skills_demand():
    res = client.get("/api/skills/demand?role=data-analyst&country=US&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["role_slug"] == "data-analyst"
    assert data["country_code"] == "US"
    assert len(data["skills"]) > 0
    # Rank check
    ranks = [s["skill_rank"] for s in data["skills"]]
    assert ranks == sorted(ranks)


def test_get_salaries_summary():
    res = client.get("/api/salaries/summary?role=data-analyst&country=US")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    item = data[0]
    assert item["role_slug"] == "data-analyst"
    assert item["country_code"] == "US"
    assert item["sample_size"] >= 10
    assert item["is_statistically_sufficient"] is True


def test_get_salaries_summary_insufficient_handling():
    # Test a combination with zero or low records
    res = client.get("/api/salaries/summary?role=cybersecurity-analyst&country=GB")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    item = data[0]
    if item["sample_size"] < 10:
        assert item["is_statistically_sufficient"] is False
        assert "Insufficient reliable salary observations" in item["explanation"]


def test_get_data_coverage():
    res = client.get("/api/data/coverage")
    assert res.status_code == 200
    data = res.json()
    assert data["total_records"] > 0
    assert len(data["sources"]) > 0
