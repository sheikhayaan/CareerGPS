"""
Phase 4 Evaluation Test Suite: 15 User Archetype Profiles.

Validates the full recommendation pipeline across diverse scenarios via FastAPI endpoints
and underlying ML engines:
1. Complete Beginner (Student) targeting Data Analyst.
2. Career Switcher (Software Engineer -> ML Engineer).
3. Sparse Data Country (Germany) targeting Cybersecurity Analyst.
4. Unrealistic High Salary Target ($300k entry-level).
5. Unrealistic Low Salary Target ($5k entry-level).
6. Minimal Weekly Study Hours (3 hours/week).
7. High Weekly Study Hours (35 hours/week).
8. Advanced Practitioner with 90% skills already mastered.
9. Cross-disciplinary transition (Business Analyst -> Data Scientist).
10. UK Data Scientist with empirical sample support.
11. India Software Engineer with local currency benchmarks.
12. Zero current skills provided (Cold Start).
13. Graph Prerequisite Ordering (Python before PyTorch).
14. Unknown/Unmapped Skill gracefully appended.
15. Nonexistent Career/Country fallback behavior (404/Unknown handling).
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from ml.recommendations.knowledge_graph import SkillKnowledgeGraph
from ml.recommendations.salary_reality_checker import SalaryRealityChecker
from ml.recommendations.transition_analyzer import CareerTransitionAnalyzer

client = TestClient(app)


# 1. Complete Beginner (Student) targeting Data Analyst
def test_archetype_complete_beginner():
    payload = {
        "target_role_slug": "data-analyst",
        "target_country_code": "US",
        "experience_level": "Entry-level",
        "current_skills": [],
        "weekly_hours": 10,
        "target_weeks": 16,
        "target_salary": 65000,
    }
    res = client.post("/api/career/profile/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["target_role"] == "Data Analyst"
    assert data["total_gaps"] > 0
    # SQL or Python or Excel must be present
    gap_slugs = [s["skill_slug"] for s in data["prioritized_skills"]]
    assert any(s in ["sql", "python", "excel", "power-bi"] for s in gap_slugs)


# 2. Career Switcher (Software Engineer -> ML Engineer)
def test_archetype_career_switcher():
    analyzer = CareerTransitionAnalyzer()
    curr_skills = ["python", "git", "docker", "sql"]
    target_skills = ["python", "machine-learning", "pytorch", "deep-learning", "sql", "math"]
    res = analyzer.analyze_transition("Software Engineer", "Machine Learning Engineer", curr_skills, target_skills)
    assert res["jaccard_similarity"] > 0.2
    assert "python" in res["transferable_skills"]
    assert "machine-learning" in res["missing_target_skills"]


# 3. Sparse Data Country (Germany) targeting Cybersecurity Analyst
def test_archetype_sparse_country():
    checker = SalaryRealityChecker()
    # Sparse empirical data scenario
    res = checker.evaluate_target(
        target_salary=60000,
        empirical_stats={"is_sufficient": False, "sample_size": 3},
        government_benchmark={"median_salary": 58000, "source": "German Benchmark Fallback"},
        currency="EUR"
    )
    assert res["evaluation_status"] in ["GOVERNMENT_BENCHMARK_ALIGNED", "NORMAL"]
    assert res["sample_size"] == 3


# 4. Unrealistic High Salary Target ($300k entry-level)
def test_archetype_unrealistic_high_salary():
    checker = SalaryRealityChecker()
    res = checker.evaluate_target(
        target_salary=300000,
        empirical_stats={"is_sufficient": True, "p25": 60000, "median": 75000, "p75": 90000, "sample_size": 50},
        government_benchmark=None,
        currency="USD"
    )
    assert res["evaluation_status"] == "AMBITIOUS_HIGH"
    assert "higher than the observed 75th percentile" in res["message"]


# 5. Unrealistic Low Salary Target ($5k entry-level US)
def test_archetype_unrealistic_low_salary():
    checker = SalaryRealityChecker()
    res = checker.evaluate_target(
        target_salary=5000,
        empirical_stats={"is_sufficient": True, "p25": 60000, "median": 75000, "p75": 90000, "sample_size": 50},
        government_benchmark=None,
        currency="USD"
    )
    assert res["evaluation_status"] == "CONSERVATIVE"
    assert "below the observed 25th percentile" in res["message"]


# 6. Minimal Weekly Study Hours (3 hours/week -> Feasibility warning/deferred skills)
def test_archetype_minimal_weekly_hours():
    payload = {
        "target_role_slug": "data-scientist",
        "target_country_code": "US",
        "experience_level": "Entry-level",
        "current_skills": [],
        "weekly_hours": 3,
        "target_weeks": 8
    }
    res = client.post("/api/career/roadmap/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    # When weekly hours are low, deferred_skills or limitations are flagged
    assert len(data["deferred_skills"]) > 0 or len(data["limitations"]) > 0


# 7. High Weekly Hours (35 hours/week -> Dense curriculum)
def test_archetype_high_weekly_hours():
    payload = {
        "target_role_slug": "data-analyst",
        "target_country_code": "US",
        "experience_level": "Entry-level",
        "current_skills": [],
        "weekly_hours": 35,
        "target_weeks": 12
    }
    res = client.post("/api/career/roadmap/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    # High hours means more skills fit into the planned weeks
    assert len(data["weekly_plan"]) > 0


# 8. Advanced Practitioner (90% skills already mastered)
def test_archetype_advanced_practitioner():
    payload = {
        "target_role_slug": "data-scientist",
        "target_country_code": "US",
        "experience_level": "Senior",
        "current_skills": [
            {"skill_slug": "python", "proficiency": "advanced"},
            {"skill_slug": "sql", "proficiency": "advanced"},
            {"skill_slug": "machine-learning", "proficiency": "advanced"},
            {"skill_slug": "pandas", "proficiency": "advanced"},
            {"skill_slug": "git", "proficiency": "advanced"},
            {"skill_slug": "statistics", "proficiency": "advanced"},
        ],
        "weekly_hours": 10,
        "target_weeks": 8
    }
    res = client.post("/api/career/skills/gap", json=payload)
    assert res.status_code == 200
    data = res.json()
    # Missing skills should be few
    missing = [s for s in data["prioritized_skills"] if s["is_missing"]]
    assert len(missing) < len(data["prioritized_skills"])


# 9. Cross-disciplinary transition (Business Analyst -> Data Scientist)
def test_archetype_ba_to_ds():
    payload = {
        "current_role_slug": "business-analyst",
        "target_role_slug": "data-scientist",
        "current_skills": ["sql", "excel", "power-bi", "business-analysis"]
    }
    res = client.post("/api/career/transition/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["transition_difficulty"] in ["Moderate", "High"]
    assert len(data["missing_target_skills"]) > 0


# 10. UK Data Scientist Empirical Sample Support
def test_archetype_uk_data_scientist():
    payload = {
        "target_role_slug": "data-scientist",
        "target_country_code": "GB",
        "target_salary": 60000
    }
    res = client.post("/api/career/salary/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["currency"] in ["GBP", "USD"]


# 11. India Software Engineer with local currency benchmarks
def test_archetype_india_swe():
    payload = {
        "target_role_slug": "software-engineer",
        "target_country_code": "IN",
        "target_salary": 1800000
    }
    res = client.post("/api/career/salary/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["target_salary"] == 1800000


# 12. Zero Current Skills Provided (Cold Start)
def test_archetype_cold_start():
    payload = {
        "target_role_slug": "software-engineer",
        "target_country_code": "US",
        "experience_level": "Entry-level",
        "current_skills": [],
        "weekly_hours": 10,
        "target_weeks": 12
    }
    res = client.post("/api/career/skills/gap", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert all(s["is_missing"] for s in data["prioritized_skills"])


# 13. Graph Prerequisite Ordering (Python before PyTorch)
def test_archetype_prerequisite_ordering():
    kg = SkillKnowledgeGraph()
    prereqs_pytorch = kg.get_prerequisites("pytorch", recursive=True)
    assert "python" in prereqs_pytorch
    # In topological sorting, python must appear before pytorch
    sorted_order = kg.topological_skill_sort(["pytorch", "python", "deep-learning"])
    assert sorted_order.index("python") < sorted_order.index("pytorch")


# 14. Unknown/Unmapped Skill Gracefully Handled
def test_archetype_unmapped_skill_handling():
    kg = SkillKnowledgeGraph()
    # An unmapped skill should not crash topological sort; it should be safely included
    ordered = kg.topological_skill_sort(["python", "exotic_quantum_framework"])
    assert "python" in ordered
    assert "exotic_quantum_framework" in ordered


# 15. Nonexistent Career/Country Fallback Behavior
def test_archetype_fallback_behavior():
    payload = {
        "target_role_slug": "quantum-astronaut",
        "target_country_code": "ATLANTIS",
        "experience_level": "Entry-level",
        "current_skills": [],
        "weekly_hours": 10,
        "target_weeks": 12,
        "target_salary": 100000,
    }
    res = client.post("/api/career/profile/analyze", json=payload)
    assert res.status_code == 404
