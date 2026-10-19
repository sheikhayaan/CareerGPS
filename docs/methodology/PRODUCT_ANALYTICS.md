# Product Analytics & Event Tracking Specification

## 1. Overview

CareerGPS utilizes a **privacy-conscious product analytics pipeline** integrated via **PostHog** and complemented by internal PostgreSQL persistence (`product_analytics_events`).

This dual architecture enables:
1. Product telemetry for funnels, adoption, and cohort retention.
2. In-house SQL queries and BI dashboards without vendor lock-in.

---

## 2. Event Tracking Taxonomy

| Event Name | Trigger Condition | Allowed Properties | Privacy Classification |
| :--- | :--- | :--- | :--- |
| `page_viewed` | User lands on any route | `path`, `referrer`, `viewport` | Public / Non-sensitive |
| `user_signed_up` | Account creation completed | `provider` (`email`, `google`), `domain` | Pseudonymous |
| `user_logged_in` | Session authenticated | `provider` | Pseudonymous |
| `career_planner_started` | User changes role or country input | `target_role`, `target_country` | Anonymized |
| `roadmap_generated` | Algorithm generates adaptive curriculum | `target_role`, `total_weeks`, `weekly_hours` | Anonymized |
| `roadmap_saved` | Authenticated user saves roadmap to profile | `roadmap_id`, `target_role`, `total_weeks` | Pseudonymous |
| `roadmap_task_completed` | User checks off a practice exercise | `roadmap_id`, `week_number`, `task_id`, `hours_spent` | Pseudonymous |
| `roadmap_downloaded` | User triggers PDF export | `target_role`, `target_country` | Anonymized |
| `profile_updated` | User edits career goal or study hours | `target_career`, `target_country`, `weekly_hours` | Pseudonymous |
| `account_deleted` | User executes permanent account deletion | None | Pseudonymous |

---

## 3. Strict Privacy & Redaction Standard

Under zero circumstances will the following data points be captured in telemetry:
- Passwords or credentials
- Supabase session access tokens or refresh tokens
- Raw salary numbers or personal financial compensation details
- Personally identifiable contact details (phone numbers, physical addresses)

The client sanitizer (`apps/web/src/lib/analytics.ts`) and backend filter (`apps/api/app/core/analytics.py`) enforce explicit property scrubbing prior to telemetry dispatch.
