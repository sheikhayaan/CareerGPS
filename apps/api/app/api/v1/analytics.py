import os
import sys
import json
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func

ROOT_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.insert(0, ROOT_DIR)

from app.db.session import get_db
from app.models.entities import CareerRole, Country, JobPosting, Skill, job_skills
from analytics.statistics_engine import StatisticalAnalyticsEngine
from app.schemas.analytics_schemas import (
    AnalyticsOverviewResponse,
    SkillDemandAnalysisResponse,
    SkillDemandItemSchema,
    SkillCooccurrenceResponse,
    SkillCooccurrenceItem,
    CareerComparisonResponse,
    CountryComparisonResponse,
    CountryComparisonItem,
    SalaryDistributionDetailResponse,
    MarketTrendsResponse,
    MarketTrendPoint,
    DataQualityAuditResponse,
)

router = APIRouter(prefix="/analytics", tags=["Advanced Analytics"])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(db: Session = Depends(get_db)):
    """High-level executive metrics for market intelligence platform."""
    total_postings = db.query(JobPosting).count()
    total_roles = db.query(CareerRole).count()
    total_countries = db.query(Country).count()
    total_skills = db.query(Skill).count()

    postings_with_sal = db.query(JobPosting).filter(JobPosting.normalized_annual_salary.isnot(None)).count()
    transparency = round((postings_with_sal / max(total_postings, 1)) * 100, 2)

    earliest = db.query(func.min(JobPosting.posting_date)).scalar()
    latest = db.query(func.max(JobPosting.posting_date)).scalar()

    # Reliable cohorts check (N >= 10)
    cohort_counts = (
        db.query(JobPosting.career_role_id, JobPosting.country_id, func.count(JobPosting.id))
        .group_by(JobPosting.career_role_id, JobPosting.country_id)
        .all()
    )
    reliable = sum(1 for _, _, cnt in cohort_counts if cnt >= 10)
    sparse = (total_roles * total_countries) - reliable

    return AnalyticsOverviewResponse(
        total_postings=total_postings,
        total_roles=total_roles,
        total_countries=total_countries,
        total_skills_tracked=total_skills,
        salary_transparency_rate=transparency,
        earliest_date=earliest,
        latest_date=latest,
        reliable_cohorts_count=reliable,
        sparse_cohorts_count=sparse,
    )


@router.get("/skills/demand", response_model=SkillDemandAnalysisResponse)
def get_advanced_skill_demand(
    role: Optional[str] = Query(None, description="Role slug e.g. data-analyst"),
    role_slug: Optional[str] = Query(None, description="Role slug alias"),
    country: Optional[str] = Query(None, description="Country ISO code e.g. US, IN"),
    country_code: Optional[str] = Query(None, description="Country ISO code alias"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Calculates empirical skill demand percentages and rank using analytical view."""
    target_role = role or role_slug
    target_country = country or country_code
    if not target_role or not target_country:
        raise HTTPException(status_code=400, detail="Missing required query parameter: 'role' (or 'role_slug') and 'country' (or 'country_code') are required.")

    role_obj = db.query(CareerRole).filter(CareerRole.slug == target_role).first()
    country_obj = db.query(Country).filter(Country.iso_code == target_country.upper()).first()
    if not role_obj or not country_obj:
        raise HTTPException(status_code=404, detail=f"Role '{target_role}' or Country '{target_country}' not found")

    sql = """
    SELECT skill_slug, skill_name, skill_category, demand_count,
           role_country_total_postings, demand_percentage, skill_rank
    FROM v_skill_demand_by_role_country
    WHERE role_slug = :role AND country_code = :country
    ORDER BY skill_rank ASC
    LIMIT :limit
    """
    rows = db.execute(text(sql), {"role": target_role, "country": target_country.upper(), "limit": limit}).mappings().all()

    total_postings = rows[0]["role_country_total_postings"] if rows else 0
    items = [
        SkillDemandItemSchema(
            skill_slug=r["skill_slug"],
            skill_name=r["skill_name"],
            skill_category=r["skill_category"],
            demand_count=r["demand_count"],
            demand_percentage=r["demand_percentage"],
            skill_rank=r["skill_rank"]
        )
        for r in rows
    ]

    return SkillDemandAnalysisResponse(
        role_slug=target_role,
        role_title=role_obj.title,
        country_code=target_country.upper(),
        total_postings=total_postings,
        skills=items
    )


@router.get("/skills/cooccurrence", response_model=SkillCooccurrenceResponse)
def get_skill_cooccurrence(
    role: Optional[str] = Query(None, description="Optional role filter"),
    role_slug: Optional[str] = Query(None, description="Optional role slug alias"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Returns top pairwise co-occurring skills calculated across job postings."""
    target_role = role or role_slug
    sql = """
    SELECT s1.name AS skill_a, s2.name AS skill_b, COUNT(js1.job_posting_id) AS cooccurrence_count
    FROM job_skills js1
    JOIN job_skills js2 ON js1.job_posting_id = js2.job_posting_id AND js1.skill_id < js2.skill_id
    JOIN skills s1 ON js1.skill_id = s1.id
    JOIN skills s2 ON js2.skill_id = s2.id
    JOIN job_postings jp ON js1.job_posting_id = jp.id
    """
    params = {"limit": limit}
    if target_role:
        sql += " JOIN career_roles cr ON jp.career_role_id = cr.id WHERE cr.slug = :role"
        params["role"] = target_role

    sql += " GROUP BY s1.name, s2.name ORDER BY cooccurrence_count DESC LIMIT :limit"

    rows = db.execute(text(sql), params).mappings().all()
    pairs = [SkillCooccurrenceItem(**dict(r)) for r in rows]

    return SkillCooccurrenceResponse(
        role_slug=role,
        total_pairs=len(pairs),
        top_pairs=pairs
    )


@router.get("/careers/comparison", response_model=CareerComparisonResponse)
def compare_careers(
    role_a: str = Query(..., description="First role slug e.g. data-analyst"),
    role_b: str = Query(..., description="Second role slug e.g. data-scientist"),
    db: Session = Depends(get_db)
):
    """Compares the skill portfolios of two careers using Jaccard Similarity."""
    r1 = db.query(CareerRole).filter(CareerRole.slug == role_a).first()
    r2 = db.query(CareerRole).filter(CareerRole.slug == role_b).first()
    if not r1 or not r2:
        raise HTTPException(status_code=404, detail="One or both roles not found")

    def get_role_skills(role_id):
        return {
            row[0] for row in
            db.query(Skill.name)
            .join(job_skills, Skill.id == job_skills.c.skill_id)
            .join(JobPosting, job_skills.c.job_posting_id == JobPosting.id)
            .filter(JobPosting.career_role_id == role_id)
            .distinct().all()
        }

    skills_a = get_role_skills(r1.id)
    skills_b = get_role_skills(r2.id)

    comparison = StatisticalAnalyticsEngine.compare_skill_profiles(skills_a, skills_b)
    jaccard = comparison["jaccard_similarity"]

    if jaccard >= 0.5:
        interp = f"High structural skill overlap ({int(jaccard*100)}%). Skills transfer readily between {r1.title} and {r2.title}."
    elif jaccard >= 0.25:
        interp = f"Moderate skill overlap ({int(jaccard*100)}%). Core shared foundation, with distinct domain-specific tools."
    else:
        interp = f"Low skill overlap ({int(jaccard*100)}%). Significant specialized upskilling required for career transition."

    return CareerComparisonResponse(
        role_a=r1.title,
        role_b=r2.title,
        jaccard_similarity=jaccard,
        shared_skills_count=comparison["shared_count"],
        shared_skills=comparison["shared_skills"],
        unique_to_role_a=comparison["unique_a"],
        unique_to_role_b=comparison["unique_b"],
        interpretation=interp
    )


@router.get("/countries/comparison", response_model=CountryComparisonResponse)
def compare_countries(
    role: Optional[str] = Query(None, description="Role slug e.g. data-analyst"),
    role_slug: Optional[str] = Query(None, description="Role slug alias"),
    db: Session = Depends(get_db)
):
    """Compares market opportunity and compensation across target countries for a role."""
    target_role = role or role_slug
    if not target_role:
        raise HTTPException(status_code=400, detail="Missing required query parameter: 'role' (or 'role_slug') is required.")

    r = db.query(CareerRole).filter(CareerRole.slug == target_role).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Role '{target_role}' not found")

    countries = db.query(Country).all()
    comparisons = []

    for c in countries:
        postings = (
            db.query(JobPosting)
            .filter(JobPosting.career_role_id == r.id, JobPosting.country_id == c.id)
            .all()
        )
        n = len(postings)
        salaries = [float(p.normalized_annual_salary) for p in postings if p.normalized_annual_salary is not None]

        # Top skill in country
        top_sk = (
            db.query(Skill.name)
            .join(job_skills, Skill.id == job_skills.c.skill_id)
            .join(JobPosting, job_skills.c.job_posting_id == JobPosting.id)
            .filter(JobPosting.career_role_id == r.id, JobPosting.country_id == c.id)
            .group_by(Skill.id)
            .order_by(func.count(job_skills.c.job_posting_id).desc())
            .first()
        )

        if len(salaries) >= 10:
            stats_dict = StatisticalAnalyticsEngine.calculate_descriptive_stats(salaries)
            comparisons.append(
                CountryComparisonItem(
                    country_code=c.iso_code,
                    country_name=c.name,
                    currency_code=c.currency_code,
                    observed_postings=n,
                    salary_sample_size=len(salaries),
                    median_salary=stats_dict["median"],
                    p25_salary=stats_dict["p25"],
                    p75_salary=stats_dict["p75"],
                    is_sufficient=True,
                    top_skill=top_sk[0] if top_sk else None
                )
            )
        else:
            comparisons.append(
                CountryComparisonItem(
                    country_code=c.iso_code,
                    country_name=c.name,
                    currency_code=c.currency_code,
                    observed_postings=n,
                    salary_sample_size=len(salaries),
                    is_sufficient=False,
                    top_skill=top_sk[0] if top_sk else None
                )
            )

    return CountryComparisonResponse(
        role_slug=r.slug,
        role_title=r.title,
        comparisons=comparisons
    )


@router.get("/salaries/distribution", response_model=SalaryDistributionDetailResponse)
def get_detailed_salary_distribution(
    role: Optional[str] = Query(None, description="Role slug e.g. data-analyst"),
    role_slug: Optional[str] = Query(None, description="Role slug alias"),
    country: Optional[str] = Query(None, description="Country ISO code e.g. US, IN"),
    country_code: Optional[str] = Query(None, description="Country ISO code alias"),
    db: Session = Depends(get_db)
):
    """
    Comprehensive parametric & non-parametric salary distribution with
    Tukey outlier bounds and bootstrap confidence intervals (when N >= 15).
    """
    target_role = role or role_slug
    target_country = country or country_code
    if not target_role or not target_country:
        raise HTTPException(status_code=400, detail="Missing required query parameter: 'role' (or 'role_slug') and 'country' (or 'country_code') are required.")

    r_obj = db.query(CareerRole).filter(CareerRole.slug == target_role).first()
    c_obj = db.query(Country).filter(Country.iso_code == target_country.upper()).first()
    if not r_obj or not c_obj:
        raise HTTPException(status_code=404, detail=f"Role '{target_role}' or Country '{target_country}' not found")

    salaries = [
        float(p.normalized_annual_salary)
        for p in db.query(JobPosting.normalized_annual_salary)
        .filter(
            JobPosting.career_role_id == r_obj.id,
            JobPosting.country_id == c_obj.id,
            JobPosting.normalized_annual_salary.isnot(None)
        ).all()
    ]

    n = len(salaries)
    if n < 10:
        return SalaryDistributionDetailResponse(
            role_slug=target_role,
            country_code=target_country.upper(),
            currency_code=c_obj.currency_code,
            sample_size=n,
            is_sufficient=False,
            explanation=f"Insufficient reliable salary observations (N = {n}). Minimum sample of 10 required to prevent bias."
        )

    stats_dict = StatisticalAnalyticsEngine.calculate_descriptive_stats(salaries)
    bootstrap_res = StatisticalAnalyticsEngine.bootstrap_median_confidence_interval(salaries)

    # Optional government benchmark reference (uncontaminated)
    gov_bench = None
    if target_country.upper() == "US":
        bench_path = os.path.join(ROOT_DIR, "data", "dictionaries", "bls_benchmarks.json")
        if os.path.exists(bench_path):
            with open(bench_path, "r", encoding="utf-8") as f:
                b_data = json.load(f)
                gov_bench = b_data.get("benchmarks", {}).get(target_role, {}).get("national_estimates")

    return SalaryDistributionDetailResponse(
        role_slug=target_role,
        country_code=target_country.upper(),
        currency_code=c_obj.currency_code,
        sample_size=n,
        is_sufficient=True,
        mean=stats_dict["mean"],
        std=stats_dict["std"],
        median=stats_dict["median"],
        p10=stats_dict["p10"],
        p25=stats_dict["p25"],
        p75=stats_dict["p75"],
        p90=stats_dict["p90"],
        iqr=stats_dict["iqr"],
        min=stats_dict["min"],
        max=stats_dict["max"],
        outlier_count=stats_dict["outlier_count"],
        bootstrap_ci=bootstrap_res if bootstrap_res.get("applicable") else None,
        government_benchmark=gov_bench,
        explanation=f"Based on {n} verified postings in {c_obj.name} with standard annualization."
    )


@router.get("/market/trends", response_model=MarketTrendsResponse)
def get_market_trends(
    role: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns day-over-day posting volume trends with rolling 3-day average."""
    sql = """
    WITH daily_counts AS (
        SELECT jp.posting_date, COUNT(jp.id) AS postings_count
        FROM job_postings jp
        LEFT JOIN career_roles cr ON jp.career_role_id = cr.id
        LEFT JOIN countries c ON jp.country_id = c.id
        WHERE 1=1
    """
    params = {}
    if role:
        sql += " AND cr.slug = :role"
        params["role"] = role
    if country:
        sql += " AND c.iso_code = :country"
        params["country"] = country.upper()

    sql += """
        GROUP BY jp.posting_date
    )
    SELECT posting_date, postings_count,
           ROUND(AVG(postings_count) OVER (ORDER BY posting_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS rolling_3day_avg
    FROM daily_counts
    ORDER BY posting_date ASC
    """
    rows = db.execute(text(sql), params).mappings().all()
    points = [MarketTrendPoint(**dict(r)) for r in rows]

    return MarketTrendsResponse(
        role_slug=role,
        country_code=country,
        data_points=points
    )


@router.get("/data-quality", response_model=DataQualityAuditResponse)
def get_data_quality_audit(db: Session = Depends(get_db)):
    """Automated data reliability, freshness, and completeness metrics."""
    total = db.query(JobPosting).count()
    with_sal = db.query(JobPosting).filter(JobPosting.normalized_annual_salary.isnot(None)).count()
    with_city = db.query(JobPosting).filter(JobPosting.city_id.isnot(None)).count()
    with_co = db.query(JobPosting).filter(JobPosting.company_id.isnot(None)).count()

    latest_date = db.query(func.max(JobPosting.posting_date)).scalar()
    freshness_days = (date.today() - latest_date).days if latest_date else 0

    sources_summary = [
        {"source": r[0], "count": r[1]}
        for r in db.query(JobPosting.source_name, func.count(JobPosting.id)).group_by(JobPosting.source_name).all()
    ]

    return DataQualityAuditResponse(
        total_evaluated_records=total,
        valid_records_count=total,
        duplicates_detected=0,
        salary_disclosure_pct=round((with_sal / max(total, 1)) * 100, 2),
        city_completeness_pct=round((with_city / max(total, 1)) * 100, 2),
        company_completeness_pct=round((with_co / max(total, 1)) * 100, 2),
        data_freshness_days=max(0, freshness_days),
        sources_summary=sources_summary
    )
