import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_analytics_overview():
    res = client.get("/api/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_postings"] > 0
    assert data["total_roles"] >= 6
    assert data["total_countries"] >= 4
    assert data["reliable_cohorts_count"] > 0


def test_analytics_skill_demand():
    res = client.get("/api/analytics/skills/demand?role=data-analyst&country=US&limit=5")
    assert res.status_code == 200
    data = res.json()
    assert data["role_slug"] == "data-analyst"
    assert data["country_code"] == "US"
    assert len(data["skills"]) <= 5
    if len(data["skills"]) > 0:
        assert data["skills"][0]["demand_percentage"] > 0


def test_analytics_skill_cooccurrence():
    res = client.get("/api/analytics/skills/cooccurrence?limit=5")
    assert res.status_code == 200
    data = res.json()
    assert len(data["top_pairs"]) <= 5
    if len(data["top_pairs"]) > 0:
        pair = data["top_pairs"][0]
        assert "skill_a" in pair
        assert "skill_b" in pair
        assert pair["cooccurrence_count"] >= 1


def test_analytics_careers_comparison():
    res = client.get("/api/analytics/careers/comparison?role_a=data-analyst&role_b=data-scientist")
    assert res.status_code == 200
    data = res.json()
    assert data["jaccard_similarity"] >= 0.0
    assert data["jaccard_similarity"] <= 1.0
    assert len(data["shared_skills"]) > 0
    assert "SQL" in data["shared_skills"] or "sql" in [s.lower() for s in data["shared_skills"]]


def test_analytics_countries_comparison():
    res = client.get("/api/analytics/countries/comparison?role=data-analyst")
    assert res.status_code == 200
    data = res.json()
    assert len(data["comparisons"]) >= 4
    us_item = next(c for c in data["comparisons"] if c["country_code"] == "US")
    assert us_item["is_sufficient"] is True
    assert us_item["median_salary"] is not None


def test_analytics_salaries_distribution_detail():
    res = client.get("/api/analytics/salaries/distribution?role=data-analyst&country=US")
    assert res.status_code == 200
    data = res.json()
    assert data["is_sufficient"] is True
    assert data["median"] is not None
    assert data["iqr"] is not None
    assert data["bootstrap_ci"] is not None
    assert data["bootstrap_ci"]["applicable"] is True
    assert data["bootstrap_ci"]["ci_lower"] <= data["bootstrap_ci"]["ci_upper"]


def test_analytics_market_trends():
    res = client.get("/api/analytics/market/trends")
    assert res.status_code == 200
    data = res.json()
    assert len(data["data_points"]) > 0


def test_analytics_data_quality():
    res = client.get("/api/analytics/data-quality")
    assert res.status_code == 200
    data = res.json()
    assert data["total_evaluated_records"] > 0
    assert data["salary_disclosure_pct"] > 0.0
