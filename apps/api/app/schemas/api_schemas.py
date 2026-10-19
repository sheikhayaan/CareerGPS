from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import date, datetime


class CareerRoleSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    title: str
    description: Optional[str] = None
    onet_soc_code: Optional[str] = None


class CountrySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    iso_code: str
    name: str
    currency_code: str


class SkillSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    name: str
    category: str


# Phase 2 Required Endpoints Schemas

class JobSummaryItem(BaseModel):
    role_slug: str
    role_title: str
    country_code: str
    country_name: str
    total_postings: int
    postings_with_salary: int
    salary_transparency_pct: float
    earliest_posting_date: Optional[date] = None
    latest_posting_date: Optional[date] = None


class JobsSummaryResponse(BaseModel):
    total_postings: int
    summaries: List[JobSummaryItem]


class SkillDemandRankItem(BaseModel):
    role_slug: str
    role_title: str
    country_code: str
    skill_slug: str
    skill_name: str
    skill_category: str
    demand_count: int
    demand_percentage: float
    skill_rank: int


class SkillDemandResponse(BaseModel):
    role_slug: str
    country_code: str
    total_role_postings: int
    skills: List[SkillDemandRankItem]


class SalarySummaryItem(BaseModel):
    role_slug: str
    role_title: str
    country_code: str
    currency_code: str
    sample_size: int
    mean_salary: Optional[float] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    is_statistically_sufficient: bool
    explanation: str


class DataCoverageItem(BaseModel):
    data_source_name: str
    license_type: str
    total_indexed_postings: int
    roles_covered: int
    countries_covered: int
    earliest_record: Optional[date] = None
    latest_record: Optional[date] = None


class DataCoverageResponse(BaseModel):
    total_records: int
    sources: List[DataCoverageItem]


# Prior schemas kept intact for existing views & testing
class SalaryDistributionSchema(BaseModel):
    sample_size: int
    currency: str
    p10: Optional[float] = None
    p25: Optional[float] = None
    median: Optional[float] = None
    p75: Optional[float] = None
    p90: Optional[float] = None
    is_sufficient: bool
    explanation: Optional[str] = None


class SkillDemandItem(BaseModel):
    skill_slug: str
    skill_name: str
    category: str
    demand_count: int
    demand_percentage: float


class MarketIntelligenceResponse(BaseModel):
    role: CareerRoleSchema
    country: CountrySchema
    observed_postings_count: int
    data_freshness_date: Optional[date] = None
    salary_distribution: SalaryDistributionSchema
    top_skills: List[SkillDemandItem]
    data_source_summary: str


class RoadmapRequestSchema(BaseModel):
    role_slug: str
    country_code: str
    current_skills: List[str]
    weekly_hours: int = Field(ge=2, le=50)
    target_weeks: int = Field(ge=2, le=52)
    target_salary: Optional[float] = None


class RoadmapTaskSchema(BaseModel):
    week_number: int
    skill_name: str
    title: str
    description: str
    estimated_hours: float
    resource_title: Optional[str] = None
    resource_url: Optional[str] = None


class RoadmapResponseSchema(BaseModel):
    role_title: str
    country: str
    total_weeks: int
    weekly_hours: int
    missing_skills: List[str]
    tasks: List[RoadmapTaskSchema]
    is_timeline_realistic: bool
    feasibility_note: str
