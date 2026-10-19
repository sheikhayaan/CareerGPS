import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    Numeric,
    Integer,
    Boolean,
    ForeignKey,
    Table,
    Date,
    Index,
    CheckConstraint,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.session import Base


def generate_uuid():
    return str(uuid.uuid4())


# Association table: Job Posting <-> Skill (Many-to-Many)
job_skills = Table(
    "job_skills",
    Base.metadata,
    Column("job_posting_id", String(36), ForeignKey("job_postings.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", String(36), ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
    Index("idx_job_skills_skill_id", "skill_id"),
    Index("idx_job_skills_posting_id", "job_posting_id"),
    Index("idx_job_skills_composite", "skill_id", "job_posting_id"),
)

# Association table: Career Role <-> Skill (Role-level taxonomy baseline)
role_skills = Table(
    "role_skills",
    Base.metadata,
    Column("role_id", String(36), ForeignKey("career_roles.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", String(36), ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
    Column("importance_weight", Numeric(3, 2), default=1.0),
)


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(64), unique=True, nullable=False)
    api_endpoint = Column(String(512), nullable=True)
    license_type = Column(String(128), nullable=False)
    attribution_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ingestion_runs = relationship("DataIngestionRun", back_populates="source")


class DataIngestionRun(Base):
    __tablename__ = "data_ingestion_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_id = Column(String(36), ForeignKey("data_sources.id"), nullable=False)
    status = Column(String(32), nullable=False)  # PENDING, RUNNING, COMPLETED, FAILED
    records_fetched = Column(Integer, default=0)
    records_inserted = Column(Integer, default=0)
    records_deduplicated = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_summary = Column(Text, nullable=True)

    source = relationship("DataSource", back_populates="ingestion_runs")
    job_postings = relationship("JobPosting", back_populates="ingestion_run")


class CareerRole(Base):
    __tablename__ = "career_roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(64), unique=True, nullable=False, index=True)
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    onet_soc_code = Column(String(16), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job_postings = relationship("JobPosting", back_populates="career_role")
    role_skills_rel = relationship("Skill", secondary=role_skills)


class Country(Base):
    __tablename__ = "countries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    iso_code = Column(String(2), unique=True, nullable=False, index=True)
    name = Column(String(64), nullable=False)
    currency_code = Column(String(3), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    job_postings = relationship("JobPosting", back_populates="country")
    cities = relationship("City", back_populates="country")


class City(Base):
    __tablename__ = "cities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    country_id = Column(String(36), ForeignKey("countries.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(128), nullable=False)
    state_province = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    country = relationship("Country", back_populates="cities")
    __table_args__ = (UniqueConstraint("name", "country_id", name="uq_city_country"),)


class Company(Base):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(256), nullable=False)
    normalized_name = Column(String(256), unique=True, nullable=False, index=True)
    domain = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job_postings = relationship("JobPosting", back_populates="company")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    esco_uri = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job_postings = relationship("JobPosting", secondary=job_skills, back_populates="skills")
    learning_resources = relationship("LearningResource", back_populates="skill")
    aliases = relationship("SkillAlias", back_populates="skill", cascade="all, delete-orphan")


class SkillAlias(Base):
    __tablename__ = "skill_aliases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    alias = Column(String(128), unique=True, nullable=False, index=True)

    skill = relationship("Skill", back_populates="aliases")


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ingestion_run_id = Column(String(36), ForeignKey("data_ingestion_runs.id"), nullable=True)
    external_id = Column(String(256), nullable=True)
    source_name = Column(String(64), nullable=False)
    fingerprint_hash = Column(String(64), unique=True, nullable=False, index=True)

    career_role_id = Column(String(36), ForeignKey("career_roles.id"), nullable=False, index=True)
    country_id = Column(String(36), ForeignKey("countries.id"), nullable=False, index=True)
    city_id = Column(String(36), ForeignKey("cities.id"), nullable=True)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True)

    raw_title = Column(String(256), nullable=False)
    posting_date = Column(Date, nullable=False, index=True)
    experience_level = Column(String(32), nullable=True)  # Entry, Mid, Senior, Lead
    min_years_experience = Column(Numeric(3, 1), nullable=True)

    salary_min = Column(Numeric(14, 2), nullable=True)
    salary_max = Column(Numeric(14, 2), nullable=True)
    salary_currency = Column(String(3), nullable=True)
    salary_period = Column(String(16), default="YEARLY")  # YEARLY, MONTHLY, HOURLY
    normalized_annual_salary = Column(Numeric(14, 2), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    career_role = relationship("CareerRole", back_populates="job_postings")
    country = relationship("Country", back_populates="job_postings")
    company = relationship("Company", back_populates="job_postings")
    ingestion_run = relationship("DataIngestionRun", back_populates="job_postings")
    skills = relationship("Skill", secondary=job_skills, back_populates="job_postings")
    salary_observations = relationship("SalaryObservation", back_populates="job_posting", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_postings_role_country", "career_role_id", "country_id"),
        Index("idx_postings_role_country_date", "career_role_id", "country_id", "posting_date"),
        CheckConstraint("normalized_annual_salary IS NULL OR normalized_annual_salary > 0", name="chk_positive_salary"),
    )


class SalaryObservation(Base):
    """Granular observation log for statistical modeling & BLS/National comparison."""
    __tablename__ = "salary_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_posting_id = Column(String(36), ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=True)
    career_role_id = Column(String(36), ForeignKey("career_roles.id"), nullable=False)
    country_id = Column(String(36), ForeignKey("countries.id"), nullable=False)
    raw_amount = Column(Numeric(14, 2), nullable=False)
    raw_period = Column(String(16), nullable=False)
    raw_currency = Column(String(3), nullable=False)
    normalized_annual_amount = Column(Numeric(14, 2), nullable=False, index=True)
    is_outlier = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    job_posting = relationship("JobPosting", back_populates="salary_observations")


class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(256), nullable=False)
    provider = Column(String(128), nullable=False)
    url = Column(Text, nullable=False)
    is_free = Column(Boolean, default=True)
    resource_type = Column(String(64), default="DOCUMENTATION")
    estimated_hours = Column(Numeric(5, 1), default=10.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    skill = relationship("Skill", back_populates="learning_resources")


# ============================================================================
# PHASE 5: User Profiles, Goals, Saved Roadmaps & Learning Progress
# ============================================================================

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    auth_user_id = Column(String(128), unique=True, nullable=False, index=True)
    email = Column(String(256), nullable=True)
    display_name = Column(String(128), nullable=True)
    current_country_code = Column(String(8), nullable=True)
    current_role_title = Column(String(128), nullable=True)
    target_career_slug = Column(String(64), nullable=True)
    target_country_code = Column(String(8), nullable=True)
    target_annual_salary = Column(Numeric(14, 2), nullable=True)
    experience_level = Column(String(32), default="Entry-level")
    weekly_study_hours = Column(Integer, default=10)
    target_timeline_weeks = Column(Integer, default=12)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    career_goals = relationship("UserCareerGoal", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("UserSkillProfile", back_populates="user", cascade="all, delete-orphan")
    saved_roadmaps = relationship("SavedRoadmap", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")


class UserCareerGoal(Base):
    __tablename__ = "user_career_goals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    target_role_slug = Column(String(64), nullable=False)
    target_country_code = Column(String(8), nullable=False)
    target_salary = Column(Numeric(14, 2), nullable=True)
    experience_level = Column(String(32), default="Entry-level")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserProfile", back_populates="career_goals")


class UserSkillProfile(Base):
    __tablename__ = "user_skill_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_slug = Column(String(64), nullable=False)
    skill_name = Column(String(128), nullable=False)
    proficiency = Column(String(32), default="beginner")  # beginner, intermediate, advanced, mastered
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserProfile", back_populates="skills")

    __table_args__ = (
        UniqueConstraint("user_id", "skill_slug", name="uq_user_skill"),
    )


class SavedRoadmap(Base):
    __tablename__ = "saved_roadmaps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(256), nullable=False)
    target_role_slug = Column(String(64), nullable=False)
    target_role_title = Column(String(128), nullable=False)
    target_country_code = Column(String(8), nullable=False)
    experience_level = Column(String(32), nullable=False)
    total_weeks = Column(Integer, nullable=False)
    weekly_hours = Column(Integer, nullable=False)
    roadmap_data_json = Column(Text, nullable=False)  # Full JSON schema of generated roadmap
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserProfile", back_populates="saved_roadmaps")
    progress_records = relationship("RoadmapProgress", back_populates="roadmap", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_saved_roadmaps_user_archived", "user_id", "is_archived"),
    )


class RoadmapProgress(Base):
    __tablename__ = "roadmap_progress"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    roadmap_id = Column(String(36), ForeignKey("saved_roadmaps.id", ondelete="CASCADE"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)
    task_identifier = Column(String(128), nullable=False)
    task_title = Column(String(256), nullable=True)
    skill_slug = Column(String(64), nullable=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    actual_hours_spent = Column(Numeric(4, 1), default=0.0)
    user_notes = Column(Text, nullable=True)

    roadmap = relationship("SavedRoadmap", back_populates="progress_records")

    __table_args__ = (
        UniqueConstraint("roadmap_id", "week_number", "task_identifier", name="uq_roadmap_task"),
        Index("idx_progress_roadmap_week_task", "roadmap_id", "week_number", "task_identifier"),
    )


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("user_profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
    theme = Column(String(16), default="dark")
    email_notifications = Column(Boolean, default=True)
    telemetry_opt_in = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserProfile", back_populates="preferences")


class ProductAnalyticsEvent(Base):
    """Internal Product Analytics log for cohort analysis, funnels, and feature adoption."""
    __tablename__ = "product_analytics_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_name = Column(String(64), nullable=False, index=True)
    user_id = Column(String(128), nullable=True, index=True)  # Anonymized user ID or session ID
    session_id = Column(String(128), nullable=True, index=True)
    role_slug = Column(String(64), nullable=True)
    country_code = Column(String(8), nullable=True)
    properties_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

