# Skill Intelligence Methodology & Scoring Engine

## 1. Overview and Core Philosophy

In **CareerGPS**, skill recommendations and learning gap analyses are treated with analytical rigor rather than generative approximation. Instead of treating skill suggestions as an unverified LLM output, CareerGPS formulates learning roadmaps using an **explainable composite prioritization model** combined with a **Directed Acyclic Graph (DAG) topological prerequisite resolver**.

This ensures that:
1. Prerequisite dependencies are never violated (e.g., Python before Machine Learning, Linear Algebra before Deep Learning).
2. Scores are transparent, deterministic, and traceable to empirical market demand and occupational taxonomy definitions.
3. Every recommendation is accompanied by an explainable factor breakdown.

---

## 2. Multi-Factor Prioritization Formula

For every candidate target skill $s$ evaluated for a given user profile, the composite priority score $P(s) \in [0.0, 1.0]$ is computed as follows:

$$P(s) = w_1 \cdot D(s) + w_2 \cdot R(s) + w_3 \cdot G(s) + w_4 \cdot P_{\text{readiness}}(s) + w_5 \cdot F(s)$$

### Factor Breakdown & Weights

| Factor | Weight ($w_i$) | Component | Definition & Calculation |
| :--- | :---: | :--- | :--- |
| **Market Demand** | $0.35$ | $D(s)$ | **Normalized Job Posting Occurrence**: $\frac{\text{Postings Requiring } s}{\text{Total Role Postings}}$ (min-max scaled between 0.10 and 1.00 based on empirical Adzuna observation). |
| **Role Relevance** | $0.25$ | $R(s)$ | **Taxonomy Relevance**: ESCO / O*NET importance tier (Essential/Core = 1.00, High = 0.80, Moderate/Secondary = 0.50). |
| **Skill Gap** | $0.20$ | $G(s)$ | **Deficiency Severity**: $1.0 - \text{proficiency}(s)$, where proficiency ranges from 0.0 (None), 0.33 (Beginner), 0.66 (Intermediate), to 1.0 (Proficient). |
| **Prerequisite Readiness** | $0.10$ | $P_{\text{readiness}}(s)$ | **Upstream Dependency Health**: Fraction of immediate DAG prerequisite nodes already mastered by the user. If $s$ has no prerequisites, defaults to 1.0. |
| **Learning Feasibility** | $0.10$ | $F(s)$ | **Time-to-Mastery**: Scaled against the user's weekly study budget. Faster to acquire foundational skills score higher in early pacing cycles: $1.0 - \min(1.0, \frac{\text{est\_hours}(s)}{120})$. |

---

## 3. Prerequisite Resolution & Topological Ordering

A common flaw in automated learning plans is suggesting advanced libraries (e.g., PyTorch, Spark) before fundamental competencies (e.g., Python syntax, Data Structures, SQL). 

CareerGPS resolves this by enforcing an explicit Directed Acyclic Graph (DAG):
1. **Candidate Identification**: Filter target role skills where user proficiency is $< 0.8$.
2. **Missing Ancestor Traversal**: For each candidate skill, recursively query its ancestor prerequisite set:
   $$\text{Ancestors}(s) = \{p \in V \mid p \rightsquigarrow s\}$$
   Any missing upstream prerequisite is added to the required learning pool.
3. **Topological Pacing**: The full learning set is processed using Kahn's topological sort algorithm, ensuring that for every directed edge $(u, v) \in E$, $u$ is scheduled strictly before $v$.
4. **Isolated Skills**: Any empirical role skill not present in the curated DAG is safely preserved and appended following foundational prerequisites to guarantee zero omission.

---

## 4. Guardrails & Fair Presentation Disclaimers

To maintain high ethical standards in career guidance:
- **No Hiring Guarantees**: A priority score represents analytical study urgency, *never* a mathematical hiring probability or interview guarantee.
- **No Salary Entitlement**: Skills do not independently guarantee compensation levels. Compensation is evaluated through market percentiles and empirical ranges, not additive skill premiums.
- **Traceability**: All empirical demand frequencies cite posting sample counts ($N$). Where empirical observations are sparse ($N < 10$), the system falls back to standardized taxonomies and displays clear data sufficiency warnings.
