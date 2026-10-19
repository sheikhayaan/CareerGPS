-- ============================================================================
-- CareerGPS — Database Schema (PostgreSQL 16)
-- System: Global AI Career Intelligence Platform
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Reference & Taxonomy Tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS career_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    onet_soc_code VARCHAR(16),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    iso_code VARCHAR(2) UNIQUE NOT NULL, -- e.g., US, IN, GB, DE
    name VARCHAR(64) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,  -- USD, INR, GBP, EUR
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    state_province VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_city_country UNIQUE(name, country_id)
);

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(256) NOT NULL,
    normalized_name VARCHAR(256) UNIQUE NOT NULL,
    domain VARCHAR(256),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. Skills Taxonomy & Ontologies
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL, -- Language, Framework, Tool, Concept, Cloud, Database
    esco_uri VARCHAR(512),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skill_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    alias VARCHAR(128) UNIQUE NOT NULL
);

-- Prerequisite dependency directed graph for skills
CREATE TABLE IF NOT EXISTS skill_prerequisites (
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    prerequisite_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    strength VARCHAR(16) DEFAULT 'REQUIRED', -- REQUIRED, RECOMMENDED
    PRIMARY KEY (skill_id, prerequisite_id)
);

-- ----------------------------------------------------------------------------
-- 3. Ingestion & Job Market Postings
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(64) UNIQUE NOT NULL, -- Adzuna, ONet, ESCO, BLS
    api_endpoint VARCHAR(512),
    license_type VARCHAR(128) NOT NULL,
    attribution_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS data_ingestion_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES data_sources(id),
    status VARCHAR(32) NOT NULL, -- PENDING, RUNNING, COMPLETED, FAILED
    records_fetched INT DEFAULT 0,
    records_inserted INT DEFAULT 0,
    records_deduplicated INT DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    error_summary TEXT
);

CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingestion_run_id UUID REFERENCES data_ingestion_runs(id),
    external_id VARCHAR(256),
    source_name VARCHAR(64) NOT NULL,
    fingerprint_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 for conservative deduplication
    career_role_id UUID NOT NULL REFERENCES career_roles(id),
    country_id UUID NOT NULL REFERENCES countries(id),
    city_id UUID REFERENCES cities(id),
    company_id UUID REFERENCES companies(id),
    raw_title VARCHAR(256) NOT NULL,
    posting_date DATE NOT NULL,
    experience_level VARCHAR(32), -- Entry, Mid, Senior, Lead
    min_years_experience NUMERIC(3, 1),
    salary_min NUMERIC(14, 2),
    salary_max NUMERIC(14, 2),
    salary_currency VARCHAR(3),
    salary_period VARCHAR(16), -- YEARLY, MONTHLY, HOURLY
    normalized_annual_salary NUMERIC(14, 2), -- Standardized in local currency
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_skills (
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (job_posting_id, skill_id)
);

-- ----------------------------------------------------------------------------
-- 4. Learning Resources & Roadmaps
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS learning_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    title VARCHAR(256) NOT NULL,
    provider VARCHAR(128) NOT NULL, -- Coursera, edX, Official Docs, Kaggle, MDN
    url TEXT NOT NULL,
    is_free BOOLEAN DEFAULT TRUE,
    resource_type VARCHAR(64) DEFAULT 'DOCUMENTATION', -- COURSE, BOOK, DOCUMENTATION, PROJECT
    estimated_hours NUMERIC(5, 1) DEFAULT 10.0,
    rating NUMERIC(2, 1),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(256) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS career_roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    share_token VARCHAR(64) UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    career_role_id UUID NOT NULL REFERENCES career_roles(id),
    country_id UUID NOT NULL REFERENCES countries(id),
    target_salary NUMERIC(14, 2),
    weekly_hours INT NOT NULL,
    target_weeks INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roadmap_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id UUID NOT NULL REFERENCES career_roadmaps(id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    skill_id UUID REFERENCES skills(id),
    title VARCHAR(256) NOT NULL,
    description TEXT,
    practice_project TEXT,
    learning_resource_id UUID REFERENCES learning_resources(id),
    completed BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- 5. Product Analytics & Telemetry
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(64) NOT NULL,
    distinct_id VARCHAR(128) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Performance Indexes
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_postings_role_country ON job_postings(career_role_id, country_id);
CREATE INDEX IF NOT EXISTS idx_postings_salary ON job_postings(normalized_annual_salary) WHERE normalized_annual_salary IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_postings_date ON job_postings(posting_date);
CREATE INDEX IF NOT EXISTS idx_job_skills_skill ON job_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_product_events_name_time ON product_events(event_name, created_at);
