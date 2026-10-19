-- ============================================================================
-- CareerGPS — 20 Advanced Analytical SQL Queries
-- Domain: Global Career Intelligence, Wage Disparity, & Skill Co-occurrence
-- Standards: ANSI SQL / SQLite / PostgreSQL Compatible (CTEs, Window Functions)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- QUERY 1: Top Skills Demanded by Career Role
-- Business Question: Which skills appear most frequently for each career role?
-- Analytical Concepts: CTE, Aggregation, DENSE_RANK() Window Function
-- ----------------------------------------------------------------------------
WITH skill_counts AS (
    SELECT 
        cr.slug AS role_slug,
        cr.title AS role_title,
        s.slug AS skill_slug,
        s.name AS skill_name,
        COUNT(js.job_posting_id) AS posting_count,
        COUNT(DISTINCT jp.id) AS total_postings_in_role
    FROM career_roles cr
    JOIN job_postings jp ON cr.id = jp.career_role_id
    JOIN job_skills js ON jp.id = js.job_posting_id
    JOIN skills s ON js.skill_id = s.id
    GROUP BY cr.slug, cr.title, s.slug, s.name
),
ranked_skills AS (
    SELECT 
        role_slug,
        role_title,
        skill_name,
        posting_count,
        DENSE_RANK() OVER (PARTITION BY role_slug ORDER BY posting_count DESC) AS skill_rank
    FROM skill_counts
)
SELECT role_title, skill_name, posting_count, skill_rank
FROM ranked_skills
WHERE skill_rank <= 5
ORDER BY role_title, skill_rank;


-- ----------------------------------------------------------------------------
-- QUERY 2: Cross-National Skill Demand Variance
-- Business Question: How does skill demand percentage vary across target countries?
-- Analytical Concepts: Cross-tab conditional aggregation, percentage calculations
-- ----------------------------------------------------------------------------
WITH country_role_totals AS (
    SELECT 
        career_role_id,
        country_id,
        COUNT(id) AS total_postings
    FROM job_postings
    GROUP BY career_role_id, country_id
)
SELECT 
    cr.title AS role_title,
    s.name AS skill_name,
    c.iso_code AS country_code,
    COUNT(js.job_posting_id) AS observed_postings,
    crt.total_postings AS total_cohort_postings,
    ROUND(CAST(COUNT(js.job_posting_id) AS FLOAT) / crt.total_postings * 100, 1) AS demand_percentage
FROM skills s
JOIN job_skills js ON s.id = js.skill_id
JOIN job_postings jp ON js.job_posting_id = jp.id
JOIN career_roles cr ON jp.career_role_id = cr.id
JOIN countries c ON jp.country_id = c.id
JOIN country_role_totals crt ON crt.career_role_id = cr.id AND crt.country_id = c.id
WHERE cr.slug = 'data-analyst'
GROUP BY cr.title, s.name, c.iso_code, crt.total_postings
ORDER BY s.name, c.iso_code;


-- ----------------------------------------------------------------------------
-- QUERY 3: Roles with Highest Observed Median / Mean Compensation
-- Business Question: Which roles have the highest observed average and median salary in the US?
-- Analytical Concepts: Filtering by country, parametric & non-parametric aggregations
-- ----------------------------------------------------------------------------
SELECT 
    cr.title AS role_title,
    c.currency_code,
    COUNT(jp.id) AS sample_size,
    ROUND(AVG(jp.normalized_annual_salary), 0) AS mean_annual_salary,
    ROUND(MIN(jp.normalized_annual_salary), 0) AS min_annual_salary,
    ROUND(MAX(jp.normalized_annual_salary), 0) AS max_annual_salary
FROM career_roles cr
JOIN job_postings jp ON cr.id = jp.career_role_id
JOIN countries c ON jp.country_id = c.id
WHERE c.iso_code = 'US' AND jp.normalized_annual_salary IS NOT NULL
GROUP BY cr.title, c.currency_code
HAVING COUNT(jp.id) >= 10
ORDER BY mean_annual_salary DESC;


-- ----------------------------------------------------------------------------
-- QUERY 4: Salary Progression Across Experience Tiers
-- Business Question: How do annual salaries vary across Entry, Mid, Senior, and Lead levels?
-- Analytical Concepts: Grouping by categorical level, conditional spread
-- ----------------------------------------------------------------------------
SELECT 
    cr.title AS role_title,
    jp.experience_level,
    COUNT(jp.id) AS posting_count,
    ROUND(AVG(jp.normalized_annual_salary), 2) AS mean_salary,
    ROUND(MAX(jp.normalized_annual_salary) - MIN(jp.normalized_annual_salary), 2) AS salary_spread
FROM job_postings jp
JOIN career_roles cr ON jp.career_role_id = cr.id
JOIN countries c ON jp.country_id = c.id
WHERE c.iso_code = 'US' AND jp.normalized_annual_salary IS NOT NULL
GROUP BY cr.title, jp.experience_level
ORDER BY cr.title, mean_salary ASC;


-- ----------------------------------------------------------------------------
-- QUERY 5: Pairwise Skill Co-occurrence Matrix
-- Business Question: Which pairs of skills are most frequently requested together in job postings?
-- Analytical Concepts: Self-join on job_skills, symmetric deduplication (s1.id < s2.id)
-- ----------------------------------------------------------------------------
SELECT 
    s1.name AS skill_a,
    s2.name AS skill_b,
    COUNT(js1.job_posting_id) AS cooccurrence_count
FROM job_skills js1
JOIN job_skills js2 ON js1.job_posting_id = js2.job_posting_id AND js1.skill_id < js2.skill_id
JOIN skills s1 ON js1.skill_id = s1.id
JOIN skills s2 ON js2.skill_id = s2.id
GROUP BY s1.name, s2.name
ORDER BY cooccurrence_count DESC
LIMIT 15;


-- ----------------------------------------------------------------------------
-- QUERY 6: Salary Disclosure Transparency Index
-- Business Question: What percentage of job advertisements disclose compensation figures?
-- Analytical Concepts: Conditional aggregation using CASE statement
-- ----------------------------------------------------------------------------
SELECT 
    c.name AS country_name,
    COUNT(jp.id) AS total_indexed_jobs,
    SUM(CASE WHEN jp.normalized_annual_salary IS NOT NULL THEN 1 ELSE 0 END) AS jobs_with_salary,
    ROUND(
        CAST(SUM(CASE WHEN jp.normalized_annual_salary IS NOT NULL THEN 1 ELSE 0 END) AS FLOAT) 
        / MAX(COUNT(jp.id), 1) * 100, 2
    ) AS transparency_percentage
FROM countries c
LEFT JOIN job_postings jp ON c.id = jp.country_id
GROUP BY c.name
ORDER BY total_indexed_jobs DESC;


-- ----------------------------------------------------------------------------
-- QUERY 7: Geographic Posting Concentration
-- Business Question: How are observed job opportunities distributed across geographic regions?
-- Analytical Concepts: Percentage of total via Window Function
-- ----------------------------------------------------------------------------
SELECT 
    c.name AS country_name,
    c.iso_code,
    COUNT(jp.id) AS observed_postings,
    ROUND(
        CAST(COUNT(jp.id) AS FLOAT) / SUM(COUNT(jp.id)) OVER () * 100, 2
    ) AS pct_of_global_total
FROM countries c
LEFT JOIN job_postings jp ON c.id = jp.country_id
GROUP BY c.name, c.iso_code
ORDER BY observed_postings DESC;


-- ----------------------------------------------------------------------------
-- QUERY 8: Shared Competency Matrix Between Career Pairs
-- Business Question: Which career pairs share the greatest number of distinct technical skills?
-- Analytical Concepts: Distinct skill intersection counts between roles
-- ----------------------------------------------------------------------------
WITH role_skills_distinct AS (
    SELECT DISTINCT 
        jp.career_role_id,
        js.skill_id
    FROM job_postings jp
    JOIN job_skills js ON jp.id = js.job_posting_id
)
SELECT 
    r1.title AS role_1,
    r2.title AS role_2,
    COUNT(rs1.skill_id) AS shared_skills_count
FROM role_skills_distinct rs1
JOIN role_skills_distinct rs2 ON rs1.skill_id = rs2.skill_id AND rs1.career_role_id < rs2.career_role_id
JOIN career_roles r1 ON rs1.career_role_id = r1.id
JOIN career_roles r2 ON rs2.career_role_id = r2.id
GROUP BY r1.title, r2.title
ORDER BY shared_skills_count DESC;


-- ----------------------------------------------------------------------------
-- QUERY 9: Statistical Sample Sufficiency Audit
-- Business Question: Which role-country pairs have sufficient sample size (N >= 10) for parametric models?
-- Analytical Concepts: Flagging statistical reliability using CASE logic
-- ----------------------------------------------------------------------------
SELECT 
    cr.title AS role_title,
    c.iso_code AS country_code,
    COUNT(jp.id) AS sample_size,
    CASE 
        WHEN COUNT(jp.id) >= 10 THEN 'SUFFICIENT (N >= 10)' 
        ELSE 'SPARSE (N < 10)' 
    END AS statistical_confidence_status
FROM career_roles cr
CROSS JOIN countries c
LEFT JOIN job_postings jp ON cr.id = jp.career_role_id AND c.id = jp.country_id
GROUP BY cr.title, c.iso_code
ORDER BY sample_size DESC;


-- ----------------------------------------------------------------------------
-- QUERY 10: Posting Volume Trajectory & Moving Average
-- Business Question: What is the day-over-day posting volume trajectory with rolling 3-day average?
-- Analytical Concepts: Window function with ROWS BETWEEN frame specification
-- ----------------------------------------------------------------------------
WITH daily_postings AS (
    SELECT 
        posting_date,
        COUNT(id) AS daily_count
    FROM job_postings
    GROUP BY posting_date
)
SELECT 
    posting_date,
    daily_count,
    ROUND(
        AVG(daily_count) OVER (ORDER BY posting_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2
    ) AS rolling_3day_avg
FROM daily_postings
ORDER BY posting_date DESC;


-- ----------------------------------------------------------------------------
-- QUERY 11: Top Hiring Employers by Role
-- Business Question: Which companies have the highest share of job advertisements for software & data roles?
-- Analytical Concepts: Employer aggregation, ranking within market
-- ----------------------------------------------------------------------------
SELECT 
    co.name AS company_name,
    COUNT(jp.id) AS total_postings,
    COUNT(DISTINCT jp.career_role_id) AS distinct_roles_hiring,
    COUNT(DISTINCT jp.country_id) AS countries_active
FROM companies co
JOIN job_postings jp ON co.id = jp.company_id
GROUP BY co.name
ORDER BY total_postings DESC
LIMIT 10;


-- ----------------------------------------------------------------------------
-- QUERY 12: Premium Skill Premium Ratio
-- Business Question: Which skills are associated with the highest average compensation in the US?
-- Analytical Concepts: Joining skills to salary observations, ranking high-ROI skills
-- ----------------------------------------------------------------------------
SELECT 
    s.name AS skill_name,
    s.category AS skill_category,
    COUNT(jp.id) AS postings_requiring_skill,
    ROUND(AVG(jp.normalized_annual_salary), 0) AS avg_annual_salary_usd
FROM skills s
JOIN job_skills js ON s.id = js.skill_id
JOIN job_postings jp ON js.job_posting_id = jp.id
JOIN countries c ON jp.country_id = c.id
WHERE c.iso_code = 'US' AND jp.normalized_annual_salary IS NOT NULL
GROUP BY s.name, s.category
HAVING COUNT(jp.id) >= 5
ORDER BY avg_annual_salary_usd DESC
LIMIT 10;


-- ----------------------------------------------------------------------------
-- QUERY 13: Entry-Level vs Senior Skill Requirement Divergence
-- Business Question: Which skills are disproportionately demanded in Senior vs Entry roles?
-- Analytical Concepts: Conditional counting by experience level, ratio calculation
-- ----------------------------------------------------------------------------
SELECT 
    s.name AS skill_name,
    SUM(CASE WHEN jp.experience_level = 'Entry' THEN 1 ELSE 0 END) AS entry_level_mentions,
    SUM(CASE WHEN jp.experience_level = 'Senior' THEN 1 ELSE 0 END) AS senior_level_mentions,
    ROUND(
        CAST(SUM(CASE WHEN jp.experience_level = 'Senior' THEN 1 ELSE 0 END) AS FLOAT) 
        / MAX(SUM(CASE WHEN jp.experience_level = 'Entry' THEN 1 ELSE 0 END), 1), 2
    ) AS senior_to_entry_ratio
FROM skills s
JOIN job_skills js ON s.id = js.skill_id
JOIN job_postings jp ON js.job_posting_id = jp.id
GROUP BY s.name
HAVING SUM(CASE WHEN jp.experience_level IN ('Entry', 'Senior') THEN 1 ELSE 0 END) >= 5
ORDER BY senior_to_entry_ratio DESC;


-- ----------------------------------------------------------------------------
-- QUERY 14: Skill Redundancy / Centrality Across All Careers
-- Business Question: Which skills are universal prerequisites across multiple careers?
-- Analytical Concepts: Distinct career role counts per skill
-- ----------------------------------------------------------------------------
SELECT 
    s.name AS skill_name,
    s.category AS skill_category,
    COUNT(DISTINCT jp.career_role_id) AS distinct_roles_present,
    COUNT(jp.id) AS total_market_mentions
FROM skills s
JOIN job_skills js ON s.id = js.skill_id
JOIN job_postings jp ON js.job_posting_id = jp.id
GROUP BY s.name, s.category
ORDER BY distinct_roles_present DESC, total_market_mentions DESC;


-- ----------------------------------------------------------------------------
-- QUERY 15: Regional Data Completeness Audit
-- Business Question: What is the completeness score (City, Salary, Company) per country?
-- Analytical Concepts: Multi-column null checks and completeness percentages
-- ----------------------------------------------------------------------------
SELECT 
    c.name AS country_name,
    COUNT(jp.id) AS total_records,
    ROUND(CAST(COUNT(jp.city_id) AS FLOAT) / MAX(COUNT(jp.id), 1) * 100, 1) AS city_completeness_pct,
    ROUND(CAST(COUNT(jp.company_id) AS FLOAT) / MAX(COUNT(jp.id), 1) * 100, 1) AS company_completeness_pct,
    ROUND(CAST(COUNT(jp.normalized_annual_salary) AS FLOAT) / MAX(COUNT(jp.id), 1) * 100, 1) AS salary_completeness_pct
FROM countries c
LEFT JOIN job_postings jp ON c.id = jp.country_id
GROUP BY c.name;


-- ----------------------------------------------------------------------------
-- QUERY 16: Skills Extracted per Job Advertisement Distribution
-- Business Question: What is the average and distribution of skills extracted per job description?
-- Analytical Concepts: Subquery aggregation, distribution density
-- ----------------------------------------------------------------------------
WITH posting_skill_counts AS (
    SELECT 
        job_posting_id,
        COUNT(skill_id) AS skill_count
    FROM job_skills
    GROUP BY job_posting_id
)
SELECT 
    ROUND(AVG(skill_count), 2) AS avg_skills_per_posting,
    MIN(skill_count) AS min_skills_per_posting,
    MAX(skill_count) AS max_skills_per_posting
FROM posting_skill_counts;


-- ----------------------------------------------------------------------------
-- QUERY 17: Market Data Freshness Audit
-- Business Question: What is the age of available postings relative to the latest observation?
-- Analytical Concepts: Date arithmetic, MAX() date anchor
-- ----------------------------------------------------------------------------
WITH latest_anchor AS (
    SELECT MAX(posting_date) AS max_date FROM job_postings
)
SELECT 
    jp.source_name,
    COUNT(jp.id) AS postings_count,
    MIN(jp.posting_date) AS earliest_record,
    MAX(jp.posting_date) AS latest_record
FROM job_postings jp
GROUP BY jp.source_name;


-- ----------------------------------------------------------------------------
-- QUERY 18: Ingestion Source Contribution Breakdown
-- Business Question: Which data ingestion sources contribute the volume of indexed records?
-- Analytical Concepts: Source grouping with percentage of total
-- ----------------------------------------------------------------------------
SELECT 
    source_name,
    COUNT(id) AS total_postings,
    ROUND(CAST(COUNT(id) AS FLOAT) / (SELECT COUNT(*) FROM job_postings) * 100, 2) AS volume_share_pct
FROM job_postings
GROUP BY source_name
ORDER BY total_postings DESC;


-- ----------------------------------------------------------------------------
-- QUERY 19: Missing Experience Level Identification
-- Business Question: How frequently do postings omit explicit experience level indicators?
-- Analytical Concepts: Null checking and categorical validation
-- ----------------------------------------------------------------------------
SELECT 
    COALESCE(experience_level, 'Unspecified') AS experience_tier,
    COUNT(id) AS postings_count,
    ROUND(CAST(COUNT(id) AS FLOAT) / (SELECT COUNT(*) FROM job_postings) * 100, 2) AS share_pct
FROM job_postings
GROUP BY experience_level;


-- ----------------------------------------------------------------------------
-- QUERY 20: Comprehensive Insufficient Evidence Register
-- Business Question: List all 24 Role-Country permutations with their evidence counts to prevent bias.
-- Analytical Concepts: Full permutation cross join with evidence labeling
-- ----------------------------------------------------------------------------
SELECT 
    cr.title AS role_title,
    c.name AS country_name,
    COUNT(jp.id) AS observed_postings,
    CASE 
        WHEN COUNT(jp.id) = 0 THEN 'NO DATA (Unsupported)'
        WHEN COUNT(jp.id) < 10 THEN 'LOW CONFIDENCE (N < 10 - Suppressed from Generalization)'
        ELSE 'RELIABLE EVIDENCE (N >= 10)'
    END AS analytical_recommendation
FROM career_roles cr
CROSS JOIN countries c
LEFT JOIN job_postings jp ON cr.id = jp.career_role_id AND c.id = jp.country_id
GROUP BY cr.title, c.name
ORDER BY observed_postings ASC, cr.title;
