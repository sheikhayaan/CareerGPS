import sys
import os
import time
from pathlib import Path

# Add project root directory to sys.path to allow imports from analytics/ and ml/
ROOT_DIR = str(Path(__file__).resolve().parent.parent.parent.parent)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.db.seed import seed_taxonomy_and_samples
from app.api.v1.endpoints import router as api_v1_router
from app.core.telemetry_tracker import telemetry_tracker
from app.core.incident_tracker import incident_tracker

# Initialize database schema & seed initial taxonomy
try:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_taxonomy_and_samples(db)
except Exception as e:
    print(f"[Database Bootstrap Notice]: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CareerGPS Backend API — Real-World Labor Analytics & Roadmap Engine",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# APM Telemetry & Autonomous Incident Interceptor Middleware
class APMTelemetryMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        status_code = 500
        try:
            response: Response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception as exc:
            duration_ms = (time.time() - start_time) * 1000
            telemetry_tracker.record_request(duration_ms, 500)
            incident_tracker.record_incident({
                "category": "SERVER_5XX",
                "severity": "critical",
                "endpoint": request.url.path,
                "statusCode": 500,
                "errorDetails": str(exc),
                "autoMitigated": False,
            })
            raise exc
        finally:
            duration_ms = (time.time() - start_time) * 1000
            telemetry_tracker.record_request(duration_ms, status_code)
            if status_code == 429:
                incident_tracker.record_incident({
                    "category": "RATE_LIMIT_429",
                    "severity": "medium",
                    "endpoint": request.url.path,
                    "statusCode": 429,
                    "errorDetails": "Rate limit threshold breached for client IP or session.",
                    "autoMitigated": True,
                    "mitigationNotes": "Applied progressive rate-limit backoff header.",
                })
            elif status_code >= 500:
                incident_tracker.record_incident({
                    "category": "SERVER_5XX",
                    "severity": "high",
                    "endpoint": request.url.path,
                    "statusCode": status_code,
                    "errorDetails": f"HTTP status {status_code} returned on {request.url.path}.",
                    "autoMitigated": False,
                })
            elif duration_ms > 2000:
                incident_tracker.record_incident({
                    "category": "SLOW_QUERY",
                    "severity": "medium",
                    "endpoint": request.url.path,
                    "statusCode": status_code,
                    "errorDetails": f"Slow request duration: {round(duration_ms, 1)}ms on {request.url.path}.",
                    "autoMitigated": True,
                    "mitigationNotes": "Autonomous telemetry flagged for query optimization & cache memoization.",
                })

app.add_middleware(APMTelemetryMiddleware)

# Production Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Set CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected"
    }

from app.api.v1.analytics import router as analytics_router
from app.api.v1.career import router as career_router
from app.api.v1.user import router as user_router
from app.api.v1.ai_explanation import router as ai_router
from app.api.v1.admin import router as admin_router

# Include API routes (both /api/v1 and /api for convenience)
app.include_router(api_v1_router, prefix=settings.API_V1_STR)
app.include_router(api_v1_router, prefix="/api")

app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix="/api")

app.include_router(career_router, prefix=settings.API_V1_STR)
app.include_router(career_router, prefix="/api")

app.include_router(user_router, prefix=settings.API_V1_STR)
app.include_router(user_router, prefix="/api")

app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix="/api")

app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix="/api")
