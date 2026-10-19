import os
import json
import logging
from typing import List, Dict, Set, Optional, Any, Tuple
import networkx as nx

logger = logging.getLogger(__name__)


class SkillKnowledgeGraph:
    """
    Graph-based Skill Dependency and Knowledge Engine using NetworkX.
    Enforces a Directed Acyclic Graph (DAG) for skill prerequisites,
    provides cycle detection, topological sorting, and dependency resolution.
    """

    def __init__(self, data_file: Optional[str] = None):
        self.graph = nx.DiGraph()
        self.estimates: Dict[str, Dict[str, Any]] = {}

        if data_file is None:
            data_file = os.path.realpath(
                os.path.join(os.path.dirname(__file__), "..", "..", "data", "dictionaries", "skill_prerequisites.json")
            )

        self._load_from_json(data_file)

    def _load_from_json(self, file_path: str):
        if not os.path.exists(file_path):
            logger.warning(f"Prerequisite definition file not found at {file_path}. Initializing empty graph.")
            return

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        prereqs = data.get("prerequisites", [])
        self.estimates = data.get("learning_estimates", {})

        for edge in prereqs:
            skill = edge["skill"]
            prereq = edge["prerequisite"]
            strength = edge.get("strength", "REQUIRED")
            # Directed edge from prerequisite to skill: prereq -> skill
            self.graph.add_edge(prereq, skill, strength=strength)

        # Ensure no cycles in curated DAG
        if not nx.is_directed_acyclic_graph(self.graph):
            cycles = list(nx.simple_cycles(self.graph))
            raise ValueError(f"Prerequisite knowledge graph contains cyclical dependencies: {cycles}")

    def get_prerequisites(self, skill: str, recursive: bool = True) -> Set[str]:
        """Finds all direct or transitive prerequisites for a skill."""
        if skill not in self.graph:
            return set()

        if not recursive:
            return set(self.graph.predecessors(skill))

        # Transitive ancestors (all nodes that have a directed path to skill)
        return nx.ancestors(self.graph, skill)

    def get_dependents(self, skill: str) -> Set[str]:
        """Finds all skills that require this skill."""
        if skill not in self.graph:
            return set()
        return nx.descendants(self.graph, skill)

    def topological_skill_sort(self, skills: List[str]) -> List[str]:
        """
        Orders a target list of skills such that all prerequisites
        appear before the dependent skills.
        """
        target_set = set(skills)
        # Create subgraph of only nodes within the target set and their ancestors
        relevant_nodes = set()
        for s in target_set:
            relevant_nodes.add(s)
            relevant_nodes.update(self.get_prerequisites(s, recursive=True))

        subgraph = self.graph.subgraph(relevant_nodes)
        full_sorted = list(nx.topological_sort(subgraph))

        # Return items in target_set ordered by their topological position
        in_graph = [s for s in full_sorted if s in target_set]
        not_in_graph = [s for s in skills if s not in in_graph and s in target_set]
        return in_graph + not_in_graph

    def get_learning_hours(self, skill: str, user_prof: str = "none", target_prof: str = "intermediate") -> float:
        """
        Returns estimated planning study hours based on proficiency differential.
        """
        est = self.estimates.get(skill, {})
        hrs_b_to_i = est.get("hours_beginner_to_intermediate", 20.0)
        hrs_i_to_a = est.get("hours_intermediate_to_advanced", 30.0)

        u = user_prof.lower()
        t = target_prof.lower()

        if u == "none" or u == "beginner":
            if t == "intermediate":
                return hrs_b_to_i
            elif t == "advanced":
                return hrs_b_to_i + hrs_i_to_a
        elif u == "intermediate":
            if t == "advanced":
                return hrs_i_to_a

        return 15.0  # Default heuristic refresher allocation

    def get_difficulty(self, skill: str) -> str:
        return self.estimates.get(skill, {}).get("difficulty", "Medium")

    def export_knowledge_graph(self) -> Dict[str, Any]:
        """Exports graph nodes and edges for visual frontend rendering."""
        nodes = []
        for n in self.graph.nodes:
            diff = self.get_difficulty(n)
            nodes.append({"id": n, "label": n.replace("-", " ").title(), "difficulty": diff})

        edges = []
        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "source": u,
                "target": v,
                "strength": data.get("strength", "REQUIRED")
            })

        return {"nodes": nodes, "edges": edges}
