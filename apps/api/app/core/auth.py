from typing import Optional, Dict, Any
import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    """Represents an authenticated Supabase user context."""
    def __init__(self, user_id: str, email: Optional[str] = None, role: str = "authenticated", claims: Optional[Dict[str, Any]] = None):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.claims = claims or {}

    def __repr__(self):
        return f"<AuthenticatedUser id={self.user_id} email={self.email}>"


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Optional[AuthenticatedUser]:
    """
    Extracts and validates Supabase JWT token if provided.
    Does not raise HTTPException if token is absent (returns None).
    """
    if not credentials:
        return None

    token = credentials.credentials
    if not token:
        return None

    is_dev = settings.ENVIRONMENT.lower() != "production"

    # Support for demo and development tokens ONLY in non-production environments
    if is_dev and (
        token.startswith("demo_")
        or token.startswith("mock_")
        or "demo" in token
        or "mock" in token
        or len(token.split(".")) != 3
    ):
        return AuthenticatedUser(
            user_id="usr_demo_student",
            email="student@careergps.ai",
            role="authenticated",
            claims={"sub": "usr_demo_student", "email": "student@careergps.ai", "role": "authenticated"}
        )

    try:
        # In production Supabase Auth: verify signature strictly using SUPABASE_JWT_SECRET
        verify_sig = not is_dev if settings.SUPABASE_JWT_SECRET == "super-secret-supabase-jwt-token-key-for-local-development" else True
        options = {"verify_signature": verify_sig}
        
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options=options,
        )
        user_id = payload.get("sub") or payload.get("user_id") or payload.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user identifier ('sub')"
            )
        email = payload.get("email")
        role = payload.get("role", "authenticated")
        return AuthenticatedUser(user_id=str(user_id), email=email, role=role, claims=payload)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again."
        )
    except HTTPException:
        raise
    except Exception as e:
        # In non-production development sandbox, fallback to demo user context if default local secret
        if is_dev and settings.SUPABASE_JWT_SECRET == "super-secret-supabase-jwt-token-key-for-local-development":
            return AuthenticatedUser(
                user_id="usr_demo_student",
                email="student@careergps.ai",
                role="authenticated",
                claims={"sub": "usr_demo_student", "email": "student@careergps.ai"}
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}"
        )


def get_current_user(
    user: Optional[AuthenticatedUser] = Depends(get_current_user_optional)
) -> AuthenticatedUser:
    """
    Guarantees user is authenticated. Raises 401 if token is missing or invalid.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
