# CareerGPS — Global AI Career Intelligence Platform

> **"Navigate Your Career With Data."**

CareerGPS is a production-oriented SaaS platform engineered to deliver evidence-backed career intelligence, reproducible labor market statistics, skill gap evaluations, and personalized learning roadmaps for students and tech professionals worldwide.

---

## 🏛️ Executive Architecture & System Topology

CareerGPS bridges real-world labor market data pipelines with modern web intelligence:

```
[ External Data Providers ]
(Adzuna API, O*NET, ESCO, National Statistics)
             │
             ▼
[ Ingestion & Normalization Pipelines ] (Python / Pandas / Pydantic)
             │
             ▼
[ Normalized Data Layer ] (PostgreSQL 16 + Timescale/Analytics Views)
             │
      ┌──────┴─────────────────────────┐
      ▼                                ▼
[ Analytical Engine & Models ]   [ Vector & Semantic Taxonomies ]
(SciPy, Statsmodels, Co-occurrence)  (spaCy, Curated Taxonomies)
      │                                │
      └──────────────┬─────────────────┘
                     ▼
           [ FastAPI Core Service ]
           (Async REST API, Pydantic v2, JWT Auth, PostHog Analytics)
                     │
                     ▼
           [ Next.js 15 Web Client ]
           (React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts)
```

---

## 🚀 Key Capabilities

1. **Labor Market Analytics**: Observed posting volumes, demand trajectories, and statistical coverage metrics across target roles (Data Analyst, Data Scientist, Software Engineer, Machine Learning Engineer, Business Analyst, Cybersecurity Analyst) across India, the United States, the United Kingdom, and Germany.
2. **Deterministic Salary Intelligence**: Rigorous parametric and non-parametric salary distributions (Median, 25th/75th percentiles, IQR, currency normalization, and outlier detection). *Never fabricates estimates when sample size is insufficient.*
3. **Skill Gap Radar & Co-occurrence**: Canonical skill extraction mapped to O*NET and ESCO taxonomies, calculating co-occurrence frequencies and market penetration.
4. **Hybrid Personalized Roadmap Engine**: Algorithmic prerequisite prioritization blended with structured LLM contextualization and verified resource curation.
5. **Transparency & Lineage**: Open methodology, data freshness indicators, sample sizes, and exportable audit reports.

---

## 💻 Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts, TanStack Query.
- **Backend**: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Async/Sync), Alembic.
- **Database**: PostgreSQL 16 (with SQLite support for local lightweight verification).
- **Analytics & ML**: Pandas, NumPy, SciPy, Scikit-learn, spaCy.
- **Observability & Analytics**: PostHog product analytics integration.
- **CI/CD & Cloud**: GitHub Actions, Docker, Render / Vercel ready.

---

## 🛠️ Quickstart

### Prerequisites
- Node.js >= 18.x
- Python >= 3.11
- PostgreSQL 15+ (or built-in local SQLite fallback for rapid testing)

### Backend Setup
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Documentation will be accessible at: `http://localhost:8000/docs`

### Frontend Setup
```bash
cd apps/web
npm install
npm run dev
```
Web client will be accessible at: `http://localhost:3000`

---

## 📜 Development Status & Phase Progress

- [x] **Phase 1: Architecture & Scaffolding** — Next.js 15, FastAPI, SQLAlchemy 2, initial models & Pytest foundation.
- [x] **Phase 2: Real-World Data Engineering & Database Implementation**
  - **Standard Taxonomies**: Integrated O*NET 28.0 (roles & SOC codes) and European ESCO v1.1.1 (skills & aliases).
  - **ETL Pipeline**: Modular `extract`, `transform`, `validation`, and `load` pipelines with SHA-256 deduplication and regex boundary skill extraction.
  - **Relational PostgreSQL / Alembic Migration**: Complete normalized tables with indexes, foreign keys, and batch migration support.
  - **Analytical SQL Views**: High-performance views for jobs by role/country, windowed skill demand ranking, salary distributions, experience levels, and source coverage.

- [x] **Phase 3: Advanced Data Analytics, Statistical Intelligence & Dashboards**
  - **Empirical Data Audit**: Detailed dataset profiling in [docs/methodology/DATA_AUDIT.md](docs/methodology/DATA_AUDIT.md).
  - **20 Advanced Analytical SQL Queries**: Full enterprise SQL suite in [analytics/sql/advanced_analytics_queries.sql](analytics/sql/advanced_analytics_queries.sql) utilizing CTEs, `DENSE_RANK()`, `ROW_NUMBER()`, rolling 3-day averages, self-joins, and Tukey outlier filters.
  - **Statistical Analytics Engine**: Reusable pure-Python engine in [analytics/statistics_engine.py](analytics/statistics_engine.py) computing parametric/non-parametric statistics, Tukey IQR outlier detection, 1,000-iteration bootstrap confidence intervals ($N \ge 15$), and Jaccard skill profile similarity.
  - **Advanced REST Analytics API**:
    - `GET /api/analytics/overview` (Market KPIs and cohort health)
    - `GET /api/analytics/skills/demand` (Empirical demand % and windowed ranking)
    - `GET /api/analytics/skills/cooccurrence` (Pairwise skill co-occurrence frequencies)
    - `GET /api/analytics/careers/comparison` (Jaccard skill profile similarity)
    - `GET /api/analytics/countries/comparison` (Cross-national opportunity comparison)
    - `GET /api/analytics/salaries/distribution` (Quartiles, bootstrap CIs, Tukey bounds, and BLS OEWS benchmarks)
    - `GET /api/analytics/market/trends` (Day-over-day posting volume and rolling averages)
    - `GET /api/analytics/data-quality` (Completeness, disclosure, and freshness audit)
  - **Interactive ECharts Dashboard**: Dynamic frontend with Apache ECharts horizontal bar charts, boxplot quartile visualizers, co-occurrence matrices, and career similarity calculators.
  - **Power BI Star Schema Reporting Layer**: 9 dimensional and fact views in [analytics/sql/power_bi_star_schema.sql](analytics/sql/power_bi_star_schema.sql) with modeling guide and DAX measures in [docs/methodology/POWER_BI_GUIDE.md](docs/methodology/POWER_BI_GUIDE.md).
- [x] **Phase 4: Advanced Skill Intelligence, AI Recommendation Engine, Knowledge Graph & Hyper-Personalized Career Roadmap System**
  - **Skill Prerequisite Knowledge Graph**: Modeled as a strict Directed Acyclic Graph (DAG) with NetworkX in [`ml/recommendations/knowledge_graph.py`](ml/recommendations/knowledge_graph.py). Includes cycle detection, recursive ancestor resolution, and Kahn's topological sort for curriculum scheduling. Documented in [`docs/methodology/KNOWLEDGE_GRAPH.md`](docs/methodology/KNOWLEDGE_GRAPH.md).
  - **Explainable Skill Gap & Prioritization Engine**: Multi-factor composite heuristic in [`ml/recommendations/skill_gap_analyzer.py`](ml/recommendations/skill_gap_analyzer.py) balancing empirical demand (35%), role relevance (25%), proficiency gap (20%), prerequisite readiness (10%), and learning feasibility (10%). Documented in [`docs/methodology/SKILL_INTELLIGENCE.md`](docs/methodology/SKILL_INTELLIGENCE.md).
  - **Career Transition Analyzer**: Computes Jaccard competency overlap, transition difficulty tiers, and transferable vs missing target skills in [`ml/recommendations/transition_analyzer.py`](ml/recommendations/transition_analyzer.py).
  - **Salary Reality Checker**: Non-parametric comparison of target compensation against empirical quartiles and US BLS national benchmarks with feasibility warnings in [`ml/recommendations/salary_reality_checker.py`](ml/recommendations/salary_reality_checker.py).
  - **Adaptive Roadmap Generator & Verified Resources**: Multi-week time-budgeted schedules with verified official documentation links and portfolio capstones in [`ml/recommendations/roadmap_generator.py`](ml/recommendations/roadmap_generator.py). Fully deterministic fallback requiring zero paid LLM API keys. Documented in [`docs/methodology/ROADMAP_GENERATION.md`](docs/methodology/ROADMAP_GENERATION.md).
  - **Phase 4 Career Intelligence REST APIs**:
    - `POST /api/career/profile/analyze` (Comprehensive gap, transition, and salary evaluation)
    - `POST /api/career/skills/gap` (Prioritized skill gaps with breakdown)
    - `GET /api/career/skills/prerequisites` (Exportable DAG nodes and directed edges)
    - `POST /api/career/transition/analyze` (Jaccard similarity and bridge guidance)
    - `POST /api/career/salary/evaluate` (Quartile sanity check against empirical/BLS data)
    - `GET /api/career/resources` (Catalog of verified learning resources)
    - `POST /api/career/roadmap/generate` (Adaptive weekly roadmap with milestones)
  - **Interactive Next.js Career Roadmap UI**: Parameter inputs, dynamic salary sanity check alerts, interactive knowledge graph visualizer, weekly expandable timeline with checkable task progress, and client-side PDF export (`jspdf` + `html2canvas`).
- [x] **Phase 5: Production Authentication, User Profiles, Advanced Product Analytics, UX Refinement, Security & Cloud Deployment**
  - **Supabase Authentication**: Integrated Google OAuth and email/password login in [`apps/web/src/context/AuthContext.tsx`](apps/web/src/context/AuthContext.tsx) and server-side JWT Bearer token validation in [`apps/api/app/core/auth.py`](apps/api/app/core/auth.py).
  - **Persistent Relational User Profiles & Progress**: Database tables (`user_profiles`, `user_career_goals`, `user_skill_profiles`, `saved_roadmaps`, `roadmap_progress`, `user_preferences`) supporting personalized career targets, saved learning tracks, and task completion checklists.
  - **Interactive Member Portal**: Dedicated routes for `/login`, `/signup`, `/dashboard`, `/profile`, `/my-roadmaps/[id]`, and `/admin/analytics`.
  - **PostHog & Product Analytics Engine**: Dual tracking via PostHog client SDK and internal `product_analytics_events` table for acquisition, activation, conversion funnels, and feature adoption.
  - **Executive Admin Analytics Dashboard**: Internal metrics view with X-Admin-Key protection displaying user volumes, 4-stage funnel conversion, and top target careers/countries.
  - **Production Security & Scalability**: Zero-trust token authentication, row-level ownership isolation, sanitized telemetry properties, and SQLAlchemy connection pooling.
  - **CI/CD & Cloud Deployment Automation**: Complete GitHub Actions workflow in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) and cloud deployment blueprint in [`render.yaml`](render.yaml) for Render (FastAPI + PostgreSQL) and Vercel (Next.js 15).
- [x] **Phase 6: World-Class UI/UX, Advanced Interactive Visualizations, AI Intelligence & Premium SaaS Experience**
  - **Comprehensive UI/UX Audit & Design System**: Published [`docs/UI_UX_AUDIT.md`](docs/UI_UX_AUDIT.md) and [`docs/architecture/DESIGN_SYSTEM.md`](docs/architecture/DESIGN_SYSTEM.md). Engineered reusable design system components (`Button`, `Card`, `Badge`, `Skeleton`) with WCAG 2.1 AA color contrast and dark-first financial aesthetic (`#080B14`, `#101625`, `#161E30`, `#6366F1`, `#06B6D4`).
  - **Security Remediation**: Hardened `/admin/analytics` by eliminating hardcoded API keys and strictly disabled simulated authentication sandbox fallbacks in production environments (`process.env.NODE_ENV !== 'production'`).
  - **Interactive Career Planner Onboarding Wizard**: Multi-step onboarding experience ([`CareerPlannerWizard.tsx`](apps/web/src/components/career/CareerPlannerWizard.tsx)) guiding users through role selection, geographic salary calibration, interactive skill proficiency tagging, and study pacing.
  - **AI Skill Intelligence & Pedagogical Rationale**: Fast deterministic AI explanation endpoint (`POST /api/career/ai/explain-skill`) and interactive modal ([`AIExplanationModal.tsx`](apps/web/src/components/career/AIExplanationModal.tsx)) synthesizing market importance, sequence rationale, and portfolio capstone guides with 100% reliability and zero paid API key requirements.
  - **Interactive Career Comparison Engine**: Side-by-side role intelligence ([`CareerComparisonView.tsx`](apps/web/src/components/career/CareerComparisonView.tsx)) computing Jaccard competency overlap, transferable skill cores, and empirical observation counts.
  - **Production Build & Verification**: Full Next.js production build succeeded across all 9 application routes with 0 lint/TypeScript errors.

---

## 🔑 External API Configuration (Adzuna & BLS)

To ingest live job postings directly from Adzuna:
1. Register for a free developer account at [Adzuna Developer Portal](https://developer.adzuna.com/).
2. Copy `apps/api/.env.example` to `apps/api/.env`:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
3. Set your credentials:
   ```env
   ADZUNA_APP_ID="your_app_id_here"
   ADZUNA_APP_KEY="your_app_key_here"
   ```
4. If credentials are omitted, CareerGPS uses the verified baseline dataset without fabricating data.

---

## 🧪 Testing

Run all unit and integration tests from project root:
```bash
.\apps\api\.venv\Scripts\pytest.exe -v
```
