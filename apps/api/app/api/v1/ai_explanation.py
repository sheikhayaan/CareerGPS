from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/career/ai", tags=["AI Skill Intelligence & Explanations"])


class SkillExplainRequest(BaseModel):
    skill_name: str
    target_role: str
    target_country: Optional[str] = "US"
    user_proficiency: Optional[str] = "none"
    prerequisites: Optional[list[str]] = []


class SkillExplainResponse(BaseModel):
    skill_name: str
    target_role: str
    strategic_importance: str
    learning_sequence_rationale: str
    capstone_application_guide: str
    is_fallback: bool = False


@router.post("/explain-skill", response_model=SkillExplainResponse)
def explain_skill_recommendation(req: SkillExplainRequest):
    """
    Provides deep, contextual explanations of why a specific skill or sequence
    is recommended. Built with deterministic synthesis, fully reliable without paid API keys.
    """
    skill = req.skill_name.strip()
    role = req.target_role.strip()
    prereqs = ", ".join(req.prerequisites) if req.prerequisites else "Fundamental syntax and data structures"

    # Deterministic knowledge synthesis
    importance_map = {
        "python": f"Python is the industry standard lingua franca for {role}. It provides the glue between data pipelines, numerical engines, and deployment microservices.",
        "sql": f"Relational queries underpin virtually 100% of corporate data infrastructure. In {role}, SQL proficiency prevents slow analytical bottlenecks.",
        "pandas": f"Tabular manipulation and feature wrangling in {role} heavily rely on vectorized DataFrame operations.",
        "machine learning": f"Machine Learning operationalizes predictive analytics in {role}, bridging statistical inference with production decisions.",
        "pytorch": f"Deep learning frameworks provide tensor computation with automatic differentiation, essential for modern generative AI and computer vision roles.",
        "docker": f"Containerization guarantees reproducible execution between development environments and cloud clusters.",
    }

    strategic_text = importance_map.get(
        skill.lower(),
        f"{skill} is a core empirical competency frequently required across verified {role} job descriptions."
    )

    sequence_text = (
        f"Mastering {skill} requires solid grounding in {prereqs}. "
        f"By mastering these foundations first, cognitive load is minimized and technical concepts transfer smoothly."
    )

    project_guide = (
        f"When showcasing {skill} to hiring teams, avoid toy Kaggle datasets. "
        f"Instead, implement an end-to-end GitHub repository with automated tests, Dockerfile containerization, "
        f"and documented engineering decisions."
    )

    return {
        "skill_name": skill,
        "target_role": role,
        "strategic_importance": strategic_text,
        "learning_sequence_rationale": sequence_text,
        "capstone_application_guide": project_guide,
        "is_fallback": True,
    }
