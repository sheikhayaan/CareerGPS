import math
import statistics
import random
from typing import Dict, Any, List, Optional, Tuple, Sequence


class StatisticalAnalyticsEngine:
    """
    Pure Python & standard library statistical intelligence module.
    Free of unapproved C-extension DLL constraints. Implements:
    - Parametric statistics (Mean, Variance, Sample Standard Deviation)
    - Non-parametric statistics (Median, P10, P25, P75, P90, Interquartile Range)
    - Tukey 1.5 * IQR Outlier Identification
    - Bootstrap Resampling Confidence Intervals (Median CI)
    - Jaccard & Weighted Skill Profile Similarity
    """

    @staticmethod
    def _percentile(values: Sequence[float], p: float) -> float:
        """Calculates percentile p in [0, 100] using standard linear interpolation."""
        if not values:
            return 0.0
        sorted_v = sorted(values)
        k = (len(sorted_v) - 1) * (p / 100.0)
        f = math.floor(k)
        c = math.ceil(k)
        if f == c:
            return float(sorted_v[int(k)])
        d0 = sorted_v[int(f)] * (c - k)
        d1 = sorted_v[int(c)] * (k - f)
        return float(d0 + d1)

    @classmethod
    def calculate_descriptive_stats(cls, values: Sequence[float]) -> Dict[str, Any]:
        """Calculates comprehensive parametric and non-parametric distribution metrics."""
        clean = [float(v) for v in values if v is not None and not math.isnan(float(v))]
        n = len(clean)
        if n == 0:
            return {"sample_size": 0, "is_sufficient": False, "note": "Zero observations"}

        mean_val = statistics.mean(clean)
        std_val = statistics.stdev(clean) if n > 1 else 0.0
        median_val = statistics.median(clean)
        p10 = cls._percentile(clean, 10.0)
        p25 = cls._percentile(clean, 25.0)
        p75 = cls._percentile(clean, 75.0)
        p90 = cls._percentile(clean, 90.0)
        iqr = p75 - p25

        # Outlier bounds via Tukey 1.5 * IQR standard
        lower_bound = p25 - 1.5 * iqr
        upper_bound = p75 + 1.5 * iqr
        outliers = [v for v in clean if v < lower_bound or v > upper_bound]

        return {
            "sample_size": n,
            "mean": round(mean_val, 2),
            "std": round(std_val, 2),
            "median": round(median_val, 2),
            "p10": round(p10, 2),
            "p25": round(p25, 2),
            "p75": round(p75, 2),
            "p90": round(p90, 2),
            "iqr": round(iqr, 2),
            "min": round(min(clean), 2),
            "max": round(max(clean), 2),
            "outlier_count": len(outliers),
            "is_sufficient": n >= 10,
        }

    @classmethod
    def bootstrap_median_confidence_interval(
        cls,
        values: Sequence[float],
        confidence_level: float = 0.95,
        n_bootstraps: int = 1000,
        random_seed: int = 42
    ) -> Dict[str, Any]:
        """
        Computes non-parametric bootstrap confidence interval for median salary.
        Requires N >= 15 to ensure empirical resampling stability.
        """
        clean = [float(v) for v in values if v is not None and not math.isnan(float(v))]
        n = len(clean)
        if n < 15:
            return {
                "applicable": False,
                "reason": f"Sample size (N = {n}) below minimum threshold of 15 for bootstrap resampling.",
                "ci_lower": None,
                "ci_upper": None,
            }

        rng = random.Random(random_seed)
        bootstrapped_medians: List[float] = []
        for _ in range(n_bootstraps):
            sample = [rng.choice(clean) for _ in range(n)]
            bootstrapped_medians.append(statistics.median(sample))

        alpha = 1.0 - confidence_level
        ci_lower = cls._percentile(bootstrapped_medians, (alpha / 2.0) * 100.0)
        ci_upper = cls._percentile(bootstrapped_medians, (1.0 - alpha / 2.0) * 100.0)

        return {
            "applicable": True,
            "confidence_level": confidence_level,
            "n_bootstraps": n_bootstraps,
            "ci_lower": round(ci_lower, 2),
            "ci_upper": round(ci_upper, 2),
            "median_point_estimate": round(statistics.median(clean), 2)
        }

    @staticmethod
    def compare_skill_profiles(
        skills_set_a: set,
        skills_set_b: set,
        weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Computes Jaccard Similarity and Weighted Overlap between two career skill profiles.
        """
        intersection = skills_set_a.intersection(skills_set_b)
        union = skills_set_a.union(skills_set_b)

        if not union:
            return {"jaccard_similarity": 0.0, "shared_skills": [], "unique_a": [], "unique_b": []}

        jaccard = len(intersection) / len(union)

        weighted_jaccard = None
        if weights:
            num = sum(weights.get(s, 1.0) for s in intersection)
            denom = sum(weights.get(s, 1.0) for s in union)
            weighted_jaccard = round(num / denom, 4) if denom > 0 else 0.0

        return {
            "jaccard_similarity": round(jaccard, 4),
            "weighted_jaccard": weighted_jaccard,
            "shared_count": len(intersection),
            "shared_skills": sorted(list(intersection)),
            "unique_a": sorted(list(skills_set_a - skills_set_b)),
            "unique_b": sorted(list(skills_set_b - skills_set_a)),
        }
