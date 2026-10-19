# CareerGPS — External Data Availability & Feasibility Assessment

Real-world credibility requires absolute transparency regarding public API access, licensing constraints, rate limits, and fallback strategies.

---

## 1. Primary External Data Sources Evaluation

| Source | Geographic Coverage | Cost & Licensing | Rate Limits & Constraints | Ingestion Feasibility | Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Adzuna API** | US, UK, DE, IN | Free Developer Tier (Attribution Required) | 250 calls/day; provides salaries and full descriptions | **High** (Live API adapter) | Cached historical batch snapshots + static baseline sample if quota exhausted |
| **O\*NET Database** | US (International applicability for skill definitions) | Public Domain (Creative Commons Attribution 4.0) | Direct download / static SQL/CSV dumps (Updated quarterly) | **High** (Seed ingestion) | Curated static taxonomy tables in repository |
| **ESCO Classification** | EU / Global (UK & Germany focus) | Open Data (EU Public Licence) | Full downloadable CSV / RDF dumps | **High** (Seed ingestion) | Seed data dictionary |
| **US BLS (OEWS)** | US | Public Domain | Static annual releases (Excel/CSV) | **High** (Benchmark verification) | Benchmark comparison table |
| **UK ONS** | UK | Open Government Licence | Bulk release tables | **Medium** (Static benchmark) | Benchmark comparison table |

---

## 2. Key Data Risks & Mitigation Strategies

### Risk 1: Incomplete or Missing Salary Data
- **Problem**: 40–60% of real job postings omit salary figures or present ambiguous ranges (e.g., "$50k - $150k" or hourly tags).
- **Rule**: Never invent salary numbers or use ungrounded AI estimates.
- **Mitigation**:
  1. Clearly flag sample sizes: Display `N = sample_size`.
  2. If $N < 10$, render: `"Insufficient reliable salary data for this role/location combination."`
  3. Strict annualization formulas:
     $$\text{Annual} = \text{Hourly} \times 2080 \quad (\text{assuming standard 40h work week})$$
     Document every conversion assumption visibly in UI tooltips.

### Risk 2: Rate Limits on Free API Tiers
- **Problem**: Free keys (e.g., Adzuna) allow limited daily calls, risking downtime if queried directly by user requests.
- **Rule**: The client application must **never** hit external labor APIs in the request-response path.
- **Mitigation**:
  1. Scheduled asynchronous ingestion via GitHub Actions into PostgreSQL.
  2. Users query the internal analytical database and materialized views.
  3. Pre-computed aggregates for the 6 core roles and 4 target countries.

### Risk 3: Licensing and Redistribution
- **Problem**: Some commercial job boards prohibit scraping and redistribution.
- **Mitigation**:
  1. Exclusively ingest from legitimate developer APIs (Adzuna) and open public taxonomies (O*NET, ESCO).
  2. Store only normalized tokens, salary observations, and extracted skills; do not redistribute copyrighted long-form job descriptions.
