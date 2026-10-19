from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# ----------------------------------------------------------------------------
# User Profile Schemas
# ----------------------------------------------------------------------------

class SkillProficiencySchema(BaseModel):
    skill_slug: str
    skill_name: str
    proficiency: str = Field("beginner", description="beginner, intermediate, advanced, mastered")
    is_verified: bool = False


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    current_country_code: Optional[str] = None
    current_role_title: Optional[str] = None
    target_career_slug: Optional[str] = None
    target_country_code: Optional[str] = None
    target_annual_salary: Optional[float] = None
    experience_level: Optional[str] = "Entry-level"
    weekly_study_hours: Optional[int] = Field(10, ge=2, le=60)
    target_timeline_weeks: Optional[int] = Field(12, ge=2, le=52)
    skills: Optional[List[SkillProficiencySchema]] = None


class UserProfileResponse(BaseModel):
    id: str
    auth_user_id: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    current_country_code: Optional[str] = None
    current_role_title: Optional[str] = None
    target_career_slug: Optional[str] = None
    target_country_code: Optional[str] = None
    target_annual_salary: Optional[float] = None
    experience_level: str
    weekly_study_hours: int
    target_timeline_weeks: int
    skills: List[SkillProficiencySchema] = []
    created_at: datetime
    updated_at: datetime


# ----------------------------------------------------------------------------
# Saved Roadmap Schemas
# ----------------------------------------------------------------------------

class SaveRoadmapRequest(BaseModel):
    title: str = Field(..., max_length=256)
    target_role_slug: str
    target_role_title: str
    target_country_code: str
    experience_level: str = "Entry-level"
    total_weeks: int
    weekly_hours: int
    roadmap_data: Dict[str, Any]  # The full generated roadmap payload


class UpdateTaskProgressRequest(BaseModel):
    is_completed: bool
    actual_hours_spent: Optional[float] = 0.0
    user_notes: Optional[str] = None


class RoadmapTaskProgressResponse(BaseModel):
    week_number: int
    task_identifier: str
    task_title: Optional[str] = None
    skill_slug: Optional[str] = None
    is_completed: bool
    completed_at: Optional[datetime] = None
    actual_hours_spent: float
    user_notes: Optional[str] = None


class SavedRoadmapSummaryResponse(BaseModel):
    id: str
    title: str
    target_role_slug: str
    target_role_title: str
    target_country_code: str
    experience_level: str
    total_weeks: int
    weekly_hours: int
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    created_at: datetime
    updated_at: datetime


class SavedRoadmapDetailResponse(BaseModel):
    id: str
    title: str
    target_role_slug: str
    target_role_title: str
    target_country_code: str
    experience_level: str
    total_weeks: int
    weekly_hours: int
    roadmap_data: Dict[str, Any]
    progress: List[RoadmapTaskProgressResponse] = []
    completion_percentage: float = 0.0
    completed_skills: List[str] = []
    remaining_skills: List[str] = []
    total_hours_invested: float = 0.0
    created_at: datetime
    updated_at: datetime


# ----------------------------------------------------------------------------
# Product Analytics Telemetry Ingestion Schemas
# ----------------------------------------------------------------------------

class TrackEventRequest(BaseModel):
    event_name: str
    session_id: Optional[str] = None
    role_slug: Optional[str] = None
    country_code: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
