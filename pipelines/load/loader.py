import uuid
import logging
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.entities import (
    DataSource,
    DataIngestionRun,
    CareerRole,
    Country,
    City,
    Company,
    Skill,
    SkillAlias,
    JobPosting,
    SalaryObservation,
    job_skills,
    role_skills
)
from pipelines.extract.adapters import TaxonomiesAdapter
from pipelines.transform.transformers import TextCleaner, SkillExtractor, Normalizer
from pipelines.validation.validator import RawJobRecord, DataQualityValidator

logger = logging.getLogger(__name__)


class DatabaseLoader:
    """
    Executes relational database loading into PostgreSQL / SQLite with:
    - Reference taxonomy seeding
    - Idempotent upserts for companies and cities
    - Deduplicated job postings
    - Granular salary observations
    - Ingestion run tracking
    """

    def __init__(self, db: Session):
        self.db = db

    def sync_taxonomies(self, tax_adapter: TaxonomiesAdapter) -> Dict[str, Any]:
        """Load and synchronize O*NET roles, ESCO skills, and aliases into the DB."""
        # 1. Ensure Data Sources
        sources_meta = [
            ("O*NET Database", "https://www.onetcenter.org/", "Creative Commons Attribution 4.0", "U.S. Department of Labor, Employment and Training Administration"),
            ("ESCO Classification", "https://ec.europa.eu/esco/portal", "European Union Public Licence (EUPL)", "European Commission Directorate-General for Employment"),
            ("U.S. Bureau of Labor Statistics", "https://api.bls.gov/", "Public Domain", "U.S. Bureau of Labor Statistics Occupational Employment and Wage Statistics"),
            ("Adzuna Job Search API", "https://api.adzuna.com/", "Proprietary Developer API", "Adzuna Ltd Job Search Platform"),
        ]
        source_map = {}
        for name, url, lic, attr in sources_meta:
            s_obj = self.db.query(DataSource).filter(DataSource.name == name).first()
            if not s_obj:
                s_obj = DataSource(id=str(uuid.uuid4()), name=name, api_endpoint=url, license_type=lic, attribution_text=attr)
                self.db.add(s_obj)
            source_map[name] = s_obj

        # 2. Countries
        countries_data = [
            ("US", "United States", "USD"),
            ("IN", "India", "INR"),
            ("GB", "United Kingdom", "GBP"),
            ("DE", "Germany", "EUR"),
        ]
        for iso, name, curr in countries_data:
            if not self.db.query(Country).filter(Country.iso_code == iso).first():
                self.db.add(Country(id=str(uuid.uuid4()), iso_code=iso, name=name, currency_code=curr))

        self.db.flush()

        # 3. O*NET Roles
        onet_roles = tax_adapter.load_onet_roles()
        for r in onet_roles:
            role_obj = self.db.query(CareerRole).filter(CareerRole.slug == r["slug"]).first()
            if not role_obj:
                role_obj = CareerRole(
                    id=str(uuid.uuid4()),
                    slug=r["slug"],
                    title=r["title"],
                    description=r.get("description"),
                    onet_soc_code=r.get("onet_soc_code")
                )
                self.db.add(role_obj)
            else:
                role_obj.title = r["title"]
                role_obj.description = r.get("description")
                role_obj.onet_soc_code = r.get("onet_soc_code")

        self.db.flush()

        # 4. ESCO Skills & Aliases
        esco_skills = tax_adapter.load_esco_skills()
        for s in esco_skills:
            skill_obj = self.db.query(Skill).filter(Skill.slug == s["slug"]).first()
            if not skill_obj:
                skill_obj = Skill(
                    id=str(uuid.uuid4()),
                    slug=s["slug"],
                    name=s["name"],
                    category=s["category"],
                    esco_uri=s.get("esco_uri")
                )
                self.db.add(skill_obj)
                self.db.flush()
            
            # Aliases
            for alias in s.get("aliases", []):
                norm_alias = alias.lower().strip()
                if not self.db.query(SkillAlias).filter(SkillAlias.alias == norm_alias).first():
                    self.db.add(SkillAlias(id=str(uuid.uuid4()), skill_id=skill_obj.id, alias=norm_alias))

        self.db.commit()
        return {"status": "synchronized", "roles_count": len(onet_roles), "skills_count": len(esco_skills)}

    def get_or_create_company(self, name: str) -> Company:
        norm_name = re_normalize(name)
        company = self.db.query(Company).filter(Company.normalized_name == norm_name).first()
        if not company:
            company = Company(id=str(uuid.uuid4()), name=name.strip(), normalized_name=norm_name)
            self.db.add(company)
            self.db.flush()
        return company

    def get_or_create_city(self, city_name: Optional[str], country_id: str) -> Optional[City]:
        if not city_name:
            return None
        c_clean = city_name.strip()
        city = self.db.query(City).filter(City.name == c_clean, City.country_id == country_id).first()
        if not city:
            city = City(id=str(uuid.uuid4()), country_id=country_id, name=c_clean)
            self.db.add(city)
            self.db.flush()
        return city

    def load_job_records(
        self,
        records: List[RawJobRecord],
        source_name: str,
        skill_extractor: SkillExtractor
    ) -> Dict[str, Any]:
        """
        Executes end-to-end load of validated and normalized job postings.
        """
        source_obj = self.db.query(DataSource).filter(DataSource.name == source_name).first()
        if not source_obj:
            source_obj = DataSource(
                id=str(uuid.uuid4()),
                name=source_name,
                license_type="Verified Ingestion",
                attribution_text=f"Ingestion from {source_name}"
            )
            self.db.add(source_obj)
            self.db.flush()

        ingestion_run = DataIngestionRun(
            id=str(uuid.uuid4()),
            source_id=source_obj.id,
            status="RUNNING",
            records_fetched=len(records)
        )
        self.db.add(ingestion_run)
        self.db.flush()

        validator = DataQualityValidator()
        inserted = 0
        deduplicated = 0

        # Pre-cache roles, countries, skills
        roles_cache = {r.slug: r for r in self.db.query(CareerRole).all()}
        countries_cache = {c.iso_code: c for c in self.db.query(Country).all()}
        skills_cache = {s.slug: s for s in self.db.query(Skill).all()}

        for rec in records:
            fingerprint = Normalizer.compute_fingerprint(
                source=rec.source_name,
                external_id=rec.external_id,
                title=rec.raw_title,
                company=rec.company_name,
                country=rec.country_code,
                posting_date=str(rec.posting_date)
            )

            # Check if exists in DB or failed validation
            if self.db.query(JobPosting).filter(JobPosting.fingerprint_hash == fingerprint).first():
                deduplicated += 1
                continue

            if not validator.validate_record(rec, fingerprint):
                deduplicated += 1
                continue

            role = roles_cache.get(rec.role_slug)
            country = countries_cache.get(rec.country_code)
            if not role or not country:
                continue

            company = self.get_or_create_company(rec.company_name)
            city = self.get_or_create_city(rec.city_name, country.id)

            # Normalization
            norm_min, norm_max, norm_annual = Normalizer.normalize_salary(
                rec.salary_min, rec.salary_max, rec.salary_period
            )
            experience = Normalizer.classify_experience(rec.raw_title, rec.raw_description)

            clean_desc = TextCleaner.clean(rec.raw_description)
            extracted_skill_slugs = skill_extractor.extract_skills(f"{rec.raw_title} {clean_desc}")

            posting = JobPosting(
                id=str(uuid.uuid4()),
                ingestion_run_id=ingestion_run.id,
                external_id=rec.external_id,
                source_name=rec.source_name,
                fingerprint_hash=fingerprint,
                career_role_id=role.id,
                country_id=country.id,
                city_id=city.id if city else None,
                company_id=company.id,
                raw_title=rec.raw_title,
                posting_date=rec.posting_date,
                experience_level=experience,
                salary_min=norm_min,
                salary_max=norm_max,
                salary_currency=country.currency_code,
                salary_period=rec.salary_period,
                normalized_annual_salary=norm_annual
            )
            self.db.add(posting)
            self.db.flush()

            # Record salary observation if present
            if norm_annual is not None:
                self.db.add(
                    SalaryObservation(
                        id=str(uuid.uuid4()),
                        job_posting_id=posting.id,
                        career_role_id=role.id,
                        country_id=country.id,
                        raw_amount=norm_annual,
                        raw_period="YEARLY",
                        raw_currency=country.currency_code,
                        normalized_annual_amount=norm_annual,
                        is_outlier=False
                    )
                )

            # Associate skills
            for s_slug in extracted_skill_slugs:
                if s_slug in skills_cache:
                    self.db.execute(
                        job_skills.insert().values(
                            job_posting_id=posting.id,
                            skill_id=skills_cache[s_slug].id
                        )
                    )

            inserted += 1

        ingestion_run.status = "COMPLETED"
        ingestion_run.records_inserted = inserted
        ingestion_run.records_deduplicated = deduplicated
        ingestion_run.completed_at = datetime.utcnow()
        self.db.commit()

        quality_report = validator.generate_report()
        return {
            "ingestion_run_id": ingestion_run.id,
            "records_inserted": inserted,
            "records_deduplicated": deduplicated,
            "quality_report": quality_report
        }


def re_normalize(name: str) -> str:
    import re
    return re.sub(r"[^\w\s]", "", name.lower()).strip()
