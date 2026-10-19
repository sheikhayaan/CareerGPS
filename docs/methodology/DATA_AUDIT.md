# CareerGPS — Phase 3 Comprehensive Data Audit Report

**Audit Timestamp**: 2026-10-12T10:57:00Z  
**Auditor**: Principal Data Analyst & Senior Analytics Engineer  
**Database Runtime**: SQLite 3.x (Development / Local Verification) / PostgreSQL 16 Target Compatibility  
**Primary Analytical Database File**: `apps/api/careergps.db`

---

## 1. Executive Summary & Dataset Categorization

In strict accordance with analytical integrity rules, we categorically distinguish the three datasets operating in CareerGPS:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. OCCUPATIONAL REFERENCE TAXONOMIES (O*NET 28.0 & ESCO v1.1.1)            │
│    - Status: Canonical static taxonomies & standardized definitions.        │
│    - Counts: 6 Standard Roles (SOC 2018), 27 Canonical Skills, 96 Aliases.  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. GOVERNMENT BENCHMARK STATISTICS (US Bureau of Labor Statistics OEWS)     │
│    - Status: Official national benchmark salary percentiles (P10..P90).    │
│    - Role: External control & calibration baseline.                        │
│    - Rule: NEVER merged directly into observational job advertisement sample│
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. EMPIRICAL JOB POSTING OBSERVATIONS (Adzuna Baseline & Verified Postings)│
│    - Status: 227 Distinct validated postings.                               │
│    - Deduplication: SHA-256 fingerprinting with 0 collision tolerance.     │
│    - Salary Coverage: 100% of currently loaded postings have salary specs. │
│    - Skills Associated: 937 distinct job-skill relationships.               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Table-by-Table Inventory & Coverage

| Table Name | Record Count | Distinct Entities / Keys | Statistical Purpose |
| :--- | :--- | :--- | :--- |
| `career_roles` | **6** | `data-analyst`, `data-scientist`, `software-engineer`, `machine-learning-engineer`, `business-analyst`, `cybersecurity-analyst` | Primary occupational taxonomy anchor |
| `countries` | **4** | `US`, `IN`, `GB`, `DE` | Geographic aggregation boundary |
| `cities` | **19** | New York, SF, London, Berlin, Bengaluru, etc. | Regional granularity |
| `companies` | **27** | Bloomberg, Stripe, Amazon, BMW, Deloitte, etc. | Employer distribution analysis |
| `skills` | **27** | SQL, Python, Excel, PyTorch, Docker, etc. | Skill taxonomy & extraction vocabulary |
| `skill_aliases` | **96** | Alternative tech terminology, abbreviations | Word-boundary matching alias map |
| `job_postings` | **227** | SHA-256 unique fingerprints | Observed labor demand observations |
| `job_skills` | **937** | Many-to-many associations | Skill demand frequency & co-occurrence |
| `salary_observations` | **27** | Granular observation logs | Time-stamped wage tracking |
| `data_sources` | **5** | O*NET, ESCO, BLS, Adzuna, Verified Labor Ingestion | Data lineage & licensing tracking |
| `data_ingestion_runs` | **2** | Completed batch logs | Ingestion health audit |

---

## 3. Empirical Job Postings by Role & Geographic Cohort

Sample sizes ($N$) per role-country cohort determine statistical sufficiency ($N \ge 10$):

| Career Role | Country | Observed Postings ($N$) | Statistical Status | Valid for Distribution Metrics? |
| :--- | :--- | :--- | :--- | :--- |
| **Data Analyst** | `US` | 28 | **Sufficient ($N \ge 10$)** | Yes (Parametric & Non-Parametric) |
| **Data Analyst** | `IN` | 27 | **Sufficient ($N \ge 10$)** | Yes (Parametric & Non-Parametric) |
| **Data Analyst** | `GB` | 26 | **Sufficient ($N \ge 10$)** | Yes (Parametric & Non-Parametric) |
| **Data Analyst** | `DE` | 26 | **Sufficient ($N \ge 10$)** | Yes (Parametric & Non-Parametric) |
| **Data Scientist** | `US` | 27 | **Sufficient ($N \ge 10$)** | Yes (Parametric & Non-Parametric) |
| **Data Scientist** | `IN` | 26 | **Sufficient ($N \ge 10$)** | Yes (Parametric & Non-Parametric) |
| **Data Scientist** | `GB` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |
| **Data Scientist** | `DE` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |
| **Software Engineer** | `US` | 27 | **Sufficient ($N \ge 10$)** | Yes (Parametric & Non-Parametric) |
| **Software Engineer** | `IN` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |
| **Software Engineer** | `GB` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |
| **Software Engineer** | `DE` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |
| **Machine Learning Engineer** | `US` | 26 | **Sufficient ($N \ge 10$)** | Yes (Parametric & Non-Parametric) |
| **Machine Learning Engineer** | `IN` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |
| **Machine Learning Engineer** | `GB` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |
| **Machine Learning Engineer** | `DE` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |
| **Business Analyst** | `US` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |
| **Business Analyst** | `IN` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |
| **Business Analyst** | `GB` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |
| **Cybersecurity Analyst** | `US` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |
| **Cybersecurity Analyst** | `IN` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |
| **Cybersecurity Analyst** | `DE` | 1 | *Sparse ($N < 10$)* | Insufficient (Explicit notice shown) |

---

## 4. Analytical Safeguards Established

1. **Explicit Insufficiency Enforcement**: The SQL view `v_salary_distributions` and API endpoint `GET /api/salaries/summary` return `is_statistically_sufficient: false` for all cohorts with $N < 10$.
2. **Denominators in Skill Frequency**: The denominator for skill demand percentage is strictly the total distinct postings in that specific cohort, never the global total across unrelated roles.
3. **No Synthetic Extrapolation**: Where cohorts lack dense observations, the platform presents verified government reference figures (BLS OEWS) clearly marked as **"Government Benchmark Reference"** without contaminating the empirical postings sample.
