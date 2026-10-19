from typing import Dict, Any, List, Optional
from ml.recommendations.knowledge_graph import SkillKnowledgeGraph
from ml.recommendations.skill_gap_analyzer import SkillGapAnalyzer


class CareerTransitionAnalyzer:
    """
    Analyzes feasibility, skill overlap, and transition paths between two careers.
    """

    def __init__(self, knowledge_graph: Optional[SkillKnowledgeGraph] = None):
        self.kg = knowledge_graph or SkillKnowledgeGraph()

    def analyze_transition(
        self,
        current_role_title: str,
        target_role_title: str,
        current_skills: List[str],
        target_skills: List[str],
    ) -> Dict[str, Any]:
        curr_set = {s.lower().strip() for s in current_skills}
        target_set = {s.lower().strip() for s in target_skills}

        transferable = sorted(list(curr_set.intersection(target_set)))
        missing = sorted(list(target_set - curr_set))

        jaccard = len(transferable) / max(len(curr_set.union(target_set)), 1)

        # Topological sorting of missing skills
        ordered_missing = self.kg.topological_skill_sort(missing)

        total_hours = sum(self.kg.get_learning_hours(s, "none", "intermediate") for s in ordered_missing)

        if jaccard >= 0.5:
            difficulty = "Low to Moderate"
            notes = f"Significant technical overlap ({int(jaccard*100)}%). Your foundational experience transfers directly into {target_role_title}."
        elif jaccard >= 0.25:
            difficulty = "Moderate"
            notes = f"Noticeable overlap ({int(jaccard*100)}%). Shared analytical or programming core, requiring specialized upskilling in {len(missing)} areas."
        else:
            difficulty = "High"
            notes = f"Substantial pivot ({int(jaccard*100)}% overlap). Comprehensive foundational and practical preparation required across {len(missing)} competencies."

        recommended_projects = [
            f"End-to-end Portfolio Project bridging {current_role_title} domain knowledge with {target_role_title} tooling.",
            f"Production Capstone demonstrating {', '.join(ordered_missing[:3]) if ordered_missing else 'core requirements'}."
        ]

        return {
            "current_role": current_role_title,
            "target_role": target_role_title,
            "jaccard_similarity": round(jaccard, 4),
            "transition_difficulty": difficulty,
            "transferable_skills": transferable,
            "missing_target_skills": ordered_missing,
            "estimated_transition_hours": total_hours,
            "recommended_projects": recommended_projects,
            "explanation": notes,
        }
