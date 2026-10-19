from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
import numpy as np

from app.db.session import get_db
from app.models.entities import CareerRole, Country, Skill, JobPosting, LearningResource, job_skills, DataSource
from app.schemas.api_schemas import (
    CareerRoleSchema,
    CountrySchema,
    SkillSchema,
    JobSummaryItem,
    JobsSummaryResponse,
    SkillDemandRankItem,
    SkillDemandResponse,
    SalarySummaryItem,
    DataCoverageItem,
    DataCoverageResponse,
    MarketIntelligenceResponse,
    SalaryDistributionSchema,
    SkillDemandItem,
    RoadmapRequestSchema,
    RoadmapResponseSchema,
    RoadmapTaskSchema,
)

router = APIRouter()


# ----------------------------------------------------------------------------
# 1. Core Taxonomy Endpoints
# ----------------------------------------------------------------------------

@router.get("/careers", response_model=List[CareerRoleSchema], tags=["Taxonomy"])
@router.get("/roles", response_model=List[CareerRoleSchema], tags=["Taxonomy"], include_in_schema=False)
def get_careers(db: Session = Depends(get_db)):
    """Retrieve all supported canonical career roles (O*NET mapped)."""
    return db.query(CareerRole).order_by(CareerRole.title).all()


@router.get("/countries", response_model=List[CountrySchema], tags=["Taxonomy"])
def get_countries(db: Session = Depends(get_db)):
    """Retrieve all supported target countries."""
    return db.query(Country).order_by(Country.name).all()


@router.get("/skills", response_model=List[SkillSchema], tags=["Taxonomy"])
def get_skills(category: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieve standardized skills from the ESCO ontology."""
    query = db.query(Skill)
    if category:
        query = query.filter(Skill.category == category)
    return query.order_by(Skill.name).all()


# ----------------------------------------------------------------------------
# 2. Phase 2 Analytical Data Layer Endpoints
# ----------------------------------------------------------------------------

@router.get("/jobs/summary", response_model=JobsSummaryResponse, tags=["Analytics"])
def get_jobs_summary(
    role: Optional[str] = Query(None, description="Optional career role slug filter"),
    country: Optional[str] = Query(None, description="Optional ISO country code filter"),
    db: Session = Depends(get_db)
):
    """
    Retrieve aggregated job postings summary by career role and country.
    Queries the analytical database view `v_jobs_by_role_country`.
    """
    sql = "SELECT role_slug, role_title, country_code, country_name, total_postings, postings_with_salary, salary_transparency_pct, earliest_posting_date, latest_posting_date FROM v_jobs_by_role_country WHERE 1=1"
    params = {}
    if role:
        sql += " AND role_slug = :role"
        params["role"] = role
    if country:
        sql += " AND country_code = :country"
        params["country"] = country.upper()

    sql += " ORDER BY total_postings DESC"

    rows = db.execute(text(sql), params).mappings().all()
    summaries = [JobSummaryItem(**dict(r)) for r in rows]
    total_postings = sum(s.total_postings for s in summaries)

    return JobsSummaryResponse(total_postings=total_postings, summaries=summaries)


@router.get("/skills/demand", response_model=SkillDemandResponse, tags=["Analytics"])
def get_skills_demand(
    role: str = Query(..., description="Career role slug e.g. data-analyst"),
    country: str = Query(..., description="Country ISO code e.g. US, IN"),
    limit: int = Query(15, ge=1, le=50, description="Max skills to return"),
    db: Session = Depends(get_db)
):
    """
    Retrieve empirical skill demand rankings and frequencies for a specific role and country.
    Queries the window function analytical view `v_skill_demand_by_role_country`.
    """
    sql = """
    SELECT role_slug, role_title, country_code, skill_slug, skill_name, skill_category,
           demand_count, role_country_total_postings, demand_percentage, skill_rank
    FROM v_skill_demand_by_role_country
    WHERE role_slug = :role AND country_code = :country
    ORDER BY skill_rank ASC
    LIMIT :limit
    """
    rows = db.execute(text(sql), {"role": role, "country": country.upper(), "limit": limit}).mappings().all()

    if not rows:
        # Check if role and country exist
        r_obj = db.query(CareerRole).filter(CareerRole.slug == role).first()
        c_obj = db.query(Country).filter(Country.iso_code == country.upper()).first()
        if not r_obj or not c_obj:
            raise HTTPException(status_code=404, detail="Role or Country not found")
        return SkillDemandResponse(
            role_slug=role,
            country_code=country.upper(),
            total_role_postings=0,
            skills=[]
        )

    first_row = rows[0]
    total_postings = first_row["role_country_total_postings"]
    items = [
        SkillDemandRankItem(
            role_slug=r["role_slug"],
            role_title=r["role_title"],
            country_code=r["country_code"],
            skill_slug=r["skill_slug"],
            skill_name=r["skill_name"],
            skill_category=r["skill_category"],
            demand_count=r["demand_count"],
            demand_percentage=r["demand_percentage"],
            skill_rank=r["skill_rank"]
        )
        for r in rows
    ]

    return SkillDemandResponse(
        role_slug=role,
        country_code=country.upper(),
        total_role_postings=total_postings,
        skills=items
    )


@router.get("/salaries/summary", response_model=List[SalarySummaryItem], tags=["Analytics"])
def get_salaries_summary(
    role: Optional[str] = Query(None, description="Optional career role slug filter"),
    country: Optional[str] = Query(None, description="Optional country ISO code filter"),
    db: Session = Depends(get_db)
):
    """
    Retrieve salary summary distributions and statistical sufficiency flags.
    Queries `v_salary_distributions`. Strictly flags samples where N < 10.
    """
    sql = """
    SELECT role_slug, role_title, country_code, currency_code, sample_size,
           mean_salary, min_salary, max_salary, is_statistically_sufficient
    FROM v_salary_distributions
    WHERE 1=1
    """
    params = {}
    if role:
        sql += " AND role_slug = :role"
        params["role"] = role
    if country:
        sql += " AND country_code = :country"
        params["country"] = country.upper()

    rows = db.execute(text(sql), params).mappings().all()
    results = []
    for r in rows:
        d = dict(r)
        is_suff = bool(d["is_statistically_sufficient"])
        n = d["sample_size"]
        explanation = (
            f"Statistically sufficient sample (N = {n}) observed in {d['country_code']}."
            if is_suff
            else f"Insufficient reliable salary observations (N = {n}). Minimum sample of 10 required to prevent bias."
        )
        results.append(
            SalarySummaryItem(
                role_slug=d["role_slug"],
                role_title=d["role_title"],
                country_code=d["country_code"],
                currency_code=d["currency_code"],
                sample_size=n,
                mean_salary=d["mean_salary"],
                min_salary=d["min_salary"],
                max_salary=d["max_salary"],
                is_statistically_sufficient=is_suff,
                explanation=explanation
            )
        )
    return results


@router.get("/data/coverage", response_model=DataCoverageResponse, tags=["Analytics"])
def get_data_coverage(db: Session = Depends(get_db)):
    """
    Retrieve data sources freshness and coverage audit metrics.
    Queries `v_data_coverage_freshness`.
    """
    sql = """
    SELECT data_source_name, license_type, total_indexed_postings,
           roles_covered, countries_covered, earliest_record, latest_record
    FROM v_data_coverage_freshness
    ORDER BY total_indexed_postings DESC
    """
    rows = db.execute(text(sql)).mappings().all()
    items = [DataCoverageItem(**dict(r)) for r in rows]
    total_rec = db.query(JobPosting).count()

    return DataCoverageResponse(total_records=total_rec, sources=items)


# ----------------------------------------------------------------------------
# 3. Market Intelligence & Personalized Roadmap Endpoints
# ----------------------------------------------------------------------------

@router.get("/intelligence", response_model=MarketIntelligenceResponse, tags=["Intelligence"])
def get_market_intelligence(
    role: str = Query(..., description="Role slug e.g. data-analyst"),
    country: str = Query(..., description="Country ISO code e.g. US, IN"),
    db: Session = Depends(get_db)
):
    """
    Retrieve combined market intelligence (Postings volume, percentiles, skill demands).
    """
    role_obj = db.query(CareerRole).filter(CareerRole.slug == role).first()
    country_obj = db.query(Country).filter(Country.iso_code == country.upper()).first()

    if not role_obj or not country_obj:
        raise HTTPException(status_code=404, detail="Role or Country not found")

    postings_query = db.query(JobPosting).filter(
        JobPosting.career_role_id == role_obj.id,
        JobPosting.country_id == country_obj.id
    )
    total_postings = postings_query.count()

    salaries = [
        float(p.normalized_annual_salary)
        for p in postings_query.filter(JobPosting.normalized_annual_salary.isnot(None)).all()
    ]

    sample_size = len(salaries)
    if sample_size >= 10:
        sal_arr = np.array(salaries)
        salary_dist = SalaryDistributionSchema(
            sample_size=sample_size,
            currency=country_obj.currency_code,
            p10=float(np.percentile(sal_arr, 10)),
            p25=float(np.percentile(sal_arr, 25)),
            median=float(np.median(sal_arr)),
            p75=float(np.percentile(sal_arr, 75)),
            p90=float(np.percentile(sal_arr, 90)),
            is_sufficient=True,
            explanation=f"Based on {sample_size} verified postings in {country_obj.name}."
        )
    else:
        salary_dist = SalaryDistributionSchema(
            sample_size=sample_size,
            currency=country_obj.currency_code,
            is_sufficient=False,
            explanation=f"Insufficient reliable salary data ({sample_size} postings observed). Minimum sample of 10 required to prevent skewed distribution."
        )

    skill_counts = (
        db.query(
            Skill.slug,
            Skill.name,
            Skill.category,
            func.count(job_skills.c.job_posting_id).label("demand_count")
        )
        .join(job_skills, Skill.id == job_skills.c.skill_id)
        .join(JobPosting, JobPosting.id == job_skills.c.job_posting_id)
        .filter(
            JobPosting.career_role_id == role_obj.id,
            JobPosting.country_id == country_obj.id
        )
        .group_by(Skill.id)
        .order_by(func.count(job_skills.c.job_posting_id).desc())
        .limit(10)
        .all()
    )

    top_skills = []
    denom = max(total_postings, 1)
    for s in skill_counts:
        top_skills.append(
            SkillDemandItem(
                skill_slug=s.slug,
                skill_name=s.name,
                category=s.category,
                demand_count=s.demand_count,
                demand_percentage=round((s.demand_count / denom) * 100, 1)
            )
        )

    latest_posting = postings_query.order_by(JobPosting.posting_date.desc()).first()
    freshness = latest_posting.posting_date if latest_posting else None

    return MarketIntelligenceResponse(
        role=CareerRoleSchema.model_validate(role_obj),
        country=CountrySchema.model_validate(country_obj),
        observed_postings_count=total_postings,
        data_freshness_date=freshness,
        salary_distribution=salary_dist,
        top_skills=top_skills,
        data_source_summary="Verified Ingestion & O*NET Baseline"
    )


@router.post("/roadmap/generate", response_model=RoadmapResponseSchema, tags=["Roadmap"])
def generate_roadmap(
    req: RoadmapRequestSchema,
    db: Session = Depends(get_db)
):
    """
    Generate evidence-backed personalized learning roadmap.
    """
    role_obj = db.query(CareerRole).filter(CareerRole.slug == req.role_slug).first()
    country_obj = db.query(Country).filter(Country.iso_code == req.country_code.upper()).first()

    if not role_obj or not country_obj:
        raise HTTPException(status_code=404, detail="Role or Country not found")

    demanded_skills = (
        db.query(Skill)
        .join(job_skills, Skill.id == job_skills.c.skill_id)
        .join(JobPosting, JobPosting.id == job_skills.c.job_posting_id)
        .filter(
            JobPosting.career_role_id == role_obj.id,
            JobPosting.country_id == country_obj.id
        )
        .group_by(Skill.id)
        .order_by(func.count(job_skills.c.job_posting_id).desc())
        .all()
    )

    current_skill_slugs = {s.lower().strip() for s in req.current_skills}
    missing_skills = [s for s in demanded_skills if s.slug not in current_skill_slugs]

    total_hours_available = req.weekly_hours * req.target_weeks
    tasks = []
    current_week = 1
    hours_allocated = 0.0

    for skill in missing_skills:
        if current_week > req.target_weeks:
            break

        res = db.query(LearningResource).filter(LearningResource.skill_id == skill.id).first()
        res_title = res.title if res else "Official Documentation & Reference"
        res_url = res.url if res else "https://en.wikipedia.org/wiki/" + skill.slug
        res_hrs = float(res.estimated_hours) if res else 12.0

        tasks.append(
            RoadmapTaskSchema(
                week_number=current_week,
                skill_name=skill.name,
                title=f"Core Mastery: {skill.name}",
                description=f"Master fundamental concepts, idioms, and hands-on application of {skill.name} for {role_obj.title} roles.",
                estimated_hours=res_hrs,
                resource_title=res_title,
                resource_url=res_url
            )
        )
        hours_allocated += res_hrs
        weeks_needed = max(1, round(res_hrs / max(req.weekly_hours, 1)))
        current_week += weeks_needed

    is_realistic = hours_allocated <= (total_hours_available * 1.15)
    feasibility_note = (
        f"Target timeline is realistic: {int(hours_allocated)} estimated hours required across {req.target_weeks} weeks with {req.weekly_hours}h/week availability."
        if is_realistic
        else f"Ambitious target: Covering all high-demand skills requires approximately {int(hours_allocated)} hours, exceeding your budget of {total_hours_available} hours. We prioritized highest ROI foundational skills."
    )

    return RoadmapResponseSchema(
        role_title=role_obj.title,
        country=country_obj.name,
        total_weeks=req.target_weeks,
        weekly_hours=req.weekly_hours,
        missing_skills=[s.name for s in missing_skills],
        tasks=tasks,
        is_timeline_realistic=is_realistic,
        feasibility_note=feasibility_note
    )
