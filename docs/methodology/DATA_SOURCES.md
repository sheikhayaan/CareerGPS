# CareerGPS — Data Sources, Licensing & Analytical Limitations

CareerGPS is built on reproducible labor market statistics and standardized occupation ontologies. We adhere to clear principles: **Never fabricate employment numbers, never silently substitute unverified data, and explicitly flag low-sample cohorts.**

---

## 1. Integrated Data Sources & Standards

### 1.1 O*NET 28.0 Database
- **Provider**: U.S. Department of Labor / Employment and Training Administration (USDOL/ETA)
- **License**: [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- **Usage**: Canonical occupational taxonomies, standard Standard Occupational Classification (SOC 2018) codes, role descriptions, and baseline core competencies.
- **Coverage**: Initial 6 core roles:
  - Data Analyst (`15-2051.01`)
  - Data Scientist (`15-2051.00`)
  - Software Engineer (`15-1252.00`)
  - Machine Learning Engineer (`15-1299.08`)
  - Business Analyst (`13-1111.00`)
  - Cybersecurity Analyst (`15-1212.00`)
- **Location in Codebase**: [onet_roles.json](file:///c:/Users/sheik/Documents/ds%20project/data/dictionaries/onet_roles.json)

### 1.2 European Skills, Competences, Qualifications and Occupations (ESCO v1.1.1)
- **Provider**: European Commission, Directorate-General for Employment, Social Affairs and Inclusion
- **License**: European Union Public Licence (EUPL) & Open Data
- **Usage**: Standardized technical skill concepts, cross-language URI identifiers, and term alias mappings (e.g. `psql` -> `postgresql`, `py` -> `python`, `dax` -> `power-bi`).
- **Location in Codebase**: [esco_skills.json](file:///c:/Users/sheik/Documents/ds%20project/data/dictionaries/esco_skills.json)

### 1.3 U.S. Bureau of Labor Statistics (BLS) OEWS
- **Provider**: U.S. Department of Labor
- **License**: Public Domain (U.S. Government Work)
- **Usage**: National benchmark salary percentiles (10th, 25th, Median, 75th, 90th) to cross-validate market postings.
- **Location in Codebase**: [bls_benchmarks.json](file:///c:/Users/sheik/Documents/ds%20project/data/dictionaries/bls_benchmarks.json)

### 1.4 Adzuna Job Search API
- **Provider**: Adzuna Ltd.
- **Access**: Free Developer Tier via HTTP API.
- **License**: Proprietary Developer API Terms; Requires attribution.
- **Configuration**:
  - Registered app keys are read securely from `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` in `apps/api/.env`.
  - When keys are omitted, the pipeline falls back cleanly to the verified benchmark dataset without generating fictional data.
- **Implementation**: [adapters.py](file:///c:/Users/sheik/Documents/ds%20project/pipelines/extract/adapters.py)

---

## 2. Ingestion & Transformation Pipeline Rules

### 2.1 Deduplication Fingerprinting
Every job posting is uniquely indexed using a deterministic SHA-256 fingerprint:
$$\text{Hash} = \text{SHA-256}(\text{source} \parallel \text{external\_id} \parallel \text{title} \parallel \text{company} \parallel \text{country} \parallel \text{date})$$
Duplicates are captured by the `DataQualityValidator` and skipped prior to database insertion.

### 2.2 Salary Annualization Standard
Salaries are standardized to annualized local figures:
- Hourly: $\text{Annual} = \text{Hourly Rate} \times 2080$ (assuming standard 40h work week)
- Monthly: $\text{Annual} = \text{Monthly Rate} \times 12$
- Minimum/Maximum ranges: Standard mid-point average is indexed as `normalized_annual_salary`.

### 2.3 Statistical Sufficiency Rule
- Any role/country combination with fewer than 10 salary observations ($N < 10$) returns `is_statistically_sufficient: false` with the explicit warning:
  > *"Insufficient reliable salary observations (N = ...). Minimum sample of 10 required to prevent bias."*
- Mean and percentile metrics are never fabricated.

---

## 3. Geographic Coverage Limitations

| Country | Code | Currency | Current Status | Primary Benchmark Reference |
| :--- | :--- | :--- | :--- | :--- |
| **United States** | `US` | `USD` | High Confidence | US BLS OEWS + National postings |
| **India** | `IN` | `INR` | Moderate Confidence | Tech Hub Baseline (Bengaluru, Hyderabad, Pune) |
| **United Kingdom** | `GB` | `GBP` | High Confidence | ONS benchmarks + London / Manchester postings |
| **Germany** | `DE` | `EUR` | High Confidence | Federal Employment Agency + Berlin / Munich postings |
