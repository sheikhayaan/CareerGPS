from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "CareerGPS API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"  # "development", "staging", "production"
    
    # Database config (Defaults to project careergps.db for rapid local verification)
    DATABASE_URL: str = "sqlite:///" + str(Path(__file__).resolve().parent.parent.parent / "careergps.db").replace("\\", "/")
    
    # High-concurrency connection pooling (Applied when connected to PostgreSQL / PgBouncer)
    DATABASE_POOL_SIZE: int = 30
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 1800
    
    # Redis configuration for multi-tier response caching & rate limiting
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://careergps.vercel.app",
    ]
    
    # Adzuna API credentials (Optional in local mode)
    ADZUNA_APP_ID: str = ""
    ADZUNA_APP_KEY: str = ""
    
    # Supabase Auth Configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = "super-secret-supabase-jwt-token-key-for-local-development"
    
    # PostHog Analytics Configuration
    POSTHOG_API_KEY: str = ""
    POSTHOG_HOST: str = "https://app.posthog.com"
    
    # Admin API Key for internal product analytics
    ADMIN_API_KEY: str = "careergps-internal-admin-sec-key-2026"
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
