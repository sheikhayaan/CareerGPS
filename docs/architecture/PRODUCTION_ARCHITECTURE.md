# CareerGPS — Production Scale Architecture & Systems Engineering
## High-Concurrency Architecture for 1,000 Concurrent Users

---

## 1. Executive Topology & Systems Overview

CareerGPS is architected as a high-throughput, decoupled, multi-tiered cloud SaaS system designed to handle **1,000 concurrent users** with sub-500ms read latencies, zero cold-cache stampedes, and zero database connection exhaustion.

```
                           [ Internet Traffic ]
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │   Edge Security & Acceleration (Vercel Edge / WAF)     │
       │   - Global CDN / ISR Caching                           │
       │   - WAF & DDoS Shield (OWASP Top 10 Managed Rules)     │
       │   - Edge Security Headers & Nonce-based CSP            │
       │   - Correlation ID Generation (X-Request-ID)           │
       │   - Payload Body Size Limit (1 MB JSON Cap)            │
       └────────────────────────────┬───────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
       [ Frontend Client Tier ]              [ Auth & Identity Tier ]
        Next.js 15 (React 19)                 Supabase Auth
        - Static ISR Public Pages             - OAuth 2.0 (Google)
        - SSR Authenticated Dashboards        - Cryptographic JWT (HS256)
        - Dynamic 3D/Particle Imports         - Stateless Session Verification
                  │
                  ▼ (HTTPS / REST Bearer JWT / X-Request-ID)
       ┌────────────────────────────────────────────────────────┐
       │   FastAPI Core Services (Gunicorn + Uvicorn Workers)   │
       │   - Topology: (2 × CPU Cores) + 1 Workers              │
       │   - Per-Worker Concurrency Cap: 100–200 requests       │
       │   - Zero-Blocking Async Discipline (run_in_executor)   │
       │   - Heavy Job Offloading (202 Accepted + Job ID)       │
       └──────────────┬──────────────────────────┬──────────────┘
                      │                          │
                      ▼                          ▼
       ┌────────────────────────┐      ┌────────────────────────┐
       │ Redis Caching & Queue  │      │ PgBouncer Connection   │
       │ - Endpoint TTL Caches  │      │ Pooling (Transaction)  │
       │ - Token Bucket Limits  │      │ - Max Clients: 1000+   │
       │ - Celery / Task Queue  │      │ - Server Pool: 20–50   │
       │ - Pre-warmed Payloads  │      │ - Timeout: 5–10s       │
       └────────────────────────┘      └───────────┬────────────┘
                                                   │
                                                   ▼
                                       ┌────────────────────────┐
                                       │ PostgreSQL 16 Cluster  │
                                       │ - Composite B-Tree Idx │
                                       │ - Analytical Views     │
                                       │ - Parameterized ORM    │
                                       └────────────────────────┘
```

---

## 2. Backend & Application Layer (FastAPI)

### 2.1. Explicit Worker Topology
A single Uvicorn process is bound to a single CPU core and single asyncio event loop. A single unhandled blocking operation freezes the entire process. To guarantee high throughput across 1,000 concurrent sessions:

1. **Gunicorn Master Process with Uvicorn Worker Class**:
   $$\text{Worker Count} = (2 \times N_{\text{CPU Cores}}) + 1$$
   - On a 2-core cloud node: 5 concurrent worker processes.
   - On a 4-core node: 9 concurrent worker processes.
2. **Per-Worker Concurrency Limit (`--limit-concurrency`)**:
   - Each Uvicorn worker is started with `--limit-concurrency 150`.
   - Prevents file descriptor and memory exhaustion by returning HTTP 503 instead of queueing unbounded connections until the node crashes.
3. **Cloud-Native Container Mode**:
   - For Kubernetes (EKS/GKE) and auto-scaled container platforms (Render/Railway), deploy **single-worker containers** and let the Horizontal Pod Autoscaler (HPA) scale pods dynamically based on CPU utilization ($>70\%$) and HTTP request latency.

### 2.2. Strict Async Discipline
To prevent event loop starvation under high concurrency:
- **`async def` for I/O-Bound Paths**: Database queries (via SQLAlchemy 2.0 Async / `asyncpg`), Redis operations (`aioredis`), and external HTTP calls (`httpx.AsyncClient`).
- **`def` + `run_in_executor` for CPU-Bound Work**: Heavy calculations (Bootstrap confidence interval resampling with 1,000 iterations, Jaccard matrix comparisons, Tukey IQR outlier computations) must be executed in Python thread/process pools via `asyncio.get_event_loop().run_in_executor(executor, ...)`.
- **Stateless Application Tier**: Zero in-memory session or cache state is stored inside the FastAPI process. All shared state lives in Redis.

### 2.3. Asynchronous Job Offloading (202 Accepted)
- Heavy operations such as `POST /api/career/roadmap/generate` and `POST /api/career/ai/explain-skill` adhere to a 200ms latency budget.
- If processing time is expected to exceed ~200ms, the API immediately returns `HTTP 202 Accepted`:
  ```json
  {
    "status": "queued",
    "job_id": "job_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "poll_url": "/api/v1/jobs/job_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "estimated_seconds": 1.2
  }
  ```
- Background worker queues (Celery or Redis Queue) process the payload and write completed schemas to Redis for client retrieval, freeing FastAPI worker concurrency slots instantly.

---

## 3. Database Layer & PgBouncer Connection Multiplexing

### 3.1. The Math of Connection Exhaustion
PostgreSQL allocates a dedicated operating system process per client connection. Each connection consumes approximately 5 MB to 10 MB of RAM. 
- 1,000 direct connections = **5 GB to 10 GB of RAM** consumed purely by idle connection overhead, triggering Linux OOM (Out Of Memory) killers and connection dropouts.

### 3.2. PgBouncer Transaction Pooling Configuration
Deploy PgBouncer between the FastAPI application cluster and PostgreSQL 16. In **Transaction Pooling Mode**, PostgreSQL connections are returned to the pool the exact millisecond a SQL transaction commits:

| PgBouncer Parameter | Production Target | Rationale |
| :--- | :--- | :--- |
| `pool_mode` | `transaction` | Returns connections at commit; multiplexes 1,000 clients onto tens of DB backends |
| `max_client_conn` | `1000 - 2000` | Accepts all incoming FastAPI worker connection attempts |
| `default_pool_size` | `20 - 50` | Actual persistent backend connections open to PostgreSQL; protects DB RAM |
| `min_pool_size` | `5 - 10` | Pre-warmed persistent connections to eliminate cold-start TLS handshake overhead |
| `reserve_pool_size` | `5 - 10` | Burst capacity for traffic spikes |
| `max_db_connections`| `100 - 200` | Absolute hard ceiling on PostgreSQL server process count |
| `query_wait_timeout`| `5 - 10 s` | Terminate queued queries waiting too long; prevents cascade deadlocks |

### 3.3. Critical Composite Indexes for Scale
To ensure sub-50ms execution on heavy aggregations under 1,000-user concurrency:
1. `job_postings (career_role_id, country_id, posting_date)` — Eliminates table scans during role and geographic market aggregations.
2. `job_skills (skill_id, job_posting_id)` — Bridges canonical skill frequencies and pairwise co-occurrence calculations.
3. `roadmap_progress (roadmap_id, week_number, task_identifier)` — Enables instantaneous completion toggle and progress lookups.
4. `saved_roadmaps (user_id, is_archived)` — Accelerates the user dashboard query by filtering archived roadmaps immediately.

### 3.4. Query Timeouts
All database sessions enforce `statement_timeout = 8000` (8 seconds). Pathological or unindexed analytics queries are automatically terminated before holding pooled connections indefinitely.

---

## 4. Redis Caching & Distributed Rate Limiting

### 4.1. Endpoint-Level Response Caching
The analytics endpoints are read-heavy and computationally identical across users viewing the same role/country. Redis caching reduces read latencies by $3\times$ to $10\times$ and absorbs $>80\%$ of database traffic:

| Endpoint | TTL | Cache Key Strategy | Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| `GET /api/analytics/overview` | 10 min | `cache:analytics:overview` | Time-based TTL |
| `GET /api/analytics/skills/demand` | 30 min | `cache:skills:demand:{role}:{country}` | Time-based or on ETL completion |
| `GET /api/analytics/skills/cooccurrence` | 60 min | `cache:skills:cooc:{role}:{country}` | Co-occurrence precompute completion |
| `GET /api/career/resources` | 24 hr | `cache:career:resources:{skill_slug}` | Content catalog update |
| `GET /api/career/skills/prerequisites` | 24 hr | `cache:career:dag:prerequisites` | Knowledge Graph DAG schema rebuild |

### 4.2. Post-Deployment Cache Warmup
To prevent the "Cold-Cache Stampede" when 1,000 users arrive simultaneously:
- An automated post-migration script pre-computes and writes the top 20 combinations of target roles (*Data Analyst, ML Engineer, etc.*) and countries (*US, IN, GB, DE*) directly into Redis.
- Zero initial visitors experience cold-start latency.

### 4.3. Distributed Token-Bucket Rate Limiting
In-process rate limiting fails in multi-worker and multi-container environments. CareerGPS utilizes Redis-backed sliding-window token buckets:
- `POST /api/career/profile/analyze`: 20 requests/minute per authenticated user.
- `GET /api/analytics/*`: 120 requests/minute per IP/User.
- `/api/auth/*` (Login, Signup): 10 requests/minute per IP to completely block credential stuffing and brute force attacks.

---

## 5. Frontend & Edge Layer (Next.js 15 on Vercel)

### 5.1. Route-Specific Rendering Strategy
Different application pages require distinct caching postures to guarantee data security without sacrificing performance:

```
┌───────────────────────┬─────────────────────────┬──────────────────────────────────────────┐
│ Route                 │ Strategy                │ Caching Header / Behavior                │
├───────────────────────┼─────────────────────────┼──────────────────────────────────────────┤
│ / (Landing Page)      │ SSG + ISR               │ revalidate: 3600 (1 hour edge cache)     │
│ /explore              │ ISR                     │ revalidate: 14400 (4 hour edge cache)    │
│ /dashboard            │ SSR (Dynamic)           │ Cache-Control: private, no-store         │
│ /my-roadmaps/[id]     │ SSR (Dynamic)           │ Cache-Control: private, max-age=15       │
│ /planner (Results)    │ Client State + SWR      │ Responses cached in server Redis         │
└───────────────────────┴─────────────────────────┴──────────────────────────────────────────┘
```

### 5.2. Core Web Vitals (CWV) Targets & Mitigations
Google 2026 Core Web Vitals thresholds for production SaaS:

| Metric | Target | CareerGPS Specific Risk & Engineering Mitigation |
| :--- | :--- | :--- |
| **LCP (Largest Contentful Paint)** | **$\le 2.5$ s** | The hero particle canvas and 3D orbit visualization can block LCP. **Mitigation**: Critical hero typography and SVGs are inlined; particle canvas is dynamically imported (`ssr: false`) after first paint. |
| **INP (Interaction to Next Paint)** | **$\le 200$ ms** | 3D card tilt (`.card-3d`) and magnetic buttons (`.btn-magnetic`) consume main-thread cycles. **Mitigation**: Transforms use pure hardware-accelerated CSS (`transform: translate3d`) and `will-change: transform`. |
| **CLS (Cumulative Layout Shift)** | **$\le 0.1$** | Animated statistics counters triggered by IntersectionObserver. **Mitigation**: Container elements specify fixed aspect ratios and min-heights (`min-h-[72px]`) to reserve layout geometry. |
| **TTFB (Time to First Byte)** | **$< 800$ ms** | Slow backend response times degrade TTFB. **Mitigation**: Vercel Edge caching for ISR routes + Redis TTL caching on backend APIs. |

### 5.3. Vercel Edge Middleware
Enforces network-level security and headers before requests reach application compute:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy`: Nonce-based CSP for WebGL/Canvas scripts and ECharts modules.

---

## 6. Security Hardening for Scale

1. **WAF & DDoS Mitigation at Edge**:
   - Vercel Firewall / Cloudflare WAF deployed in front of web and API routes.
   - Enforces managed OWASP Core Rulesets (blocking SQLi, XSS, and command injection attempts before touching FastAPI).
2. **Strict Request Body Size Caps (OWASP API4:2023)**:
   - Gateway enforces a strict **1 MB limit** on incoming JSON request bodies.
   - Query pagination parameters are capped (`limit <= 100`) to block memory exhaustion attacks.
3. **End-to-End Correlation ID (`X-Request-ID`)**:
   - Edge proxy assigns a unique UUID4 `X-Request-ID` to every inbound request.
   - Propagated through FastAPI middleware into database query logs and structured JSON logs.
   - Enables instantaneous tracing of slow queries or security anomalies across tiers.
4. **Automated CI/CD Vulnerability Gates**:
   - GitHub Actions pipeline runs `pip-audit` for Python dependencies and `npm audit --audit-level=high` for Node packages as mandatory blocking checks.
   - Docker container images are built using minimal base images (`python:3.11-slim`) and execute under an unprivileged user (`USER careergps`).

---

## 7. Performance Service Level Objectives (SLOs)

### 7.1. API Service Level Objectives
Measured over a rolling 30-day window under peak concurrency:

| Endpoint Category | P50 Latency | P95 Latency | P99 Latency | Error Budget (5xx) |
| :--- | :--- | :--- | :--- | :--- |
| **Health & Status (`/health`)** | $< 30$ ms | $< 100$ ms | $< 200$ ms | $< 0.01\%$ |
| **Read APIs (Analytics, Roadmap List)** | $< 80$ ms | $< 250$ ms | $< 500$ ms | $< 0.10\%$ |
| **Write APIs (Save Roadmap, Progress Check)** | $< 150$ ms | $< 400$ ms | $< 1,000$ ms | $< 0.10\%$ |
| **Heavy Computation (`profile/analyze`)** | $< 400$ ms | $< 900$ ms | $< 2,000$ ms | $< 0.50\%$ |
| **Auth Verification (`/api/user/profile`)** | $< 100$ ms | $< 250$ ms | $< 500$ ms | $< 0.10\%$ |

### 7.2. Infrastructure & Reliability Targets
- **Monthly Uptime**: $\ge 99.9\%$ (maximum allowed downtime: 43.8 minutes/month).
- **PgBouncer Pool Utilization**: $< 70\%$ at steady-state 1,000 concurrent user load.
- **Redis Cache Hit Ratio**: $> 80\%$ on all `/api/analytics/*` requests.
- **Frontend TTFB (P75 field data)**: $< 800$ ms.

---

## 8. Empirical Load Validation (k6 Test Framework)

Scalability is validated empirically using **k6** load testing scripts executed against staging environments:

```javascript
// k6 load test script: tests/load/k6_1000_users.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    // 1. Baseline Verification
    baseline: {
      executor: 'constant-vus',
      vus: 100,
      duration: '5m',
      startTime: '0m',
    },
    // 2. Target Concurrency Scale
    target_load: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '10m',
      startTime: '6m',
    },
    // 3. Traffic Spike Test
    spike: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '1m', target: 1000 },
        { duration: '3m', target: 1000 },
        { duration: '1m', target: 100 },
      ],
      startTime: '17m',
    },
    // 4. Soak Endurance Test
    soak: {
      executor: 'constant-vus',
      vus: 500,
      duration: '2h',
      startTime: '23m',
    },
  },
  thresholds: {
    'http_req_duration{type:read}': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.001'], // Less than 0.1% error rate
  },
};

export default function () {
  const res = http.get('https://api.careergps.com/api/v1/analytics/skills/demand?role=data-scientist&country=US', {
    tags: { type: 'read' },
  });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'latency is acceptable': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### Pass Criteria
1. **P95 Latency** remains $< 500$ ms across read endpoints during full 1,000 VU load.
2. **HTTP 5xx Error Rate** remains $< 0.1\%$.
3. **PgBouncer Pool Utilization** never exceeds $70\%$.
4. **No Memory Leaks** detected during the 2-hour soak test.

---

## 9. Learning Log — Iterative Architecture Decisions

| # | Finding (Before) | Decision Adopted (After) | Technical Rationale |
| :--- | :--- | :--- | :--- |
| **L1** | Undefined worker count in Uvicorn | Gunicorn + Uvicorn with $(2 \times \text{CPU}) + 1$ workers, `--limit-concurrency 150` | Avoids event loop starvation and caps outstanding sockets per process |
| **L2** | Direct connection to PostgreSQL | PgBouncer in transaction pooling mode (`default_pool_size=30`, `max_client_conn=1500`) | 1,000 raw PostgreSQL connections consume 5-10GB RAM and exhaust file descriptors |
| **L3** | Dynamic re-aggregation of analytics on every request | Redis response caching with 10-60m TTLs + deployment cache warmup | $3\times$ latency reduction and $>80\%$ database load relief |
| **L4** | In-process rate limiting | Distributed Redis token bucket rate limiting per user and per IP | Operates consistently across multiple container replicas and pods |
| **L5** | Monolithic frontend rendering | Per-route rendering: ISR for public pages, SSR for private dashboards | Maximizes edge CDN caching while preserving strict tenant isolation |
| **L6** | 3D graphics potentially blocking LCP/INP | Dynamic imports (`ssr: false`), CSS hardware acceleration, layout bounding boxes | Ensures Core Web Vitals targets: LCP $\le 2.5$s, INP $\le 200$ms, CLS $\le 0.1$ |
| **L7** | Application-level security headers | Vercel Edge Middleware header and CSP enforcement | Offloads header synthesis to the network edge, preserving worker CPU cycles |
| **L8** | No payload size or pagination limits | Edge WAF, 1 MB request body cap, query parameter bounds | Mitigates OWASP API4:2023 Unrestricted Resource Consumption |
| **L9** | Opaque cross-tier errors | Inbound `X-Request-ID` propagation edge $\rightarrow$ FastAPI $\rightarrow$ PostgreSQL logs | Enables fast root-cause isolation during latency or security incidents |
| **L10** | Manual security review | `pip-audit` and `npm audit` blocking gates in GitHub Actions CI | Prevents vulnerable libraries from entering production releases |
| **L11** | Unquantified performance claims | Standardized SLO tables for latency percentiles, error budgets, and uptime | Establishes enforceable, measurable production engineering standards |
| **L12** | Assumed load tolerance | Four-scenario k6 load suite (Baseline, Target, Spike, Soak) | Validates concurrency mathematically before public onboarding |
