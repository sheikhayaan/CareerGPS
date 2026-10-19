from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any


# ----------------------------------------------------------------------------
# Step 1: User Career Profile & Inputs
# ----------------------------------------------------------------------------

class SkillProficiencyInput(BaseModel):
    skill_slug: str
    proficiency: str = Field("beginner", description="beginner, intermediate, advanced")


class UserProfileAnalyzeRequest(BaseModel):
    target_role_slug: str
    target_country_code: str
    experience_level: str = Field("Entry-level", description="Student, Fresher, Entry-level, Mid-level, Senior")
    current_skills: List[SkillProficiencyInput]
    target_salary: Optional[float] = None
    weekly_hours: int = Field(10, ge=2, le=50)
    target_weeks: int = Field(12, ge=2, le=52)
    current_role_slug: Optional[str] = None


class SkillGapItemResponse(BaseModel):
    skill_slug: str
    skill_name: str
    user_proficiency: str
    target_proficiency: str
    is_missing: bool
    needs_improvement: bool
    market_demand_pct: float
    role_relevance: float
    estimated_learning_hours: float
    priority_score: float
    is_foundational_prerequisite: bool


class SkillGapAnalysisResponse(BaseModel):
    target_role: str
    target_country: str
    total_gaps: int
    missing_count: int
    improvement_count: int
    prioritized_skills: List[SkillGapItemResponse]


class CareerTransitionRequest(BaseModel):
    current_role_slug: str
    target_role_slug: str
    current_skills: List[str]


class CareerTransitionResponse(BaseModel):
    current_role: str
    target_role: str
    jaccard_similarity: float
    transition_difficulty: str
    transferable_skills: List[str]
    missing_target_skills: List[str]
    estimated_transition_hours: float
    recommended_projects: List[str]
    explanation: str


class SalaryEvaluationRequest(BaseModel):
    target_role_slug: str
    target_country_code: str
    target_salary: float


class SalaryEvaluationResponse(BaseModel):
    target_salary: float
    currency: str
    evaluation_status: str
    percentile_tier: str
    empirical_median: Optional[float] = None
    empirical_p25: Optional[float] = None
    empirical_p75: Optional[float] = None
    sample_size: int
    message: str
    limitations_note: str


class KnowledgeGraphExportResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]


class VerifiedResourceItem(BaseModel):
    id: str
    skill_slug: str
    title: str
    provider: str
    url: str
    is_free: bool
    estimated_hours: float


class WeeklyPlanTask(BaseModel):
    week_number: int
    title: str
    skills: List[str]
    learning_objectives: List[str]
    topics: List[str]
    resources: List[Dict[str, Any]]
    practice_exercises: List[str]
    estimated_hours: float
    completion_criteria: List[str]


class PortfolioProjectItem(BaseModel):
    title: str
    description: str
    skills_demonstrated: List[str]
    deliverables: List[str]


class RoadmapDetailResponse(BaseModel):
    career_goal: Dict[str, str]
    summary: Dict[str, Any]
    weekly_plan: List[WeeklyPlanTask]
    portfolio_projects: List[PortfolioProjectItem]
    deferred_skills: List[str]
    limitations: List[str]
