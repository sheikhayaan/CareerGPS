from typing import Dict, Any, List, Optional
import math
from ml.recommendations.knowledge_graph import SkillKnowledgeGraph
from ml.recommendations.skill_gap_analyzer import SkillGapAnalyzer


# Skill-specific domain definitions for concrete WHAT, WHY, HOW, and DELIVERABLES
SKILL_PRACTICAL_GUIDE: Dict[str, Dict[str, Any]] = {
    "sql": {
        "why": "SQL is requested in over 85% of analytics postings. It forms the foundation for data extraction, joining transactional records, and aggregations.",
        "topics": [
            "SELECT, WHERE filtering, and multi-table INNER / LEFT / FULL JOIN operations",
            "Aggregation functions, GROUP BY, and HAVING clause filtering",
            "Subqueries, Common Table Expressions (WITH queries), and query execution plans",
            "Window functions: ROW_NUMBER(), RANK(), DENSE_RANK(), and running totals"
        ],
        "exercises": [
            "Write queries analyzing e-commerce order funnels and calculate customer repeat purchase rates.",
            "Optimize a slow multi-join query using appropriate indexing and CTE restructuring.",
            "Calculate monthly cohort retention rates using SQL window functions."
        ],
        "deliverables": [
            "Can write production SQL queries with window functions without syntax references.",
            "Passes 10 complex LeetCode / StrataScratch SQL challenges (Medium difficulty).",
            "Creates a reproducible SQLite / PostgreSQL analysis script with clean comments."
        ]
    },
    "python": {
        "why": "Python is the primary language for production data pipelines, automated ETL, and machine learning models across modern tech teams.",
        "topics": [
            "Core data structures (lists, dicts, sets, tuples), list comprehensions, and generators",
            "Object-oriented programming, classes, error handling, and file I/O operations",
            "Modular code architecture, virtual environments, pip, and type hints",
            "Consuming REST APIs with requests and handling JSON payloads"
        ],
        "exercises": [
            "Build a modular Python script that parses raw CSV/JSON logs and outputs summary statistics.",
            "Write a script that queries a public weather or financial API and caches responses.",
            "Write automated unit tests using pytest with 80%+ test coverage."
        ],
        "deliverables": [
            "Comfortable developing Python scripts adhering to PEP 8 standards.",
            "Published Python utility repository on GitHub with setup instructions and tests."
        ]
    },
    "pandas": {
        "why": "Pandas is the industry-standard data manipulation tool in Python, essential for cleaning messy tabular records and EDA.",
        "topics": [
            "DataFrames & Series, indexing, boolean filtering, and column transformations",
            "Handling missing values: dropna, fillna, interpolation, and data type coercion",
            "Groupby aggregations, pivot tables, and merging multiple datasets",
            "Time-series handling, date parsing, and rolling averages"
        ],
        "exercises": [
            "Clean a dirty dataset with mixed types, missing IDs, and malformed date strings.",
            "Perform exploratory data analysis on a 50,000-row real estate or sales dataset.",
            "Generate summary metric tables comparing yearly performance across regional cohorts."
        ],
        "deliverables": [
            "Can clean, pivot, and analyze datasets entirely in Pandas with zero manual Excel work.",
            "A well-documented Jupyter notebook demonstrating reproducible data transformations."
        ]
    },
    "excel": {
        "why": "Excel remains the universal language of business stakeholders and executive reporting.",
        "topics": [
            "Advanced lookups: XLOOKUP, INDEX-MATCH, and nested conditional logic (IFS)",
            "Pivot tables, slicers, calculated fields, and multi-sheet consolidation",
            "Data validation, conditional formatting rules, and dynamic range arrays",
            "Financial modeling foundations and executive summary dashboards"
        ],
        "exercises": [
            "Build an interactive financial summary dashboard with dynamic KPI cards and slicers.",
            "Clean and reconcile two mismatched customer tables using dynamic arrays and XLOOKUP."
        ],
        "deliverables": [
            "Can build an executive-ready spreadsheet model with audit-friendly formula structures."
        ]
    },
    "power-bi": {
        "why": "Power BI connects directly to data warehouses to deliver automated, self-serve executive dashboards.",
        "topics": [
            "Power Query ETL, data transformations, and star-schema dimensional modeling",
            "DAX formulas: CALCULATE, FILTER, RELATED, and time-intelligence measures (YTD, YoY)",
            "Interactive visuals, drill-through pages, bookmark navigation, and RLS security",
            "Publishing reports to Power BI Service and configuring scheduled data refreshes"
        ],
        "exercises": [
            "Build a 3-page interactive sales performance dashboard with drill-down hierarchy.",
            "Write DAX measures for Year-over-Year revenue growth and trailing 12-month averages."
        ],
        "deliverables": [
            "A polished .pbix dashboard portfolio project published on NovyPro or GitHub."
        ]
    },
    "tableau": {
        "why": "Tableau is the leading visual analytics platform for exploratory visualization and storytelling.",
        "topics": [
            "Connecting to live vs extract sources, relationships, and data joins",
            "Level of Detail (LOD) expressions: FIXED, INCLUDE, and EXCLUDE",
            "Designing intuitive layouts, interactive filter actions, and tooltips",
            "Visual best practices: color theory, chart selection, and clutter reduction"
        ],
        "exercises": [
            "Design an interactive healthcare or logistics monitoring dashboard.",
            "Implement FIXED LOD calculations to compute cohort benchmark averages."
        ],
        "deliverables": [
            "A published Tableau Public workbook featuring an interactive portfolio dashboard."
        ]
    },
    "statistics": {
        "why": "Statistical foundations prevent costly misinterpretations of data and power sound A/B testing decisions.",
        "topics": [
            "Descriptive statistics: mean, median, IQR, variance, and skewness",
            "Probability distributions: Normal, Binomial, Poisson, and Central Limit Theorem",
            "Hypothesis testing: t-tests, ANOVA, Chi-Square, p-values, and Type I/II errors",
            "Linear regression, correlation vs causation, and confidence intervals"
        ],
        "exercises": [
            "Design and analyze an end-to-end A/B test experiment with sample size calculation.",
            "Fit an ordinary least squares regression model and diagnose residual plots for homoscedasticity."
        ],
        "deliverables": [
            "Able to interpret confidence intervals and explain p-values accurately to non-technical partners."
        ]
    },
    "machine-learning": {
        "why": "Predictive modeling and classification empower modern data products to forecast trends and automate decisions.",
        "topics": [
            "Supervised learning: linear/logistic regression, decision trees, random forests, and gradient boosting (XGBoost)",
            "Cross-validation, train/test splitting, and hyperparameter tuning (GridSearchCV)",
            "Evaluation metrics: Precision, Recall, F1-Score, ROC-AUC, RMSE, and MAE",
            "Unsupervised learning: K-Means clustering and PCA dimensionality reduction"
        ],
        "exercises": [
            "Train and evaluate a customer churn prediction pipeline with XGBoost and feature importance analysis.",
            "Perform customer segmentation using K-Means and visualize cluster centroids."
        ],
        "deliverables": [
            "An end-to-end ML pipeline with reproducible feature engineering and ROC-AUC > 0.82."
        ]
    },
    "scikit-learn": {
        "why": "Scikit-Learn provides production-tested APIs for preprocessing, pipeline construction, and model training.",
        "topics": [
            "ColumnTransformer, StandardScaler, OneHotEncoder, and Pipeline chaining",
            "Handling class imbalance using SMOTE and class-weight balancing",
            "Model persistence with joblib and reproducible random states"
        ],
        "exercises": [
            "Construct a leak-free scikit-learn Pipeline incorporating scaling, encoding, and model fitting.",
            "Export the trained pipeline artifact and build an inference test script."
        ],
        "deliverables": [
            "Clean python module executing an automated Scikit-Learn training and validation pipeline."
        ]
    },
    "git": {
        "why": "Version control is universally required for code collaboration and CI/CD deployment pipelines.",
        "topics": [
            "Git core concepts: working directory, staging area, commit history, and branches",
            "Branching workflows: feature branches, merge conflicts, pull requests, and code review",
            "Advanced Git: rebase, cherry-pick, stash, and gitignore management"
        ],
        "exercises": [
            "Create a multi-branch repository, simulate a merge conflict, and cleanly resolve it.",
            "Write conventional commit messages and submit a formatted GitHub Pull Request."
        ],
        "deliverables": [
            "Active GitHub profile demonstrating clean commit history and professional README documentation."
        ]
    },
    "docker": {
        "why": "Containerization guarantees that code runs identically across developer laptops and production servers.",
        "topics": [
            "Docker images, Dockerfile instructions (FROM, WORKDIR, COPY, RUN, CMD)",
            "Container lifecycles, port mapping, environment variables, and volume mounting",
            "Docker Compose for multi-container orchestration (API + PostgreSQL)"
        ],
        "exercises": [
            "Containerize a Python FastAPI data application with a lightweight multi-stage Dockerfile.",
            "Run a local PostgreSQL database alongside your app using docker-compose.yml."
        ],
        "deliverables": [
            "A containerized application that runs locally with a single `docker compose up` command."
        ]
    }
}


class AdaptiveRoadmapGenerator:
    """
    Deterministic Roadmap Generator with verified resource allocation,
    actionable weekly objectives, learning time budgeting, and feasibility warnings.
    """

    def __init__(self, knowledge_graph: Optional[SkillKnowledgeGraph] = None):
        self.kg = knowledge_graph or SkillKnowledgeGraph()

    def generate_roadmap(
        self,
        role_title: str,
        country_name: str,
        experience_level: str,
        weekly_hours: int,
        target_weeks: int,
        prioritized_skills: List[Dict[str, Any]],
        resource_catalog: Dict[str, List[Dict[str, Any]]],
    ) -> Dict[str, Any]:
        """
        Builds a multi-week structured learning plan.
        Respects weekly hour limits and tags verified resources with concrete WHAT, WHY, HOW guidance.
        """
        total_available_hours = weekly_hours * target_weeks
        allocated_hours = 0.0

        weekly_plan = []
        current_week = 1

        uncovered_skills = []

        for item in prioritized_skills:
            slug = item["skill_slug"]
            name = item["skill_name"]
            est_hours = float(item["estimated_learning_hours"])
            demand_pct = float(item.get("market_demand_pct", 50.0))

            # Check if skill fits within requested timeline
            if (allocated_hours + est_hours) > (total_available_hours * 1.15):
                uncovered_skills.append(name)
                continue

            # Resources for this skill
            res_list = resource_catalog.get(slug, [])
            verified_resources = [
                {
                    "title": r["title"],
                    "provider": r["provider"],
                    "url": r["url"],
                    "is_free": r.get("is_free", True),
                    "estimated_hours": float(r.get("estimated_hours", 10.0))
                }
                for r in res_list[:2]
            ]

            guide = SKILL_PRACTICAL_GUIDE.get(slug, {
                "why": f"Appears in {int(demand_pct)}% of verified {role_title} postings. Core technical prerequisite for day-to-day delivery.",
                "topics": [
                    f"{name} syntax, fundamental concepts, and standard idioms",
                    f"Integrating {name} into modern {role_title} workflows",
                    f"Debugging, performance optimization, and industry conventions"
                ],
                "exercises": [
                    f"Implement an end-to-end practical exercise applying {name} to realistic data.",
                    f"Complete benchmark exercises and push code to your portfolio."
                ],
                "deliverables": [
                    f"Can explain {name} architecture and best practices to technical interviewers.",
                    f"Commits verified solution to GitHub portfolio with reproducible instructions."
                ]
            })

            weeks_for_skill = max(1, math.ceil(est_hours / max(weekly_hours, 1)))

            for w_offset in range(weeks_for_skill):
                week_num = current_week + w_offset
                is_first = (w_offset == 0)

                weekly_plan.append({
                    "week_number": week_num,
                    "title": f"Core Foundations: {name}" if is_first else f"Advanced Practice & Project: {name}",
                    "skills": [name],
                    "learning_objectives": [
                        f"Master {name}: {guide['why'][:100]}...",
                        f"Build hands-on practical competency aligned with {role_title} job requirements."
                    ],
                    "topics": guide["topics"],
                    "resources": verified_resources if is_first else [],
                    "practice_exercises": guide["exercises"],
                    "estimated_hours": round(min(float(weekly_hours), est_hours - (w_offset * weekly_hours)), 1),
                    "completion_criteria": guide["deliverables"]
                })

            current_week += weeks_for_skill
            allocated_hours += est_hours

        is_realistic = len(uncovered_skills) == 0 and (allocated_hours <= total_available_hours * 1.1)

        feasibility_note = (
            f"The target timeline is fully realistic: {int(allocated_hours)} estimated hours required across "
            f"{target_weeks} weeks ({weekly_hours}h/week)."
            if is_realistic else
            f"Timeline constraints: At {weekly_hours}h/week across {target_weeks} weeks ({total_available_hours} total hours), "
            f"we prioritized the highest ROI foundational skills. {len(uncovered_skills)} secondary skills "
            f"({', '.join(uncovered_skills[:3])}) were deferred to prevent cognitive overload."
        )

        top_skills = [item["skill_name"] for item in prioritized_skills[:4]]
        portfolio_projects = [
            {
                "title": f"{role_title} Production-Ready Industry Capstone",
                "description": (
                    f"Build an end-to-end, production-grade portfolio project demonstrating {', '.join(top_skills[:3])}. "
                    f"Designed to showcase verified job-ready capabilities to hiring managers."
                ),
                "skills_demonstrated": top_skills,
                "deliverables": [
                    "GitHub repository with clean architecture diagram, requirements.txt, and setup script",
                    "Reproducible data pipeline or analytical dashboard with live interactive demo link",
                    "3-minute video walkthrough explaining key technical decisions and trade-offs"
                ]
            }
        ]

        return {
            "career_goal": {
                "role": role_title,
                "country": country_name,
                "experience_level": experience_level
            },
            "summary": {
                "total_weeks": min(target_weeks, max(current_week - 1, 1)),
                "weekly_hours": weekly_hours,
                "estimated_total_hours": round(allocated_hours, 1),
                "is_timeline_realistic": is_realistic,
                "feasibility_note": feasibility_note
            },
            "weekly_plan": weekly_plan,
            "portfolio_projects": portfolio_projects,
            "deferred_skills": uncovered_skills,
            "limitations": [
                "Learning hour estimates are planning guidelines based on empirical taxonomy benchmarks.",
                "Portfolio projects should be tailored to showcase individual domain interests (FinTech, E-commerce, Healthcare)."
            ]
        }
