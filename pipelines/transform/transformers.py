import re
import hashlib
from datetime import datetime, date
from typing import Dict, Any, List, Optional, Tuple, Set


class TextCleaner:
    """Provides sanitization and normalization for raw job texts."""

    @staticmethod
    def clean(text: Optional[str]) -> str:
        if not text:
            return ""
        # Remove HTML tags
        clean_text = re.sub(r"<[^>]+>", " ", text)
        # Normalize whitespace
        clean_text = re.sub(r"\s+", " ", clean_text).strip()
        return clean_text


class SkillExtractor:
    """
    Regex-based dictionary matching skill extractor.
    Enforces word boundaries so 'R' does not match 'for', 'or', 'user'.
    Maps matched aliases to canonical skill slugs.
    """

    def __init__(self, esco_skills: List[Dict[str, Any]]):
        self.alias_to_slug: Dict[str, str] = {}
        self.slug_to_canonical: Dict[str, str] = {}
        self.compiled_patterns: List[Tuple[re.Pattern, str]] = []

        for skill in esco_skills:
            slug = skill["slug"]
            canonical_name = skill["name"]
            self.slug_to_canonical[slug] = canonical_name

            all_terms = [canonical_name.lower(), slug.lower()] + [a.lower() for a in skill.get("aliases", [])]
            # Deduplicate terms
            for term in set(all_terms):
                self.alias_to_slug[term] = slug
                # Use regex with word boundaries
                # Handle special characters in tech terms like C++, C#, .NET
                escaped = re.escape(term)
                pattern = re.compile(rf"(?<!\w){escaped}(?!\w)", re.IGNORECASE)
                self.compiled_patterns.append((pattern, slug))

    def extract_skills(self, text: str) -> List[str]:
        """Extract set of canonical skill slugs appearing in text."""
        if not text:
            return []
        found_slugs: Set[str] = set()
        for pattern, slug in self.compiled_patterns:
            if pattern.search(text):
                found_slugs.add(slug)
        return sorted(list(found_slugs))


class Normalizer:
    """
    Normalizes job titles, countries, experience levels, and salaries.
    """

    EXPERIENCE_PATTERNS = [
        (re.compile(r"\b(lead|principal|director|head|staff)\b", re.IGNORECASE), "Lead"),
        (re.compile(r"\b(senior|sr\.?|experienced|iii)\b", re.IGNORECASE), "Senior"),
        (re.compile(r"\b(junior|jr\.?|entry|associate|graduate|intern|trainee|i)\b", re.IGNORECASE), "Entry"),
    ]

    @classmethod
    def classify_experience(cls, title: str, description: str = "") -> str:
        full_text = f"{title} {description}"
        for pattern, level in cls.EXPERIENCE_PATTERNS:
            if pattern.search(full_text):
                return level
        return "Mid"

    @staticmethod
    def normalize_salary(
        salary_min: Optional[float],
        salary_max: Optional[float],
        period: str = "YEARLY"
    ) -> Tuple[Optional[float], Optional[float], Optional[float]]:
        """
        Calculates standard annual salary min, max, and mid-point average.
        Enforces annualization rules:
        - HOURLY -> 2080 hours (40h/week * 52)
        - MONTHLY -> 12 months
        - YEARLY -> 1.0 multiplier
        """
        if salary_min is None and salary_max is None:
            return None, None, None

        min_val = salary_min if salary_min is not None else salary_max
        max_val = salary_max if salary_max is not None else salary_min

        multiplier = 1.0
        p_upper = period.upper()
        if p_upper == "HOURLY":
            multiplier = 2080.0
        elif p_upper == "MONTHLY":
            multiplier = 12.0

        norm_min = min_val * multiplier if min_val else None
        norm_max = max_val * multiplier if max_val else None
        
        if norm_min and norm_max:
            norm_annual = (norm_min + norm_max) / 2.0
        else:
            norm_annual = norm_min or norm_max

        return norm_min, norm_max, norm_annual

    @staticmethod
    def compute_fingerprint(
        source: str,
        external_id: Optional[str],
        title: str,
        company: str,
        country: str,
        posting_date: str
    ) -> str:
        """
        Conservative SHA-256 fingerprint for deterministic deduplication.
        Ensures distinct openings are preserved while identical reposts are merged.
        """
        raw_key = f"{source.strip().lower()}|{str(external_id).strip()}|{title.strip().lower()}|{company.strip().lower()}|{country.strip().upper()}|{str(posting_date)}"
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
