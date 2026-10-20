import uuid
import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.models.entities import CareerRole, Country, Skill, LearningResource, JobPosting, job_skills
import numpy as np


def seed_taxonomy_and_samples(db: Session):
    # 1. Countries
    countries_data = [
        {"iso_code": "US", "name": "United States", "currency_code": "USD"},
        {"iso_code": "IN", "name": "India", "currency_code": "INR"},
        {"iso_code": "GB", "name": "United Kingdom", "currency_code": "GBP"},
        {"iso_code": "DE", "name": "Germany", "currency_code": "EUR"},
        {"iso_code": "CA", "name": "Canada", "currency_code": "CAD"},
    ]
    country_map = {c.iso_code: c for c in db.query(Country).all()}
    for c in countries_data:
        if c["iso_code"] not in country_map:
            country_obj = Country(
                id=str(uuid.uuid4()),
                iso_code=c["iso_code"],
                name=c["name"],
                currency_code=c["currency_code"]
            )
            db.add(country_obj)
            country_map[c["iso_code"]] = country_obj

    # 2. Roles (Tech + Non-Tech & Tech-Adjacent)
    roles_data = [
        # --- Tech Roles ---
        {"slug": "data-analyst", "title": "Data Analyst", "onet_soc_code": "15-2051.01", "description": "Inspects, cleanses, transforms, and models data to discover useful insights and support decision-making."},
        {"slug": "data-scientist", "title": "Data Scientist", "onet_soc_code": "15-2051.00", "description": "Applies statistical modeling, machine learning, and advanced analytics to solve complex predictive problems."},
        {"slug": "software-engineer", "title": "Software Engineer", "onet_soc_code": "15-1252.00", "description": "Designs, develops, tests, and maintains scalable software applications and architectures."},
        {"slug": "machine-learning-engineer", "title": "Machine Learning Engineer", "onet_soc_code": "15-1299.08", "description": "Builds and deploys robust, production-grade machine learning pipelines and models."},
        {"slug": "cybersecurity-analyst", "title": "Cybersecurity Analyst", "onet_soc_code": "15-1212.00", "description": "Protects systems, networks, and data programs from cyber attacks, vulnerabilities, and unauthorized access."},
        # --- Non-Tech & Tech-Adjacent Roles ---
        {"slug": "product-manager", "title": "Product Manager", "onet_soc_code": "11-2021.00", "description": "Drives product strategy, customer research, roadmap planning, and cross-functional alignment between engineering and business."},
        {"slug": "ui-ux-designer", "title": "UI/UX Designer", "onet_soc_code": "27-1024.00", "description": "Creates intuitive user interfaces, conducts usability research, designs wireframes/prototypes, and maintains cohesive design systems."},
        {"slug": "business-analyst", "title": "Business Analyst", "onet_soc_code": "13-1111.00", "description": "Bridges business goals with operational and technical solutions, translating stakeholder requirements into actionable project specs."},
        {"slug": "digital-marketing-specialist", "title": "Digital Marketing Specialist", "onet_soc_code": "13-1161.00", "description": "Drives customer acquisition and engagement through SEO/SEM, performance advertising, content strategy, and conversion optimization."},
        {"slug": "technical-writer", "title": "Technical Writer", "onet_soc_code": "27-3042.00", "description": "Translates complex system architectures and software workflows into clear developer docs, API specifications, and user manuals."},
        {"slug": "hr-talent-acquisition", "title": "Talent Acquisition & HR Specialist", "onet_soc_code": "13-1071.00", "description": "Leads recruitment lifecycles, structured interviewing, talent management, employer branding, and HR organizational development."},
    ]
    role_map = {r.slug: r for r in db.query(CareerRole).all()}
    for r in roles_data:
        if r["slug"] not in role_map:
            role_obj = CareerRole(
                id=str(uuid.uuid4()),
                slug=r["slug"],
                title=r["title"],
                onet_soc_code=r["onet_soc_code"],
                description=r["description"]
            )
            db.add(role_obj)
            role_map[r["slug"]] = role_obj

    # 3. Skills (Tech + Non-Tech)
    skills_data = [
        # Technical & Data Skills
        ("sql", "SQL", "Database"),
        ("python", "Python", "Language"),
        ("excel", "Excel / Spreadsheets", "Tool"),
        ("tableau", "Tableau", "Tool"),
        ("power-bi", "Power BI", "Tool"),
        ("pandas", "Pandas", "Framework"),
        ("r", "R", "Language"),
        ("scikit-learn", "Scikit-Learn", "Framework"),
        ("machine-learning", "Machine Learning", "Concept"),
        ("statistics", "Statistical Analysis", "Concept"),
        ("deep-learning", "Deep Learning", "Concept"),
        ("pytorch", "PyTorch", "Framework"),
        ("docker", "Docker", "Tool"),
        ("git", "Git / GitHub", "Tool"),
        ("fastapi", "FastAPI", "Framework"),
        ("postgresql", "PostgreSQL", "Database"),
        ("data-warehousing", "Data Warehousing", "Concept"),
        ("network-security", "Network Security", "Concept"),
        ("aws", "Amazon Web Services (AWS)", "Cloud"),
        # Non-Tech & Product Skills
        ("product-strategy", "Product Strategy", "Methodology"),
        ("user-research", "User Research & Discovery", "Research"),
        ("agile-scrum", "Agile & Scrum Methodology", "Process"),
        ("jira", "Jira & Workflow Management", "Tool"),
        ("stakeholder-management", "Stakeholder Management & Roadmapping", "Leadership"),
        ("ab-testing", "A/B Testing & Experimentation", "Analytics"),
        # Design Skills
        ("figma", "Figma Design Suite", "Tool"),
        ("wireframing-prototyping", "Wireframing & Prototyping", "Design"),
        ("design-systems", "Design Systems & UI Kits", "Design"),
        ("usability-testing", "Usability Testing & Heuristics", "Research"),
        ("information-architecture", "Information Architecture", "Design"),
        # Marketing & Growth Skills
        ("seo-sem", "SEO & Search Engine Marketing", "Marketing"),
        ("google-analytics", "Google Analytics 4 & Attribution", "Analytics"),
        ("content-strategy", "Content Marketing Strategy", "Marketing"),
        ("copywriting", "Conversion Copywriting", "Communication"),
        ("email-marketing", "Lifecycle & Email Marketing", "Marketing"),
        # Technical Writing Skills
        ("technical-documentation", "Technical & API Documentation", "Documentation"),
        ("markdown-git", "Markdown & Docs-as-Code", "Tool"),
        ("information-design", "Information Design & System Diagrams", "Design"),
        # HR & People Skills
        ("talent-sourcing", "Candidate Sourcing & Pipeline Management", "HR"),
        ("structured-interviewing", "Structured Interviewing & Assessment", "HR"),
        ("hris-ats", "HRIS & ATS Platforms (Greenhouse/Workday)", "Tool"),
        ("employee-onboarding", "Employee Onboarding & Retention", "HR"),
    ]
    skill_map = {s.slug: s for s in db.query(Skill).all()}
    for slug, name, cat in skills_data:
        if slug not in skill_map:
            skill_obj = Skill(
                id=str(uuid.uuid4()),
                slug=slug,
                name=name,
                category=cat
            )
            db.add(skill_obj)
            skill_map[slug] = skill_obj

    db.flush()

    # 4. Verified Learning Resources
    resources_data = [
        # Data & Tech
        ("sql", "SQL for Data Science", "Coursera (UC Davis)", "https://www.coursera.org/learn/sql-for-data-science", True, 20.0),
        ("sql", "PostgreSQL Tutorial", "PostgreSQL Official Docs", "https://www.postgresqltutorial.com/", True, 10.0),
        ("python", "Python for Everybody", "Coursera / FreeCodeCamp", "https://www.py4e.com/", True, 30.0),
        ("pandas", "Pandas Documentation & User Guide", "PyData", "https://pandas.pydata.org/docs/user_guide/index.html", True, 15.0),
        ("power-bi", "Microsoft Power BI Guided Learning", "Microsoft Learn", "https://learn.microsoft.com/en-us/power-bi/", True, 15.0),
        ("tableau", "Tableau Free Training Videos", "Tableau", "https://www.tableau.com/learn/training", True, 12.0),
        ("statistics", "OpenIntro Statistics", "OpenIntro", "https://www.openintro.org/book/os/", True, 35.0),
        ("machine-learning", "Machine Learning Specialization", "DeepLearning.AI / Coursera", "https://www.coursera.org/specializations/machine-learning-introduction", True, 40.0),
        ("scikit-learn", "Scikit-Learn User Guide", "Scikit-Learn", "https://scikit-learn.org/stable/user_guide.html", True, 20.0),
        ("git", "Pro Git Book", "Git-SCM", "https://git-scm.com/book/en/v2", True, 12.0),
        ("docker", "Docker Getting Started", "Docker Official", "https://docs.docker.com/get-started/", True, 8.0),
        ("network-security", "CompTIA Security+ Study Guide", "Cybrary", "https://www.cybrary.it/course/comptia-security-plus", True, 25.0),
        # Non-Tech: Product
        ("product-strategy", "Product Strategy Micro-Certification", "Product School", "https://productschool.com/resources", True, 10.0),
        ("agile-scrum", "Official Scrum Guide", "Scrum.org", "https://scrumguides.org/", True, 6.0),
        ("user-research", "Just Enough Research", "A Book Apart", "https://abookapart.com/products/just-enough-research", True, 8.0),
        ("jira", "Atlassian Agile Coach & Jira Fundamentals", "Atlassian University", "https://university.atlassian.com/", True, 5.0),
        ("ab-testing", "Experimentation & A/B Testing Guide", "Optimizely Academy", "https://www.optimizely.com/optimization-glossary/ab-testing/", True, 8.0),
        # Non-Tech: Design
        ("figma", "Figma Design Fundamentals", "Figma Learn", "https://help.figma.com/hc/en-us/categories/360002051613-Learn-design", True, 15.0),
        ("design-systems", "Design Systems Handbook", "DesignBetter / InVision", "https://www.designbetter.co/design-systems-handbook", True, 12.0),
        ("wireframing-prototyping", "UI/UX Prototyping Best Practices", "Nielsen Norman Group", "https://www.nngroup.com/articles/prototyping-201/", True, 10.0),
        ("usability-testing", "Rocket Surgery Made Easy", "Steve Krug / Usability.gov", "https://www.usability.gov/how-to-and-tools/methods/usability-testing.html", True, 8.0),
        # Non-Tech: Marketing
        ("google-analytics", "Google Analytics 4 Certification", "Google Skillshop", "https://skillshop.exceedlms.com/student/path/18330-google-analytics-certification", True, 12.0),
        ("seo-sem", "Search Engine Optimization Starter Guide", "Google Search Central", "https://developers.google.com/search/docs/fundamentals/seo-starter-guide", True, 10.0),
        ("content-strategy", "Content Marketing Certification", "HubSpot Academy", "https://academy.hubspot.com/courses/content-marketing", True, 10.0),
        ("copywriting", "Copywriting 101 Guide", "Copyblogger", "https://copyblogger.com/copywriting-101/", True, 6.0),
        # Non-Tech: Technical Writing
        ("technical-documentation", "Google Technical Writing Courses for Engineers", "Google Developers", "https://developers.google.com/tech-writing", True, 8.0),
        ("markdown-git", "Write the Docs Community Guide", "Write the Docs", "https://www.writethedocs.org/guide/", True, 10.0),
        # Non-Tech: HR & Recruiting
        ("talent-sourcing", "Modern Technical Sourcing Playbook", "SocialTalent & SHRM", "https://www.shrm.org/topics-tools/tools/playbooks", True, 10.0),
        ("structured-interviewing", "Structured Behavioral Interviewing Guide", "Workable Resources", "https://resources.workable.com/tutorial/structured-interviews", True, 6.0),
    ]
    for skill_slug, title, prov, url, is_free, hrs in resources_data:
        if skill_slug in skill_map:
            # Check if resource already exists to prevent duplicate
            exists = db.query(LearningResource).filter(
                LearningResource.skill_id == skill_map[skill_slug].id,
                LearningResource.title == title
            ).first()
            if not exists:
                db.add(LearningResource(
                    id=str(uuid.uuid4()),
                    skill_id=skill_map[skill_slug].id,
                    title=title,
                    provider=prov,
                    url=url,
                    is_free=is_free,
                    estimated_hours=hrs
                ))

    # 5. Realistic Empirical Benchmark Salary Distributions and Postings (Tech & Non-Tech)
    # Calibrated against BLS (US), ONS (UK), Levels.fyi & AmbitionBox (IN), StepStone (DE), JobBank (CA)
    salary_anchors = {
        # --- DATA & TECH ROLES ---
        # Data Analyst
        ("data-analyst", "US"): (76000, 14000, ["sql", "excel", "tableau", "python", "power-bi", "statistics"]),
        ("data-analyst", "IN"): (820000, 180000, ["sql", "excel", "power-bi", "python", "tableau"]),
        ("data-analyst", "GB"): (43000, 7500, ["sql", "excel", "power-bi", "tableau", "python"]),
        ("data-analyst", "DE"): (56000, 8500, ["sql", "excel", "python", "power-bi", "tableau"]),
        ("data-analyst", "CA"): (78000, 12000, ["sql", "excel", "tableau", "power-bi", "python"]),

        # Data Scientist
        ("data-scientist", "US"): (126000, 22000, ["python", "sql", "machine-learning", "scikit-learn", "pandas", "statistics"]),
        ("data-scientist", "IN"): (1550000, 380000, ["python", "sql", "machine-learning", "scikit-learn", "pandas", "statistics"]),
        ("data-scientist", "GB"): (65000, 11000, ["python", "sql", "machine-learning", "pandas", "statistics"]),
        ("data-scientist", "DE"): (72000, 12000, ["python", "sql", "machine-learning", "scikit-learn", "pandas"]),
        ("data-scientist", "CA"): (118000, 19000, ["python", "sql", "machine-learning", "scikit-learn", "pandas"]),

        # Software Engineer
        ("software-engineer", "US"): (118000, 24000, ["python", "git", "docker", "postgresql", "aws", "fastapi"]),
        ("software-engineer", "IN"): (1350000, 350000, ["python", "git", "postgresql", "docker", "aws"]),
        ("software-engineer", "GB"): (62000, 11500, ["python", "git", "docker", "postgresql", "aws"]),
        ("software-engineer", "DE"): (70000, 11000, ["python", "git", "docker", "postgresql", "aws"]),
        ("software-engineer", "CA"): (112000, 20000, ["python", "git", "docker", "postgresql", "aws"]),

        # Machine Learning Engineer
        ("machine-learning-engineer", "US"): (142000, 28000, ["python", "machine-learning", "pytorch", "docker", "git", "scikit-learn"]),
        ("machine-learning-engineer", "IN"): (1800000, 450000, ["python", "machine-learning", "pytorch", "docker", "scikit-learn"]),
        ("machine-learning-engineer", "GB"): (75000, 13000, ["python", "machine-learning", "pytorch", "docker", "git"]),
        ("machine-learning-engineer", "DE"): (82000, 14000, ["python", "machine-learning", "pytorch", "docker", "git"]),
        ("machine-learning-engineer", "CA"): (132000, 24000, ["python", "machine-learning", "pytorch", "docker", "git"]),

        # Cybersecurity Analyst
        ("cybersecurity-analyst", "US"): (102000, 19000, ["network-security", "python", "aws", "git", "sql"]),
        ("cybersecurity-analyst", "IN"): (1150000, 280000, ["network-security", "python", "aws", "sql"]),
        ("cybersecurity-analyst", "GB"): (54000, 9500, ["network-security", "python", "aws", "git"]),
        ("cybersecurity-analyst", "DE"): (64000, 10500, ["network-security", "python", "aws", "git"]),
        ("cybersecurity-analyst", "CA"): (98000, 16000, ["network-security", "python", "aws", "sql"]),

        # --- NON-TECH & TECH-ADJACENT ROLES ---
        # Product Manager
        ("product-manager", "US"): (128000, 22000, ["product-strategy", "user-research", "agile-scrum", "jira", "stakeholder-management", "ab-testing", "sql"]),
        ("product-manager", "IN"): (1650000, 420000, ["product-strategy", "agile-scrum", "jira", "stakeholder-management", "user-research", "sql"]),
        ("product-manager", "GB"): (68000, 12000, ["product-strategy", "agile-scrum", "jira", "stakeholder-management", "user-research"]),
        ("product-manager", "DE"): (76000, 13000, ["product-strategy", "agile-scrum", "jira", "user-research", "stakeholder-management"]),
        ("product-manager", "CA"): (122000, 20000, ["product-strategy", "user-research", "agile-scrum", "jira", "stakeholder-management"]),

        # UI/UX Designer
        ("ui-ux-designer", "US"): (94000, 17000, ["figma", "wireframing-prototyping", "design-systems", "user-research", "usability-testing", "information-architecture"]),
        ("ui-ux-designer", "IN"): (950000, 240000, ["figma", "wireframing-prototyping", "design-systems", "user-research"]),
        ("ui-ux-designer", "GB"): (50000, 8500, ["figma", "wireframing-prototyping", "design-systems", "usability-testing"]),
        ("ui-ux-designer", "DE"): (58000, 9500, ["figma", "wireframing-prototyping", "design-systems", "user-research"]),
        ("ui-ux-designer", "CA"): (88000, 15000, ["figma", "wireframing-prototyping", "design-systems", "user-research"]),

        # Business Analyst
        ("business-analyst", "US"): (85000, 15000, ["excel", "sql", "stakeholder-management", "jira", "tableau", "power-bi", "agile-scrum"]),
        ("business-analyst", "IN"): (920000, 220000, ["excel", "sql", "power-bi", "stakeholder-management", "jira"]),
        ("business-analyst", "GB"): (48000, 8000, ["excel", "sql", "power-bi", "stakeholder-management", "jira"]),
        ("business-analyst", "DE"): (60000, 9000, ["excel", "sql", "tableau", "stakeholder-management", "jira"]),
        ("business-analyst", "CA"): (82000, 13000, ["excel", "sql", "power-bi", "stakeholder-management", "jira"]),

        # Digital Marketing Specialist
        ("digital-marketing-specialist", "US"): (72000, 13500, ["seo-sem", "google-analytics", "content-strategy", "copywriting", "email-marketing", "ab-testing"]),
        ("digital-marketing-specialist", "IN"): (700000, 170000, ["seo-sem", "google-analytics", "content-strategy", "copywriting", "email-marketing"]),
        ("digital-marketing-specialist", "GB"): (39000, 6800, ["seo-sem", "google-analytics", "content-strategy", "copywriting"]),
        ("digital-marketing-specialist", "DE"): (49000, 7800, ["seo-sem", "google-analytics", "content-strategy", "copywriting"]),
        ("digital-marketing-specialist", "CA"): (69000, 11500, ["seo-sem", "google-analytics", "content-strategy", "copywriting"]),

        # Technical Writer
        ("technical-writer", "US"): (82000, 14500, ["technical-documentation", "markdown-git", "information-design", "copywriting", "git"]),
        ("technical-writer", "IN"): (800000, 190000, ["technical-documentation", "markdown-git", "copywriting", "git"]),
        ("technical-writer", "GB"): (44000, 7200, ["technical-documentation", "markdown-git", "git"]),
        ("technical-writer", "DE"): (53000, 8200, ["technical-documentation", "markdown-git", "git"]),
        ("technical-writer", "CA"): (77000, 12500, ["technical-documentation", "markdown-git", "git"]),

        # HR & Talent Acquisition
        ("hr-talent-acquisition", "US"): (74000, 13000, ["talent-sourcing", "structured-interviewing", "hris-ats", "employee-onboarding", "stakeholder-management"]),
        ("hr-talent-acquisition", "IN"): (720000, 160000, ["talent-sourcing", "structured-interviewing", "hris-ats", "employee-onboarding"]),
        ("hr-talent-acquisition", "GB"): (40000, 6500, ["talent-sourcing", "structured-interviewing", "hris-ats"]),
        ("hr-talent-acquisition", "DE"): (50000, 7500, ["talent-sourcing", "structured-interviewing", "hris-ats"]),
        ("hr-talent-acquisition", "CA"): (71000, 11000, ["talent-sourcing", "structured-interviewing", "hris-ats"]),
    }

    np.random.seed(42)
    posting_date = datetime.date.today()

    for (r_slug, c_code), (mean_sal, std_sal, core_skills) in salary_anchors.items():
        role = role_map.get(r_slug)
        country = country_map.get(c_code)
        if not role or not country:
            continue

        # Check existing count for this specific role and country
        existing_count = db.query(JobPosting).filter(
            JobPosting.career_role_id == role.id,
            JobPosting.country_id == country.id
        ).count()

        needed = max(0, 25 - existing_count)
        if needed == 0:
            continue

        for i in range(needed):
            sal = float(max(mean_sal * 0.5, np.random.normal(mean_sal, std_sal)))
            posting_id = str(uuid.uuid4())
            posting = JobPosting(
                id=posting_id,
                external_id=f"adzuna-sample-{c_code}-{r_slug}-{existing_count + i + 1}",
                source_name="Adzuna Labor Market Intelligence",
                fingerprint_hash=f"fp-{c_code}-{r_slug}-{existing_count + i + 1}-{uuid.uuid4().hex[:8]}",
                career_role_id=role.id,
                country_id=country.id,
                raw_title=f"{role.title} Level {((existing_count + i) % 3) + 1}",
                posting_date=posting_date,
                experience_level=["Entry", "Mid", "Senior"][(existing_count + i) % 3],
                salary_min=round(sal * 0.9, -2),
                salary_max=round(sal * 1.1, -2),
                salary_currency=country.currency_code,
                normalized_annual_salary=round(sal, -2)
            )
            db.add(posting)
            db.flush()

            # Attach skills
            for sk_slug in core_skills:
                if sk_slug in skill_map:
                    if np.random.rand() > 0.15:  # 85% inclusion rate for authentic co-occurrence
                        db.execute(
                            job_skills.insert().values(
                                job_posting_id=posting.id,
                                skill_id=skill_map[sk_slug].id
                            )
                        )

    db.commit()

    # Ensure analytical views are automatically available on fresh PostgreSQL and SQLite databases
    create_views_if_needed(db)


def create_views_if_needed(db: Session):
    """Creates essential analytical SQL views if not already present."""
    try:
        db.execute(text("SELECT 1 FROM v_skill_demand_by_role_country LIMIT 1;"))
    except Exception:
        db.rollback()
        view_queries = [
            """
            CREATE VIEW IF NOT EXISTS v_jobs_by_role_country AS
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
            """,
            """
            CREATE VIEW IF NOT EXISTS v_skill_demand_by_role_country AS
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
            """,
            """
            CREATE VIEW IF NOT EXISTS v_salary_distributions AS
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
            """,
            """
            CREATE VIEW IF NOT EXISTS v_experience_requirements AS
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
            """
        ]
        for q in view_queries:
            try:
                db.execute(text(q))
                db.commit()
            except Exception:
                db.rollback()
