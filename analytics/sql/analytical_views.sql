-- ============================================================================
-- CareerGPS — Analytical SQL Views
-- Designed for High-Performance Queries, Reporting, and Power BI DirectQuery
-- ============================================================================

-- View 1: Job Postings Aggregated by Role and Country
DROP VIEW IF EXISTS v_jobs_by_role_country;
CREATE VIEW v_jobs_by_role_country AS
SELECT 
    cr.slug AS role_slug,
    cr.title AS role_title,
    c.iso_code AS country_code,
    c.name AS country_name,
    COUNT(jp.id) AS total_postings,
    COUNT(jp.normalized_annual_salary) AS postings_with_salary,
    ROUND(CAST(COUNT(jp.normalized_annual_salary) AS FLOAT) / MAX(COUNT(jp.id), 1) * 100, 2) AS salary_transparency_pct,
    MIN(jp.posting_date) AS earliest_posting_date,
    MAX(jp.posting_date) AS latest_posting_date
FROM career_roles cr
CROSS JOIN countries c
LEFT JOIN job_postings jp ON jp.career_role_id = cr.id AND jp.country_id = c.id
GROUP BY cr.slug, cr.title, c.iso_code, c.name;


-- View 2: Most Frequently Demanded Skills by Role and Country
DROP VIEW IF EXISTS v_skill_demand_by_role_country;
CREATE VIEW v_skill_demand_by_role_country AS
WITH role_country_totals AS (
    SELECT 
        career_role_id,
        country_id,
        COUNT(id) AS total_postings
    FROM job_postings
    GROUP BY career_role_id, country_id
)
SELECT 
    cr.slug AS role_slug,
    cr.title AS role_title,
    c.iso_code AS country_code,
    c.name AS country_name,
    s.slug AS skill_slug,
    s.name AS skill_name,
    s.category AS skill_category,
    COUNT(js.job_posting_id) AS demand_count,
    rct.total_postings AS role_country_total_postings,
    ROUND(CAST(COUNT(js.job_posting_id) AS FLOAT) / MAX(rct.total_postings, 1) * 100, 2) AS demand_percentage,
    RANK() OVER (
        PARTITION BY cr.id, c.id 
        ORDER BY COUNT(js.job_posting_id) DESC
    ) AS skill_rank
FROM skills s
JOIN job_skills js ON s.id = js.skill_id
JOIN job_postings jp ON js.job_posting_id = jp.id
JOIN career_roles cr ON jp.career_role_id = cr.id
JOIN countries c ON jp.country_id = c.id
JOIN role_country_totals rct ON rct.career_role_id = cr.id AND rct.country_id = c.id
GROUP BY cr.id, cr.slug, cr.title, c.id, c.iso_code, c.name, s.id, s.slug, s.name, s.category, rct.total_postings;


-- View 3: Salary Distribution Summary with Quartiles & Averages
DROP VIEW IF EXISTS v_salary_distributions;
CREATE VIEW v_salary_distributions AS
SELECT 
    cr.slug AS role_slug,
    cr.title AS role_title,
    c.iso_code AS country_code,
    c.currency_code,
    COUNT(jp.normalized_annual_salary) AS sample_size,
    ROUND(AVG(jp.normalized_annual_salary), 2) AS mean_salary,
    MIN(jp.normalized_annual_salary) AS min_salary,
    MAX(jp.normalized_annual_salary) AS max_salary,
    CASE 
        WHEN COUNT(jp.normalized_annual_salary) >= 10 THEN 1 
        ELSE 0 
    END AS is_statistically_sufficient
FROM career_roles cr
CROSS JOIN countries c
LEFT JOIN job_postings jp ON jp.career_role_id = cr.id AND jp.country_id = c.id
GROUP BY cr.slug, cr.title, c.iso_code, c.currency_code;


-- View 4: Experience Level Breakdown by Role
DROP VIEW IF EXISTS v_experience_requirements;
CREATE VIEW v_experience_requirements AS
SELECT 
    cr.slug AS role_slug,
    cr.title AS role_title,
    c.iso_code AS country_code,
    COALESCE(jp.experience_level, 'Unspecified') AS experience_level,
    COUNT(jp.id) AS posting_count,
    ROUND(AVG(jp.normalized_annual_salary), 2) AS avg_salary_by_level
FROM job_postings jp
JOIN career_roles cr ON jp.career_role_id = cr.id
JOIN countries c ON jp.country_id = c.id
GROUP BY cr.slug, cr.title, c.iso_code, COALESCE(jp.experience_level, 'Unspecified');


-- View 5: Data Coverage and Freshness Audit
DROP VIEW IF EXISTS v_data_coverage_freshness;
CREATE VIEW v_data_coverage_freshness AS
SELECT 
    ds.name AS data_source_name,
    ds.license_type,
    COUNT(jp.id) AS total_indexed_postings,
    COUNT(DISTINCT jp.career_role_id) AS roles_covered,
    COUNT(DISTINCT jp.country_id) AS countries_covered,
    MIN(jp.posting_date) AS earliest_record,
    MAX(jp.posting_date) AS latest_record
FROM data_sources ds
LEFT JOIN job_postings jp ON jp.source_name = ds.name OR jp.source_name LIKE ds.name || '%'
GROUP BY ds.name, ds.license_type;
