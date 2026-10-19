-- ============================================================================
-- CareerGPS — Power BI Star Schema Views Layer
-- Target: DirectQuery / Scheduled Refresh in Power BI Desktop & Service
-- Standard: Conformed Dimensions & Narrow Fact Tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DIMENSION VIEWS
-- ----------------------------------------------------------------------------

-- Dimension: DimCareer
DROP VIEW IF EXISTS bi_dim_career;
CREATE VIEW bi_dim_career AS
SELECT 
    id AS career_id,
    slug AS career_slug,
    title AS career_title,
    onet_soc_code,
    description AS career_description
FROM career_roles;

-- Dimension: DimCountry
DROP VIEW IF EXISTS bi_dim_country;
CREATE VIEW bi_dim_country AS
SELECT 
    id AS country_id,
    iso_code AS country_code,
    name AS country_name,
    currency_code
FROM countries;

-- Dimension: DimCompany
DROP VIEW IF EXISTS bi_dim_company;
CREATE VIEW bi_dim_company AS
SELECT 
    id AS company_id,
    name AS company_name,
    normalized_name
FROM companies;

-- Dimension: DimSkill
DROP VIEW IF EXISTS bi_dim_skill;
CREATE VIEW bi_dim_skill AS
SELECT 
    id AS skill_id,
    slug AS skill_slug,
    name AS skill_name,
    category AS skill_category,
    esco_uri
FROM skills;

-- Dimension: DimDataSource
DROP VIEW IF EXISTS bi_dim_data_source;
CREATE VIEW bi_dim_data_source AS
SELECT 
    id AS source_id,
    name AS source_name,
    license_type,
    attribution_text
FROM data_sources;

-- Dimension: DimDate (Calendar generated dynamically from posting bounds)
DROP VIEW IF EXISTS bi_dim_date;
CREATE VIEW bi_dim_date AS
SELECT DISTINCT
    posting_date AS date_key,
    strftime('%Y', posting_date) AS year,
    strftime('%m', posting_date) AS month,
    strftime('%d', posting_date) AS day
FROM job_postings;


-- ----------------------------------------------------------------------------
-- 2. FACT VIEWS
-- ----------------------------------------------------------------------------

-- Fact Table: FactJobPostings
-- Grain: One row per distinct job posting advertisement
DROP VIEW IF EXISTS bi_fact_job_postings;
CREATE VIEW bi_fact_job_postings AS
SELECT 
    id AS posting_id,
    career_role_id AS career_id,
    country_id,
    company_id,
    city_id,
    posting_date AS date_key,
    source_name,
    COALESCE(experience_level, 'Unspecified') AS experience_tier,
    salary_min,
    salary_max,
    normalized_annual_salary,
    CASE WHEN normalized_annual_salary IS NOT NULL THEN 1 ELSE 0 END AS has_salary_disclosure
FROM job_postings;

-- Fact Table: FactJobSkills
-- Grain: One row per skill tag identified in a job posting
DROP VIEW IF EXISTS bi_fact_job_skills;
CREATE VIEW bi_fact_job_skills AS
SELECT 
    jp.id AS posting_id,
    jp.career_role_id AS career_id,
    jp.country_id,
    jp.posting_date AS date_key,
    js.skill_id
FROM job_skills js
JOIN job_postings jp ON js.job_posting_id = jp.id;

-- Fact Table: FactSalaryObservations
-- Grain: One row per verified salary observation event
DROP VIEW IF EXISTS bi_fact_salary_observations;
CREATE VIEW bi_fact_salary_observations AS
SELECT 
    id AS observation_id,
    career_role_id AS career_id,
    country_id,
    raw_amount,
    raw_currency,
    normalized_annual_amount,
    is_outlier
FROM salary_observations;
