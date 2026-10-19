import os
import sys
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func

ROOT_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.insert(0, ROOT_DIR)

from app.db.session import get_db
from app.models.entities import CareerRole, Country, Skill, LearningResource, JobPosting, job_skills
from ml.recommendations.knowledge_graph import SkillKnowledgeGraph
from ml.recommendations.skill_gap_analyzer import SkillGapAnalyzer
from ml.recommendations.transition_analyzer import CareerTransitionAnalyzer
from ml.recommendations.salary_reality_checker import SalaryRealityChecker
from ml.recommendations.roadmap_generator import AdaptiveRoadmapGenerator
from analytics.statistics_engine import StatisticalAnalyticsEngine
from app.schemas.roadmap_schemas import (
    UserProfileAnalyzeRequest,
    SkillGapAnalysisResponse,
    SkillGapItemResponse,
    CareerTransitionRequest,
    CareerTransitionResponse,
    SalaryEvaluationRequest,
    SalaryEvaluationResponse,
    KnowledgeGraphExportResponse,
    VerifiedResourceItem,
    RoadmapDetailResponse,
)

router = APIRouter(prefix="/career", tags=["Career Intelligence & Roadmap Engine"])

# Initialize Graph and Analyzers
kg_instance = SkillKnowledgeGraph()
gap_analyzer = SkillGapAnalyzer(knowledge_graph=kg_instance)
transition_analyzer = CareerTransitionAnalyzer(knowledge_graph=kg_instance)
roadmap_gen = AdaptiveRoadmapGenerator(knowledge_graph=kg_instance)


@router.post("/profile/analyze", response_model=Dict[str, Any])
def analyze_user_profile(req: UserProfileAnalyzeRequest, db: Session = Depends(get_db)):
    """Comprehensive single-call analysis of user profile, gaps, salary sanity, and transition."""
    role = db.query(CareerRole).filter(CareerRole.slug == req.target_role_slug).first()
    country = db.query(Country).filter(Country.iso_code == req.target_country_code.upper()).first()
    if not role or not country:
        raise HTTPException(status_code=404, detail="Target Role or Country not found")

    # 1. Fetch empirical demand %
    demand_rows = db.execute(
        text("SELECT skill_slug, demand_percentage FROM v_skill_demand_by_role_country WHERE role_slug = :r AND country_code = :c"),
        {"r": req.target_role_slug, "c": req.target_country_code.upper()}
    ).mappings().all()
    emp_map = {r["skill_slug"]: float(r["demand_percentage"]) for r in demand_rows}

    # 2. Target skills list
    target_skills_db = (
        db.query(Skill.slug, Skill.name)
        .join(job_skills, Skill.id == job_skills.c.skill_id)
        .join(JobPosting, job_skills.c.job_posting_id == JobPosting.id)
        .filter(JobPosting.career_role_id == role.id)
        .distinct().all()
    )
    target_skills_list = [{"slug": s[0], "name": s[1], "relevance": 0.9} for s in target_skills_db]
    if not target_skills_list:
        # Fallback to ESCO/O*NET top skills if postings sparse
        target_skills_list = [{"slug": s.slug, "name": s.name, "relevance": 0.85} for s in db.query(Skill).limit(8).all()]

    user_skills_dict = {item.skill_slug.lower(): item.proficiency.lower() for item in req.current_skills}
    gaps = gap_analyzer.analyze_gaps(target_skills_list, user_skills_dict, emp_map)

    # 3. Salary Check
    sal_eval = None
    if req.target_salary:
        sal_rows = [
            float(p[0]) for p in db.query(JobPosting.normalized_annual_salary)
            .filter(JobPosting.career_role_id == role.id, JobPosting.country_id == country.id, JobPosting.normalized_annual_salary.isnot(None))
            .all()
        ]
        emp_stats = StatisticalAnalyticsEngine.calculate_descriptive_stats(sal_rows) if sal_rows else None
        
        # Government benchmark for US
        gov_bench = None
        if req.target_country_code.upper() == "US":
            bench_path = os.path.join(ROOT_DIR, "data", "dictionaries", "bls_benchmarks.json")
            if os.path.exists(bench_path):
                with open(bench_path, "r", encoding="utf-8") as f:
                    gov_bench = json.load(f).get("benchmarks", {}).get(req.target_role_slug, {}).get("national_estimates")

        sal_eval = SalaryRealityChecker.evaluate_target(
            req.target_salary, emp_stats, gov_bench, currency=country.currency_code
        )

    # 4. Career Transition if current_role provided
    transition_eval = None
    if req.current_role_slug and req.current_role_slug != req.target_role_slug:
        curr_role_obj = db.query(CareerRole).filter(CareerRole.slug == req.current_role_slug).first()
        if curr_role_obj:
            curr_target_skills = [
                s[0] for s in db.query(Skill.slug)
                .join(job_skills, Skill.id == job_skills.c.skill_id)
                .join(JobPosting, job_skills.c.job_posting_id == JobPosting.id)
                .filter(JobPosting.career_role_id == curr_role_obj.id)
                .distinct().all()
            ]
            transition_eval = transition_analyzer.analyze_transition(
                curr_role_obj.title, role.title, curr_target_skills, [s["slug"] for s in target_skills_list]
            )

    return {
        "target_role": role.title,
        "target_country": country.name,
        "currency_code": country.currency_code,
        "total_gaps": len([g for g in gaps if g["needs_improvement"]]),
        "prioritized_skills": gaps,
        "salary_evaluation": sal_eval,
        "career_transition": transition_eval
    }


@router.post("/skills/gap", response_model=SkillGapAnalysisResponse)
def get_skill_gaps(req: UserProfileAnalyzeRequest, db: Session = Depends(get_db)):
    """Calculates prioritized missing and improvement skills using knowledge graph."""
    role = db.query(CareerRole).filter(CareerRole.slug == req.target_role_slug).first()
    country = db.query(Country).filter(Country.iso_code == req.target_country_code.upper()).first()
    if not role or not country:
        raise HTTPException(status_code=404, detail="Target Role or Country not found")

    demand_rows = db.execute(
        text("SELECT skill_slug, demand_percentage FROM v_skill_demand_by_role_country WHERE role_slug = :r AND country_code = :c"),
        {"r": req.target_role_slug, "c": req.target_country_code.upper()}
    ).mappings().all()
    emp_map = {r["skill_slug"]: float(r["demand_percentage"]) for r in demand_rows}

    target_skills_db = (
        db.query(Skill.slug, Skill.name)
        .join(job_skills, Skill.id == job_skills.c.skill_id)
        .join(JobPosting, job_skills.c.job_posting_id == JobPosting.id)
        .filter(JobPosting.career_role_id == role.id)
        .distinct().all()
    )
    target_skills_list = [{"slug": s[0], "name": s[1], "relevance": 0.9} for s in target_skills_db]
    user_skills_dict = {item.skill_slug.lower(): item.proficiency.lower() for item in req.current_skills}

    gaps = gap_analyzer.analyze_gaps(target_skills_list, user_skills_dict, emp_map)
    missing_cnt = sum(1 for g in gaps if g["is_missing"])
    improve_cnt = sum(1 for g in gaps if g["needs_improvement"] and not g["is_missing"])

    return SkillGapAnalysisResponse(
        target_role=role.title,
        target_country=country.name,
        total_gaps=len([g for g in gaps if g["needs_improvement"]]),
        missing_count=missing_cnt,
        improvement_count=improve_cnt,
        prioritized_skills=[SkillGapItemResponse(**g) for g in gaps]
    )


@router.get("/skills/prerequisites", response_model=KnowledgeGraphExportResponse)
def get_skill_prerequisites():
    """Exports entire Skill Prerequisite Knowledge Graph for visual exploration."""
    return kg_instance.export_knowledge_graph()


@router.post("/transition/analyze", response_model=CareerTransitionResponse)
def analyze_career_transition(req: CareerTransitionRequest, db: Session = Depends(get_db)):
    """Analyzes transferable skills, difficulty, and overlap between two careers."""
    r1 = db.query(CareerRole).filter(CareerRole.slug == req.current_role_slug).first()
    r2 = db.query(CareerRole).filter(CareerRole.slug == req.target_role_slug).first()
    if not r1 or not r2:
        raise HTTPException(status_code=404, detail="Role not found")

    target_skills = [
        s[0] for s in db.query(Skill.slug)
        .join(job_skills, Skill.id == job_skills.c.skill_id)
        .join(JobPosting, job_skills.c.job_posting_id == JobPosting.id)
        .filter(JobPosting.career_role_id == r2.id)
        .distinct().all()
    ]

    analysis = transition_analyzer.analyze_transition(
        r1.title, r2.title, req.current_skills, target_skills
    )
    return CareerTransitionResponse(**analysis)


@router.post("/salary/evaluate", response_model=SalaryEvaluationResponse)
def evaluate_salary(req: SalaryEvaluationRequest, db: Session = Depends(get_db)):
    """Sanity-checks a target salary against empirical market distributions."""
    role = db.query(CareerRole).filter(CareerRole.slug == req.target_role_slug).first()
    country = db.query(Country).filter(Country.iso_code == req.target_country_code.upper()).first()
    if not role or not country:
        raise HTTPException(status_code=404, detail="Role or Country not found")

    sal_rows = [
        float(p[0]) for p in db.query(JobPosting.normalized_annual_salary)
        .filter(JobPosting.career_role_id == role.id, JobPosting.country_id == country.id, JobPosting.normalized_annual_salary.isnot(None))
        .all()
    ]
    emp_stats = StatisticalAnalyticsEngine.calculate_descriptive_stats(sal_rows) if sal_rows else None

    gov_bench = None
    if req.target_country_code.upper() == "US":
        bench_path = os.path.join(ROOT_DIR, "data", "dictionaries", "bls_benchmarks.json")
        if os.path.exists(bench_path):
            with open(bench_path, "r", encoding="utf-8") as f:
                gov_bench = json.load(f).get("benchmarks", {}).get(req.target_role_slug, {}).get("national_estimates")

    eval_dict = SalaryRealityChecker.evaluate_target(
        req.target_salary, emp_stats, gov_bench, currency=country.currency_code
    )
    return SalaryEvaluationResponse(**eval_dict)


@router.get("/resources", response_model=List[VerifiedResourceItem])
def get_verified_resources(skill_slug: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieves curated learning resources verified from official documentation and MOOCs."""
    q = db.query(LearningResource, Skill.slug).join(Skill, LearningResource.skill_id == Skill.id)
    if skill_slug:
        q = q.filter(Skill.slug == skill_slug)
    
    rows = q.all()
    return [
        VerifiedResourceItem(
            id=res.id,
            skill_slug=slug,
            title=res.title,
            provider=res.provider,
            url=res.url,
            is_free=res.is_free,
            estimated_hours=float(res.estimated_hours)
        )
        for res, slug in rows
    ]


@router.post("/roadmap/generate", response_model=RoadmapDetailResponse)
def generate_hyper_personalized_roadmap(req: UserProfileAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Generates a personalized learning roadmap with:
    - Prerequisite knowledge graph topological ordering
    - Adaptive weekly time allocation
    - Verified resource links
    - Practical exercises and portfolio project specs
    """
    role = db.query(CareerRole).filter(CareerRole.slug == req.target_role_slug).first()
    country = db.query(Country).filter(Country.iso_code == req.target_country_code.upper()).first()
    if not role or not country:
        raise HTTPException(status_code=404, detail="Role or Country not found")

    # Fetch empirical demand
    demand_rows = db.execute(
        text("SELECT skill_slug, demand_percentage FROM v_skill_demand_by_role_country WHERE role_slug = :r AND country_code = :c"),
        {"r": req.target_role_slug, "c": req.target_country_code.upper()}
    ).mappings().all()
    emp_map = {r["skill_slug"]: float(r["demand_percentage"]) for r in demand_rows}

    # Fetch target skills
    target_skills_db = (
        db.query(Skill.slug, Skill.name)
        .join(job_skills, Skill.id == job_skills.c.skill_id)
        .join(JobPosting, job_skills.c.job_posting_id == JobPosting.id)
        .filter(JobPosting.career_role_id == role.id)
        .distinct().all()
    )
    target_skills_list = [{"slug": s[0], "name": s[1], "relevance": 0.9} for s in target_skills_db]
    if not target_skills_list:
        target_skills_list = [{"slug": s.slug, "name": s.name, "relevance": 0.85} for s in db.query(Skill).limit(8).all()]

    user_skills_dict = {item.skill_slug.lower(): item.proficiency.lower() for item in req.current_skills}
    gaps = gap_analyzer.analyze_gaps(target_skills_list, user_skills_dict, emp_map)

    # Filter to items requiring study
    actionable_skills = [g for g in gaps if g["needs_improvement"]]

    # Fetch all resources
    res_rows = db.query(LearningResource, Skill.slug).join(Skill, LearningResource.skill_id == Skill.id).all()
    catalog: Dict[str, List[Dict[str, Any]]] = {}
    for r, s_slug in res_rows:
        if s_slug not in catalog:
            catalog[s_slug] = []
        catalog[s_slug].append({
            "title": r.title,
            "provider": r.provider,
            "url": r.url,
            "is_free": r.is_free,
            "estimated_hours": float(r.estimated_hours)
        })

    # Generate structured roadmap
    plan = roadmap_gen.generate_roadmap(
        role_title=role.title,
        country_name=country.name,
        experience_level=req.experience_level,
        weekly_hours=req.weekly_hours,
        target_weeks=req.target_weeks,
        prioritized_skills=actionable_skills,
        resource_catalog=catalog
    )

    return RoadmapDetailResponse(**plan)
