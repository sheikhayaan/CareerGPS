from datetime import date
import pytest
from pipelines.transform.transformers import TextCleaner, SkillExtractor, Normalizer
from pipelines.validation.validator import RawJobRecord, DataQualityValidator


def test_text_cleaner():
    raw_html = "<p>We are hiring a <strong>Senior Data Analyst</strong>! &nbsp;</p>"
    cleaned = TextCleaner.clean(raw_html)
    assert "<p>" not in cleaned
    assert "Senior Data Analyst" in cleaned


def test_skill_extractor_boundary():
    # Enforces regex word boundary so 'R' does not match 'for' or 'developer'
    test_skills = [
        {"slug": "r", "name": "R", "aliases": ["r programming", "r-project"]},
        {"slug": "python", "name": "Python", "aliases": ["python3", "py"]},
        {"slug": "sql", "name": "SQL", "aliases": ["postgresql", "mysql"]},
    ]
    extractor = SkillExtractor(test_skills)

    text1 = "Looking for a developer with strong Python and SQL knowledge."
    extracted1 = extractor.extract_skills(text1)
    assert "python" in extracted1
    assert "sql" in extracted1
    assert "r" not in extracted1  # 'for' should not match 'R'

    text2 = "Proficiency in R programming and statistical tests."
    extracted2 = extractor.extract_skills(text2)
    assert "r" in extracted2


def test_normalizer_salary():
    # Hourly test
    min_sal, max_sal, norm_annual = Normalizer.normalize_salary(40.0, 50.0, "HOURLY")
    assert min_sal == 40.0 * 2080
    assert max_sal == 50.0 * 2080
    assert norm_annual == 45.0 * 2080

    # Monthly test
    min_sal, max_sal, norm_annual = Normalizer.normalize_salary(5000.0, 6000.0, "MONTHLY")
    assert min_sal == 60000.0
    assert norm_annual == 66000.0


def test_normalizer_experience():
    assert Normalizer.classify_experience("Lead Data Engineer") == "Lead"
    assert Normalizer.classify_experience("Senior Analytics Consultant") == "Senior"
    assert Normalizer.classify_experience("Junior Data Scientist") == "Entry"
    assert Normalizer.classify_experience("Software Developer") == "Mid"


def test_data_quality_validator_duplicates_and_sanity():
    validator = DataQualityValidator()
    rec1 = RawJobRecord(
        source_name="Test Source",
        external_id="101",
        role_slug="data-analyst",
        country_code="US",
        company_name="Acme Corp",
        raw_title="Data Analyst",
        raw_description="Requires SQL and Python",
        posting_date=date.today(),
        salary_min=70000.0,
        salary_max=90000.0,
        salary_currency="USD"
    )
    fp = "hash123"

    # First pass: valid
    assert validator.validate_record(rec1, fp) is True

    # Second pass: duplicate detected
    assert validator.validate_record(rec1, fp) is False
    assert validator.duplicate_count == 1

    report = validator.generate_report()
    assert report["total_records_evaluated"] == 2
    assert report["passed_records"] == 1
    assert report["duplicates_detected"] == 1
