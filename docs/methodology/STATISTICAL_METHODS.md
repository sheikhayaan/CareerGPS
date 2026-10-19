# CareerGPS — Statistical Intelligence & Analytical Methodology

This document outlines the statistical definitions, mathematical formulations, and methodological guardrails governing the CareerGPS Analytics Engine.

---

## 1. Skill Demand Percentage Formulation

For any career role $r$, geographic cohort $c$, and technical skill $s$:

$$\text{SkillDemandPct}(s \mid r, c) = \frac{\left| \{ p \in P_{r,c} \mid s \in \text{Skills}(p) \} \right|}{\left| P_{r,c} \right|} \times 100$$

Where:
- $P_{r,c}$ is the population of distinct, validated job postings for role $r$ in country $c$.
- $\text{Skills}(p)$ is the set of canonical skill slugs extracted from posting $p$.
- The denominator strictly equals the cohort size $\left| P_{r,c} \right|$ to prevent multi-count distortion.

---

## 2. Non-Parametric Salary Distributions & Outlier Bounds

Because observational wage data is frequently right-skewed with high dispersion, CareerGPS employs **non-parametric order statistics**:

1. **Quartiles ($P_{25}, P_{50}, P_{75}$)**:
   - Median: $P_{50}$ (50th percentile) represents central tendency.
   - Interquartile Range: $\text{IQR} = P_{75} - P_{25}$.
2. **Tukey Outlier Thresholds**:
   $$\text{Lower Bound} = P_{25} - 1.5 \times \text{IQR}, \quad \text{Upper Bound} = P_{75} + 1.5 \times \text{IQR}$$
   Observations outside these bounds are flagged as statistical outliers.

---

## 3. Bootstrap Confidence Interval for Median Salary

When sample size satisfies $N \ge 15$:
1. Let $\mathbf{x} = (x_1, x_2, \dots, x_N)$ be the empirical salary vector.
2. Generate $B = 1,000$ bootstrap resamples $\mathbf{x}^{*(b)}$ with replacement.
3. Compute the bootstrap median $\hat{\theta}^{*(b)} = \text{median}(\mathbf{x}^{*(b)})$.
4. The 95% Confidence Interval is given by the percentile method:
   $$\left[ \hat{\theta}^{*}_{(\alpha/2)}, \, \hat{\theta}^{*}_{(1 - \alpha/2)} \right] \quad \text{where } \alpha = 0.05$$

---

## 4. Career Skill Profile Similarity (Jaccard Index)

To compare the technical composition of two career roles $A$ and $B$:

$$J(A, B) = \frac{|S_A \cap S_B|}{|S_A \cup S_B|}$$

Where $S_A$ and $S_B$ represent the respective distinct sets of canonical skills demanded by roles $A$ and $B$.

- **Interpretation**:
  - $J \ge 0.50$: High structural skill transferability.
  - $0.25 \le J < 0.50$: Moderate overlap; core foundational skills shared.
  - $J < 0.25$: Divergent skill profiles requiring specialized retraining.
