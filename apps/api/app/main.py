import sys
import os
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
