# Phase 6: UI/UX Audit & Design Systems Review

**Audit Date**: October 2026  
**Auditor**: Principal Product Designer, Staff Frontend Engineer, and Accessibility Specialist  
**Platform**: CareerGPS — Global AI Career Intelligence Platform  

---

## 1. Executive Summary

CareerGPS provides high-value empirical labor market data, an explainable prerequisite DAG graph, and personalized multi-week learning curricula. However, transitioning from a functional prototype to a world-class commercial SaaS platform (competing visually with Linear, Vercel, Stripe, and modern fintech interfaces) requires resolving critical UI/UX, accessibility, and architectural defects.

---

## 2. Page-by-Page Audit & Usability Findings

### 2.1 Landing Page & Career Explorer (`/`)
- **Visual Hierarchy & Weight**: The hero section currently packs parameter controls, overview metric cards, and charts onto a single long view, creating visual fatigue.
- **Onboarding Flow**: Selecting target roles, countries, salary expectations, and skills is presented in a dense, monolithic layout rather than an intuitive multi-step planning experience.
- **Component Consistency**: Dropdowns and inputs lack unified focus rings, consistent hover states, and smooth transition feedback.
- **Performance / Bundle Weight**: The homepage First Load JS is ~285 KB, with heavy ECharts loaded eagerly. Dynamic code-splitting and progressive loading are needed.

### 2.2 Member Authentication Pages (`/login`, `/signup`)
- **Security / Dev Secrets**: A local simulated sandbox was used for rapid verification. In production environments (`NODE_ENV === 'production'`), this fallback must be strictly disabled to prevent spoofed sessions.
- **Accessibility & Focus States**: Missing explicit ARIA labels on social OAuth buttons and form inputs.

### 2.3 Member Portal & Roadmaps (`/dashboard`, `/profile`, `/my-roadmaps/[id]`)
- **Spacing & Visual Polish**: Card layouts need subtle borders (`border-slate-800/80`), refined elevated surfaces (`#161E30`), and elegant micro-animations.
- **Interactive Checklists**: Checking off tasks provides instantaneous optimistic feedback, but lacks subtle milestone completion animations and celebratory feedback for finished weeks.
- **Empty & Loading States**: Need refined skeleton loaders instead of plain text "Loading..." banners.

### 2.4 Internal Product Analytics (`/admin/analytics`)
- **Security Remediation**: Hardcoded placeholder API keys in browser component state must be removed. The admin key should default to an empty string, prompting the user to supply their authorized `X-Admin-Key`.

---

## 3. Prioritized Remediation Plan

| Priority | Area | Action Required |
| :---: | :--- | :--- |
| **P0** | **Security Hardening** | 1. Remove hardcoded admin key from `/admin/analytics`.<br>2. Restrict auth sandbox fallback to local development only (`process.env.NODE_ENV !== 'production'`). |
| **P1** | **Design System** | Build reusable design system components (`Button`, `Card`, `Badge`, `Skeleton`, `Tooltip`, `Select`, `Modal`, `Tabs`) in `@/components/ui/`. |
| **P2** | **Landing Page Redesign** | Implement elegant SaaS landing page with clear typography, feature grid, interactive preview, and animated stats. |
| **P3** | **Interactive Planner Wizard** | Multi-step onboarding experience (Role $\rightarrow$ Location & Salary $\rightarrow$ Skills $\rightarrow$ Roadmap Generation). |
| **P4** | **AI Explanation Layer** | Fast, deterministic/LLM-supported explanation drawer explaining *why* skills and prerequisites are ordered. |
| **P5** | **Career & Country Comparison** | Dedicated interactive side-by-side comparison interface for roles and countries. |
| **P6** | **Performance & A11y** | Dynamic imports for heavy charts, ARIA landmark tagging, keyboard navigation, and bundle reduction. |
