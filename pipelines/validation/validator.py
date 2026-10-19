import logging
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)


class RawJobRecord(BaseModel):
    source_name: str
    external_id: Optional[str] = None
    role_slug: str
    country_code: str
    city_name: Optional[str] = None
    company_name: str
    raw_title: str
    raw_description: str
    posting_date: date
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    salary_period: str = "YEARLY"

    @field_validator("country_code")
    def validate_country(cls, v: str) -> str:
        code = v.upper().strip()
        if code not in {"US", "IN", "GB", "DE"}:
            raise ValueError(f"Country code {code} is not within initial supported scope (US, IN, GB, DE)")
        return code

    @field_validator("salary_min", "salary_max")
    def validate_positive_salaries(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Salary value cannot be negative")
        return v


class DataQualityValidator:
    """
    Automated Data Quality Engine evaluating:
    - Missingness rates
    - Invalid salaries & currency mismatches
    - Duplicate fingerprints
    - Geographic & temporal validity
    """

    SUPPORTED_CURRENCIES = {"USD", "INR", "GBP", "EUR"}

    def __init__(self):
        self.total_evaluated = 0
        self.missing_salary_count = 0
        self.invalid_salary_count = 0
        self.duplicate_count = 0
        self.passed_count = 0
        self.seen_fingerprints = set()
        self.issues: List[str] = []

    def validate_record(self, record: RawJobRecord, fingerprint: str) -> bool:
        self.total_evaluated += 1

        if fingerprint in self.seen_fingerprints:
            self.duplicate_count += 1
            self.issues.append(f"Duplicate posting detected: {record.raw_title} ({record.company_name})")
            return False
        self.seen_fingerprints.add(fingerprint)

        # Check salary validity
        if record.salary_min is None and record.salary_max is None:
            self.missing_salary_count += 1
        else:
            if record.salary_currency and record.salary_currency.upper() not in self.SUPPORTED_CURRENCIES:
                self.invalid_salary_count += 1
                self.issues.append(f"Unsupported currency: {record.salary_currency}")
                return False

            if record.salary_min and record.salary_max and record.salary_min > record.salary_max:
                self.invalid_salary_count += 1
                self.issues.append(f"Invalid range: min ({record.salary_min}) > max ({record.salary_max})")
                return False

        # Check posting date sanity
        today = date.today()
        if record.posting_date > today:
            self.issues.append(f"Posting date in the future: {record.posting_date}")
            return False

        self.passed_count += 1
        return True

    def generate_report(self) -> Dict[str, Any]:
        """Produce reproducible statistical quality metrics report."""
        salary_coverage_pct = round(
            ((self.total_evaluated - self.missing_salary_count) / max(self.total_evaluated, 1)) * 100, 2
        )
        return {
            "total_records_evaluated": self.total_evaluated,
            "passed_records": self.passed_count,
            "duplicates_detected": self.duplicate_count,
            "missing_salary_count": self.missing_salary_count,
            "salary_coverage_percentage": salary_coverage_pct,
            "invalid_salary_count": self.invalid_salary_count,
            "total_issues_logged": len(self.issues),
            "generated_at": datetime.utcnow().isoformat(),
        }
