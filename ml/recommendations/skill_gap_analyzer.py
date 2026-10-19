import math
from typing import Dict, Any, List, Optional, Set
from ml.recommendations.knowledge_graph import SkillKnowledgeGraph


class SkillGapAnalyzer:
    """
    Explainable Skill Gap and Prioritization Engine.
    Formula:
    Priority Score = 0.35 * Market Demand + 0.25 * Role Relevance +
                     0.20 * Gap Severity + 0.10 * Prerequisite Centrality +
                     0.10 * Learning Feasibility
    """

    def __init__(
        self,
        knowledge_graph: Optional[SkillKnowledgeGraph] = None,
        weights: Optional[Dict[str, float]] = None
    ):
        self.kg = knowledge_graph or SkillKnowledgeGraph()
        self.weights = weights or {
            "market_demand": 0.35,
            "role_relevance": 0.25,
            "gap_severity": 0.20,
            "prereq_importance": 0.10,
            "learning_feasibility": 0.10,
        }

    def analyze_gaps(
        self,
        target_role_skills: List[Dict[str, Any]],
        user_skills: Dict[str, str],  # {skill_slug: proficiency (beginner/intermediate/advanced)}
        empirical_demand_pct: Optional[Dict[str, float]] = None,
        target_proficiency_goal: str = "intermediate"
    ) -> List[Dict[str, Any]]:
        """
        Calculates gap severity, prerequisite order, and prioritized scores.
        """
        empirical_demand_pct = empirical_demand_pct or {}
        analyzed_items = []

        all_target_slugs = {s["slug"] for s in target_role_skills}
        user_slugs = set(user_skills.keys())

        # Determine missing foundational prerequisites not in target list
        missing_prereqs = set()
        for t_slug in all_target_slugs:
            prereqs = self.kg.get_prerequisites(t_slug, recursive=False)
            for p in prereqs:
                if p not in user_slugs and p not in all_target_slugs:
                    missing_prereqs.add(p)

        # Process target skills
        for item in target_role_skills:
            slug = item["slug"]
            name = item["name"]
            role_rel = float(item.get("relevance", 0.85))

            user_prof = user_skills.get(slug, "none").lower()
            is_missing = user_prof == "none"

            # Gap severity: 1.0 if completely missing, 0.5 if beginner aiming for intermediate/adv, 0.0 if already satisfied
            gap_severity = 1.0 if is_missing else (0.5 if user_prof == "beginner" and target_proficiency_goal != "beginner" else 0.0)

            # Market demand normalized to [0, 1]
            market_pct = empirical_demand_pct.get(slug, 50.0)
            norm_market = min(market_pct / 100.0, 1.0)

            # Prerequisite importance (how many other skills depend on this one)
            dependents_count = len(self.kg.get_dependents(slug))
            norm_prereq = min(dependents_count / 5.0, 1.0)

            # Learning feasibility (easier skills score higher on initial momentum)
            est_hours = self.kg.get_learning_hours(slug, user_prof, target_proficiency_goal)
            feasibility = max(0.2, 1.0 - (est_hours / 80.0))

            # Composite Priority Score
            score = (
                self.weights["market_demand"] * norm_market +
                self.weights["role_relevance"] * role_rel +
                self.weights["gap_severity"] * gap_severity +
                self.weights["prereq_importance"] * norm_prereq +
                self.weights["learning_feasibility"] * feasibility
            )

            analyzed_items.append({
                "skill_slug": slug,
                "skill_name": name,
                "user_proficiency": user_prof,
                "target_proficiency": target_proficiency_goal,
                "is_missing": is_missing,
                "needs_improvement": gap_severity > 0,
                "market_demand_pct": market_pct,
                "role_relevance": role_rel,
                "gap_severity": gap_severity,
                "estimated_learning_hours": est_hours,
                "priority_score": round(score, 4),
                "is_foundational_prerequisite": False,
            })

        # Add missing foundational prerequisites with high prerequisite importance
        for p_slug in missing_prereqs:
            est_hours = self.kg.get_learning_hours(p_slug, "none", "intermediate")
            score = 0.85  # Boosted priority because other skills depend on it
            analyzed_items.append({
                "skill_slug": p_slug,
                "skill_name": p_slug.replace("-", " ").title(),
                "user_proficiency": "none",
                "target_proficiency": "intermediate",
                "is_missing": True,
                "needs_improvement": True,
                "market_demand_pct": 50.0,
                "role_relevance": 0.9,
                "gap_severity": 1.0,
                "estimated_learning_hours": est_hours,
                "priority_score": round(score, 4),
                "is_foundational_prerequisite": True,
            })

        # Sort items based on topological prerequisites first, then priority score
        slug_list = [item["skill_slug"] for item in analyzed_items]
        topological_order = self.kg.topological_skill_sort(slug_list)
        order_map = {s: i for i, s in enumerate(topological_order)}

        # Sort by prerequisite order to guarantee no dependent is learned before its prerequisites
        analyzed_items.sort(key=lambda x: order_map.get(x["skill_slug"], 999))
        return analyzed_items
