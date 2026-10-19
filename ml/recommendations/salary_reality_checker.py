from typing import Dict, Any, List, Optional
import math


class SalaryRealityChecker:
    """
    Evaluates a user's target annual salary against observed empirical distributions
    and official national government benchmarks (US BLS).
    """

    @staticmethod
    def evaluate_target(
        target_salary: float,
        empirical_stats: Optional[Dict[str, Any]],
        government_benchmark: Optional[Dict[str, Any]],
        currency: str = "USD"
    ) -> Dict[str, Any]:
        result = {
            "target_salary": target_salary,
            "currency": currency,
            "evaluation_status": "NORMAL",
            "percentile_tier": "Within Expected Range",
            "empirical_median": None,
            "empirical_p25": None,
            "empirical_p75": None,
            "sample_size": 0,
            "message": "",
            "limitations_note": "Observational salary distributions reflect job posting disclosures; they are not employment guarantees."
        }

        if empirical_stats:
            result["sample_size"] = empirical_stats.get("sample_size", 0)

        if empirical_stats and empirical_stats.get("is_sufficient"):
            p25 = empirical_stats.get("p25")
            med = empirical_stats.get("median")
            p75 = empirical_stats.get("p75")
            n = result["sample_size"]

            result["empirical_median"] = med
            result["empirical_p25"] = p25
            result["empirical_p75"] = p75

            if target_salary > p75 * 1.25:
                result["evaluation_status"] = "AMBITIOUS_HIGH"
                result["percentile_tier"] = "Above 75th Percentile (+25% Premium)"
                result["message"] = (
                    f"Your target ({currency} {target_salary:,.0f}) is substantially higher than the observed 75th percentile "
                    f"({currency} {p75:,.0f}) for this role based on {n} verified postings. This tier typically requires senior domain leadership."
                )
            elif target_salary > p75:
                result["evaluation_status"] = "ABOVE_AVERAGE"
                result["percentile_tier"] = "Top Quartile (75th Percentile)"
                result["message"] = (
                    f"Your target ({currency} {target_salary:,.0f}) falls between the median ({currency} {med:,.0f}) and 75th percentile "
                    f"({currency} {p75:,.0f}) in our dataset (N = {n}). Achievable with demonstrable production portfolio projects."
                )
            elif target_salary >= p25:
                result["evaluation_status"] = "REALISTIC_MARKET"
                result["percentile_tier"] = "Mid-Market (25th - 75th Percentile)"
                result["message"] = (
                    f"Your target ({currency} {target_salary:,.0f}) aligns closely with observed market compensation "
                    f"(Median: {currency} {med:,.0f}, N = {n})."
                )
            else:
                result["evaluation_status"] = "CONSERVATIVE"
                result["percentile_tier"] = "Below 25th Percentile"
                result["message"] = (
                    f"Your target ({currency} {target_salary:,.0f}) is below the observed 25th percentile ({currency} {p25:,.0f}). "
                    f"You may have room to negotiate higher based on verified market data."
                )
        else:
            # Fallback to government benchmark if empirical sample size is sparse
            if government_benchmark:
                g_med = government_benchmark.get("median_annual") or government_benchmark.get("median_salary")
                if g_med:
                    result["message"] = (
                        f"Insufficient job advertisement postings in this region. However, official government benchmarks (US BLS) "
                        f"report a national median of ${float(g_med):,.0f} for this occupation."
                    )
                else:
                    result["message"] = (
                        "Insufficient job advertisement postings in this region. Regional benchmark data indicates moderate compensation levels."
                    )
            else:
                result["message"] = (
                    "CareerGPS does not currently have enough reliable salary observations in this region to evaluate this target with statistical confidence."
                )

        return result
