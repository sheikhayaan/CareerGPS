"""
CareerGPS — Analytical Verification & Profiling Script
Demonstrates statistical calculations, salary quartiles, bootstrap resampling,
and skill similarity across live database records.
"""

import os
import sys
import json
import sqlite3

ROOT_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT_DIR, "apps", "api"))
sys.path.insert(0, ROOT_DIR)

from analytics.statistics_engine import StatisticalAnalyticsEngine


def run_profiling():
    db_path = os.path.join(ROOT_DIR, "apps", "api", "careergps.db")
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Total Postings
    cur.execute("SELECT count(*) FROM job_postings")
    total_postings = cur.fetchone()[0]
    print(f"\n1. DATASET PROFILE")
    print(f"   Total Distinct Job Postings: {total_postings}")

    # 2. Descriptive Statistics & Bootstrap CI for Data Analyst in US
    cur.execute("""
        SELECT normalized_annual_salary
        FROM job_postings jp
        JOIN career_roles cr ON jp.career_role_id = cr.id
        JOIN countries c ON jp.country_id = c.id
        WHERE cr.slug = 'data-analyst' AND c.iso_code = 'US'
          AND jp.normalized_annual_salary IS NOT NULL
    """)
    salaries = [r[0] for r in cur.fetchall()]
    stats = StatisticalAnalyticsEngine.calculate_descriptive_stats(salaries)
    ci = StatisticalAnalyticsEngine.bootstrap_median_confidence_interval(salaries, n_bootstraps=1000)

    print(f"\n2. SALARY STATISTICAL INTELLIGENCE (Data Analyst - US)")
    print(f"   Sample Size: N = {stats['sample_size']}")
    print(f"   Mean: ${stats['mean']:,.2f}")
    print(f"   Median (P50): ${stats['median']:,.2f}")
    print(f"   25th Percentile: ${stats['p25']:,.2f}")
    print(f"   75th Percentile: ${stats['p75']:,.2f}")
    print(f"   Interquartile Range (IQR): ${stats['iqr']:,.2f}")
    print(f"   Tukey Outlier Count: {stats['outlier_count']}")
    if ci.get("applicable"):
        print(f"   95% Bootstrap Confidence Interval: [${ci['ci_lower']:,.2f}, ${ci['ci_upper']:,.2f}]")

    # 3. Career Skill Overlap (Data Analyst vs Data Scientist)
    def get_skills_for_role(role_slug):
        cur.execute("""
            SELECT DISTINCT s.name
            FROM skills s
            JOIN job_skills js ON s.id = js.skill_id
            JOIN job_postings jp ON js.job_posting_id = jp.id
            JOIN career_roles cr ON jp.career_role_id = cr.id
            WHERE cr.slug = ?
        """, (role_slug,))
        return {r[0] for r in cur.fetchall()}

    da_skills = get_skills_for_role("data-analyst")
    ds_skills = get_skills_for_role("data-scientist")
    sim = StatisticalAnalyticsEngine.compare_skill_profiles(da_skills, ds_skills)

    print(f"\n3. CAREER SKILL PORTFOLIO SIMILARITY")
    print(f"   Data Analyst vs Data Scientist Jaccard Index: {sim['jaccard_similarity'] * 100:.1f}%")
    print(f"   Shared Skills ({sim['shared_count']}): {', '.join(sim['shared_skills'])}")
    print(f"   Unique to Data Analyst: {', '.join(sim['unique_a'])}")
    print(f"   Unique to Data Scientist: {', '.join(sim['unique_b'])}")

    conn.close()
    print("\nProfiling completed successfully!")


if __name__ == "__main__":
    run_profiling()
