# Comprehensive Product Usability & Journey Audit: CareerGPS

**Date:** October 2026  
**Auditor Team:** Principal UI/UX Designer, Senior Product Designer, Staff Next.js Engineer, AI Recommendation Quality Specialist  
**Evaluation Scope:** Complete user onboarding flow, Career Planner Wizard, Analysis Results presentation, Market Intelligence dashboards, Mobile/Desktop responsiveness.

---

## 1. Executive Usability Assessment

CareerGPS possesses rich underlying intelligence: a 27-skill topological knowledge graph, empirical salary quartile matching from 227 verified job postings across 4 countries, transition similarity computations, and multi-week adaptive roadmaps. 

However, an in-depth audit of the current application reveals severe usability, information architecture, and cognitive load defects that prevent users (particularly students and early-career switchers) from experiencing it as a cohesive, world-class SaaS platform.

---

## 2. Detailed Root-Cause Analysis (The 10 Core Usability Failures)

### Failure 1: The Monolithic 800-Line Single-Page Trap
* **Current State:** The entire user journey—career parameter input, metric cards, knowledge graph visualization, weekly study timeline, analytics charts, and career comparison—was concentrated in a single client component (`apps/web/src/app/page.tsx`).
* **Impact:** The user suffers immediate cognitive overload upon landing. When navigating tabs, page scroll position jumps jarringly. First Load JS reaches 287 kB with ECharts loaded eagerly.
* **Remediation:** Disentangle into clean dedicated routes:
  1. `/` (Modern conversion-focused SaaS homepage with interactive preview)
  2. `/planner` (6-step guided wizard for generating plans)
  3. `/explore` (Interactive market salary & skill demand explorer)
  4. `/my-roadmaps` & `/my-roadmaps/[id]` (Personalized roadmap view)
  5. `/dashboard` (Saved roadmaps, task completion tracking, profile metrics)

### Failure 2: Monolithic Parameter Inputs vs Conversational Planning
* **Current State:** The parameter input was a dense 4-column card packed with dropdowns (Target Career, Location, Experience, Baseline Role, Target Salary, Study Budget, Timeline).
* **Impact:** A beginner student has no idea whether \$85,000 is realistic, how many hours they should commit, or what intermediate proficiency in SQL means.
* **Remediation:** Implement an intuitive 6-step conversational wizard:
  - Step 1: Target Career Goal
  - Step 2: Current Background & Baseline Role
  - Step 3: Geographic Market (US, UK, CA, IN)
  - Step 4: Existing Skills & Real-World Self-Assessment
  - Step 5: Target Salary Expectation with empirical real-time guidance
  - Step 6: Available Learning Time & Target Horizon

### Failure 3: Confusing Analysis Results without Clear Visual Hierarchy
* **Current State:** Results were dumped in arbitrary cards with technical jargon ("Jaccard Similarity", "Topological Prerequisite DAG", "Descriptive Statistics N=28").
* **Impact:** Students don't know what to look at first or what decisions to make.
* **Remediation:** Restructure results into **5 clearly distinct sections**:
  - **Section 1: Career Snapshot** (Target role, empirical median salary, difficulty rating, estimated transition time in plain English)
  - **Section 2: Target Salary Reality Check** (Your target vs real market percentiles P25/Median/P75 with actionable feedback)
  - **Section 3: Skill Gaps** (What you already have vs what employers ask for most, tagged by priority)
  - **Section 4: Personalized Roadmap** (Month-by-month and week-by-week curriculum with objectives, curated free resources, exercises, and GitHub project deliverables)
  - **Section 5: Market Evidence & Data Transparency** (Sample size, data freshness, employer demand frequency)

### Failure 4: Generic Weekly Task Descriptions (The "WHAT / WHY / HOW" Gap)
* **Current State:** Tasks often displayed generic text: *"Understand core theoretical concepts of Python"*, *"Implement hands-on coding exercises"*.
* **Impact:** Students ask: *Why should I learn this first? How do I actually learn it? What exact project proves I know it?*
* **Remediation:** Upgrade `roadmap_generator.py` and the frontend card renderers to explicitly supply:
  - **WHAT:** Skill name and core technical topics.
  - **WHY:** Empirical demand percentage & role dependency rationale.
  - **HOW:** Verified learning resources (Coursera, Official Docs, FreeCodeCamp) with estimated hours.
  - **HOW LONG:** Realistic estimated hours based on student's self-assessed baseline.
  - **VERIFICATION:** Concrete completion criteria and hands-on portfolio milestones.

### Failure 5: Academic Data Visualizations without Explanations
* **Current State:** Raw boxplots and co-occurrence graphs without contextual explanation.
* **Impact:** Visual fatigue and confusion.
* **Remediation:** Replace complex multi-axis plots with clean, intuitive visual indicators:
  - Percentile salary ladder with highlighted target marker.
  - Ranked skill bar charts showing percentage of job postings requesting each skill.
  - Transferable skill overlap chips with color-coded confidence levels.

### Failure 6: Disconnected User Journey & Inconsistent Navigation
* **Current State:** The header only had tabs for `Roadmap`, `Market Intelligence`, `Compare`, and an unclear `Portal` link.
* **Remediation:** Standardize top navigation across all pages:
  - **Home** (`/`)
  - **Explore Careers** (`/explore`)
  - **Career Planner** (`/planner`)
  - **My Roadmaps** (`/my-roadmaps`)
  - **Dashboard** (`/dashboard`)
  - User avatar / Sign In button with quick authentication state.

### Failure 7: Lack of Actionability & Clear Next Steps
* **Current State:** After viewing a roadmap, the user wasn't prompted to save it to their profile or start week 1.
* **Remediation:** Prominent "Save to My Profile", "Export PDF Report", and "Start Week 1" primary action buttons.

---

## 3. Step-by-Step Implementation Roadmap

1. **Information Architecture & Shared Navigation:** Create `@/components/layout/Navbar.tsx` and `@/components/layout/Footer.tsx`.
2. **6-Step Conversational Career Wizard:** Upgrade `CareerPlannerWizard.tsx` with friendly guidance, salary hints, and clean progress steps.
3. **Structured 5-Section Results Component:** Build `@/components/career/StructuredCareerResults.tsx` containing the 5 required sections.
4. **Enhanced Recommendation Engine:** Update `ml/recommendations/roadmap_generator.py` to produce high-value actionable descriptions, answering WHAT, WHY, HOW, and DELIVERABLES.
5. **Route Decomposition:**
   - Redesign `/` as a Linear/Stripe-grade landing page with hero headline *"Your Dream Career Starts With a Smarter Plan."*
   - Redesign `/planner` for focused plan generation.
   - Redesign `/explore` for market intelligence and role comparison.
   - Connect roadmap saving seamlessly to `/dashboard` and `/my-roadmaps/[id]`.
6. **Verification & Testing:** Verify all 52 backend tests pass and Next.js builds cleanly with 0 TypeScript/lint warnings.
