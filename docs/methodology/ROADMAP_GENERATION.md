# Adaptive Career Roadmap Generation

## 1. Executive Summary

The CareerGPS Roadmap Generator (`ml/recommendations/roadmap_generator.py`) generates customized, time-budgeted weekly learning paths. It translates a user's target career, target country, baseline proficiencies, and weekly available study hours into an actionable curriculum.

Unlike generic ChatGPT-generated schedules that suggest vague instructions (e.g., "Week 1: Learn AI"), CareerGPS produces structured modules containing:
- Specific competencies prioritized through empirical demand and DAG constraints.
- Real-world project deliverables (e.g., "Build an automated ETL pipeline with DuckDB").
- Official, verified learning documentation links (e.g., Python Docs, Pandas Docs, Scikit-learn User Guide).
- Realistic timeline pacing based on conservative learning duration estimates.
- Feasibility reality checks when study budgets do not match target milestones.

---

## 2. Adaptive Pacing Algorithm

The roadmap duration is strictly calculated based on the candidate's remaining skill gap and available weekly hours:

$$\text{Total Hours Required} = \sum_{s \in \text{Gap}} \text{Estimated Hours}(s) \times (1.0 - \text{proficiency}(s))$$

$$\text{Calculated Weeks} = \max\left(4, \left\lceil \frac{\text{Total Hours Required}}{\text{Weekly Study Hours}} \right\rceil\right)$$

### Pacing Rules & Phases

The calculated weeks are divided into three progressive phases:

1. **Foundations (Weeks $1 \dots \lfloor W/3 \rfloor$)**: Core prerequisites (Python, SQL, Math, Git) that eliminate baseline deficits.
2. **Core Competencies (Weeks $\lfloor W/3 \rfloor + 1 \dots \lfloor 2W/3 \rfloor$)**: Core occupational skills (Pandas, Machine Learning, Data Modeling, API Design) required by over 50% of empirical postings.
3. **Advanced & Production Specialization (Weeks $\lfloor 2W/3 \rfloor + 1 \dots W$)**: High-level tooling (Docker, CI/CD, PyTorch, BigQuery, Airflow) and the end-to-end Capstone Portfolio Deliverable.

---

## 3. Verified Resource Repository

To prevent hallucinated links, 404 dead ends, or low-quality clickbait, learning resources are locked to verified official documentation and reputable open-source guides:

| Skill | Resource Title | Verified Documentation URL |
| :--- | :--- | :--- |
| `Python` | Python Official Documentation | `https://docs.python.org/3/tutorial/` |
| `SQL` | Mode Analytics SQL Tutorial & PostgreSQL Manual | `https://mode.com/sql-tutorial/` |
| `Pandas` | Pandas Official Documentation | `https://pandas.pydata.org/docs/getting_started/index.html` |
| `Machine Learning` | Scikit-Learn User Guide | `https://scikit-learn.org/stable/user_guide.html` |
| `Deep Learning` | PyTorch Official Tutorials | `https://pytorch.org/tutorials/` |
| `Power BI` | Microsoft Power BI Documentation | `https://learn.microsoft.com/en-us/power-bi/` |
| `Docker` | Docker Documentation Get Started | `https://docs.docker.com/get-started/` |
| `Git` | Pro Git Book (Scott Chacon & Ben Straub) | `https://git-scm.com/book/en/v2` |

---

## 4. Deterministic Engine vs LLM Fallback

CareerGPS follows a **Zero-API-Key Reliability Principle**:
- **Deterministic Core**: The algorithmic pipeline (Skill Gap Analysis $\rightarrow$ Prerequisite Topological Sort $\rightarrow$ Timeline Pacing $\rightarrow$ Milestone Assembly) executes 100% deterministically using Python without requiring any LLM API key.
- **LLM Synthesis (Optional)**: If an OpenAI/Anthropic/Gemini API key is configured, an LLM enricher may polish milestone summaries and contextual narratives. If absent or if rate limits occur, the platform falls back seamlessly to the deterministic engine without breaking user workflows or raising 500 errors.
