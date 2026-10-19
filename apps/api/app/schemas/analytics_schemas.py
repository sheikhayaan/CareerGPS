from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import date


# ----------------------------------------------------------------------------
# Step 7: Phase 3 Advanced Analytics API Schemas
# ----------------------------------------------------------------------------

class AnalyticsOverviewResponse(BaseModel):
    total_postings: int
    total_roles: int
    total_countries: int
    total_skills_tracked: int
    salary_transparency_rate: float
    earliest_date: Optional[date] = None
    latest_date: Optional[date] = None
    reliable_cohorts_count: int
    sparse_cohorts_count: int


class SkillDemandItemSchema(BaseModel):
    skill_slug: str
    skill_name: str
    skill_category: str
    demand_count: int
    demand_percentage: float
    skill_rank: int


class SkillDemandAnalysisResponse(BaseModel):
    role_slug: str
    role_title: str
    country_code: str
    total_postings: int
    skills: List[SkillDemandItemSchema]


class SkillCooccurrenceItem(BaseModel):
    skill_a: str
    skill_b: str
    cooccurrence_count: int


class SkillCooccurrenceResponse(BaseModel):
    role_slug: Optional[str] = None
    total_pairs: int
    top_pairs: List[SkillCooccurrenceItem]


class CareerComparisonResponse(BaseModel):
    role_a: str
    role_b: str
    jaccard_similarity: float
    shared_skills_count: int
    shared_skills: List[str]
    unique_to_role_a: List[str]
    unique_to_role_b: List[str]
    interpretation: str


class CountryComparisonItem(BaseModel):
    country_code: str
    country_name: str
    currency_code: str
    observed_postings: int
    salary_sample_size: int
    median_salary: Optional[float] = None
    p25_salary: Optional[float] = None
    p75_salary: Optional[float] = None
    is_sufficient: bool
    top_skill: Optional[str] = None


class CountryComparisonResponse(BaseModel):
    role_slug: str
    role_title: str
    comparisons: List[CountryComparisonItem]


class SalaryDistributionDetailResponse(BaseModel):
    role_slug: str
    country_code: str
    currency_code: str
    sample_size: int
    is_sufficient: bool
    mean: Optional[float] = None
    std: Optional[float] = None
    median: Optional[float] = None
    p10: Optional[float] = None
    p25: Optional[float] = None
    p75: Optional[float] = None
    p90: Optional[float] = None
    iqr: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    outlier_count: int = 0
    bootstrap_ci: Optional[Dict[str, Any]] = None
    government_benchmark: Optional[Dict[str, Any]] = None
    explanation: str


class MarketTrendPoint(BaseModel):
    posting_date: date
    postings_count: int
    rolling_3day_avg: float


class MarketTrendsResponse(BaseModel):
    role_slug: Optional[str] = None
    country_code: Optional[str] = None
    data_points: List[MarketTrendPoint]


class DataQualityAuditResponse(BaseModel):
    total_evaluated_records: int
    valid_records_count: int
    duplicates_detected: int
    salary_disclosure_pct: float
    city_completeness_pct: float
    company_completeness_pct: float
    data_freshness_days: int
    sources_summary: List[Dict[str, Any]]
