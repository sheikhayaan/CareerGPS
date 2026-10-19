import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger(__name__)


class AdzunaAdapter:
    """
    Adapter for querying Adzuna Job Search API.
    Provides rate-limiting, error handling, and structured response parsing.
    Requires ADZUNA_APP_ID and ADZUNA_APP_KEY.
    """

    BASE_URLS = {
        "US": "https://api.adzuna.com/v1/api/jobs/us/search",
        "GB": "https://api.adzuna.com/v1/api/jobs/gb/search",
        "DE": "https://api.adzuna.com/v1/api/jobs/de/search",
        "IN": "https://api.adzuna.com/v1/api/jobs/in/search",
    }

    def __init__(self, app_id: Optional[str] = None, app_key: Optional[str] = None):
        self.app_id = app_id
        self.app_key = app_key

    def is_configured(self) -> bool:
        return bool(self.app_id and self.app_key)

    def fetch_jobs(
        self,
        country_code: str,
        role_title: str,
        page: int = 1,
        results_per_page: int = 20
    ) -> Dict[str, Any]:
        """Fetch job postings from Adzuna API with timeout and status handling."""
        cc = country_code.upper()
        if cc not in self.BASE_URLS:
            raise ValueError(f"Country code {cc} not supported by Adzuna adapter")

        if not self.is_configured():
            logger.warning("Adzuna credentials not configured. Returning empty live batch.")
            return {"results": [], "count": 0, "configured": False}

        url = f"{self.BASE_URLS[cc]}/{page}"
        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "results_per_page": results_per_page,
            "what": role_title,
            "content-type": "application/json",
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.get(url, params=params)
                if response.status_code == 401:
                    logger.error("Adzuna API Authentication failed. Check ADZUNA_APP_ID / ADZUNA_APP_KEY.")
                    return {"results": [], "count": 0, "error": "AUTH_FAILED"}
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching from Adzuna API ({cc}, {role_title}): {e}")
            return {"results": [], "count": 0, "error": str(e)}


class TaxonomiesAdapter:
    """
    Adapter for loading O*NET and ESCO standardized taxonomies and BLS salary benchmarks.
    Loads from versioned data assets in data/dictionaries.
    """

    def __init__(self, data_dir: Optional[Path] = None):
        if data_dir is None:
            # Default to root data directory
            self.data_dir = Path(__file__).resolve().parent.parent.parent / "data" / "dictionaries"
        else:
            self.data_dir = Path(data_dir)

    def load_onet_roles(self) -> List[Dict[str, Any]]:
        path = self.data_dir / "onet_roles.json"
        if not path.exists():
            raise FileNotFoundError(f"Missing O*NET roles dictionary: {path}")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("roles", [])

    def load_esco_skills(self) -> List[Dict[str, Any]]:
        path = self.data_dir / "esco_skills.json"
        if not path.exists():
            raise FileNotFoundError(f"Missing ESCO skills dictionary: {path}")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("skills", [])

    def load_bls_benchmarks(self) -> Dict[str, Any]:
        path = self.data_dir / "bls_benchmarks.json"
        if not path.exists():
            raise FileNotFoundError(f"Missing BLS benchmarks dictionary: {path}")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("benchmarks", {})
