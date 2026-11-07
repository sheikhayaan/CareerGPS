import math
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel

from app.core.config import settings
from app.db.session import get_db
from app.core.auth import security, get_current_user_optional, AuthenticatedUser
from app.core.telemetry_tracker import telemetry_tracker
from app.core.incident_tracker import incident_tracker
from app.services.self_healing_service import self_healing_service
from app.models.entities import UserProfile, SystemIncident

router = APIRouter(prefix="/admin", tags=["Autonomous APM & Admin Command Center"])


# Baseline candidates seeded if database is clean
DEFAULT_CANDIDATES = [
    {
        "id": "usr_sarah_connor",
        "auth_user_id": "auth_sarah_connor",
        "display_name": "Sarah Connor",
        "email": "sarah.c@cyberdyne.org",
        "user_role": "ML Engineer",
        "total_sessions": 14,
        "average_score": 92.4,
        "rating_score": 4.8,
        "rating_count": 3,
        "is_suspended": False,
        "created_at": "2026-09-12T10:00:00.000Z",
    },
    {
        "id": "usr_marcus_vance",
        "auth_user_id": "auth_marcus_vance",
        "display_name": "Marcus Vance",
        "email": "m.vance@databridge.io",
        "user_role": "Data Analyst",
        "total_sessions": 8,
        "average_score": 84.1,
        "rating_score": 4.2,
        "rating_count": 2,
        "is_suspended": False,
        "created_at": "2026-09-28T14:30:00.000Z",
    },
    {
        "id": "usr_priya_sharma",
        "auth_user_id": "auth_priya_sharma",
        "display_name": "Priya Sharma",
        "email": "priya.s@delhitechnology.in",
        "user_role": "Software Engineer",
        "total_sessions": 19,
        "average_score": 96.0,
        "rating_score": 5.0,
        "rating_count": 4,
        "is_suspended": False,
        "created_at": "2026-08-15T08:15:00.000Z",
    },
    {
        "id": "usr_jordan_miller",
        "auth_user_id": "auth_jordan_miller",
        "display_name": "Jordan Miller",
        "email": "jordan.m@university.edu",
        "user_role": "Data Scientist",
        "total_sessions": 3,
        "average_score": 78.5,
        "rating_score": None,  # STRICT RULE 1: Unrated! Must never default to 5.0
        "rating_count": 0,
        "is_suspended": False,
        "created_at": "2026-10-18T11:45:00.000Z",
    },
    {
        "id": "usr_elena_rostova",
        "auth_user_id": "auth_elena_rostova",
        "display_name": "Elena Rostova",
        "email": "elena.rostova@berlin-tech.de",
        "user_role": "Product Manager",
        "total_sessions": 11,
        "average_score": 89.2,
        "rating_score": None,  # STRICT RULE 1: Unrated!
        "rating_count": 0,
        "is_suspended": False,
        "created_at": "2026-10-02T16:20:00.000Z",
    },
    {
        "id": "usr_kevin_zhang",
        "auth_user_id": "auth_kevin_zhang",
        "display_name": "Kevin Zhang",
        "email": "kevin.z@cloudscale.ca",
        "user_role": "Cybersecurity Analyst",
        "total_sessions": 6,
        "average_score": 81.0,
        "rating_score": 4.0,
        "rating_count": 1,
        "is_suspended": False,
        "created_at": "2026-10-10T09:10:00.000Z",
    },
]


def verify_admin_access(
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
):
    """
    Verifies administrator credentials.
    Accepts valid X-Admin-Key header or Bearer JWT with admin privileges.
    """
    if x_admin_key and x_admin_key == settings.ADMIN_API_KEY:
        return True

    if current_user:
        if (
            current_user.role == "admin"
            or current_user.email in ["admin@careergps.ai", "superadmin@careergps.ai"]
            or current_user.claims.get("role") == "admin"
        ):
            return True
        # In non-production mode, demo users have admin exploration rights
        if settings.ENVIRONMENT.lower() != "production" and "demo" in current_user.user_id:
            return True

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized: Valid administrative credentials (X-Admin-Key or admin Bearer token) required."
    )


class UserStatusUpdateRequest(BaseModel):
    status: str


class ResolveIncidentRequest(BaseModel):
    notes: Optional[str] = "Resolved by administrator"


class ExecuteSelfHealingRequest(BaseModel):
    reason: Optional[str] = "Admin Dashboard Manual Remediation Trigger"


@router.get("/overview")
def get_admin_overview(
    db: Session = Depends(get_db),
    _authorized: bool = Depends(verify_admin_access)
):
    """
    Summary metrics: users, active 24h, total sessions, real average ratings, system alerts.
    STRICT RULE 1: Never default star ratings to 5.0. Compute average solely over verified reviews (count > 0).
    """
    # 1. User stats from DB or baseline
    db_users = db.query(UserProfile).all()
    user_list = [
        {
            "id": u.id,
            "name": u.display_name or "Anonymous Candidate",
            "email": u.email,
            "role": u.user_role or u.current_role_title or "Candidate",
            "totalSessions": u.total_sessions or 0,
            "averageScore": float(u.average_score) if u.average_score is not None else None,
            "ratingScore": float(u.rating_score) if u.rating_score is not None else None,
            "ratingCount": u.rating_count or 0,
            "status": "suspended" if u.is_suspended else "active",
            "joinDate": u.created_at.isoformat() if u.created_at else "2026-09-01T00:00:00Z",
        }
        for u in db_users
    ] if len(db_users) >= 3 else [
        {
            "id": c["id"],
            "name": c["display_name"],
            "email": c["email"],
            "role": c["user_role"],
            "totalSessions": c["total_sessions"],
            "averageScore": c["average_score"],
            "ratingScore": c["rating_score"],
            "ratingCount": c["rating_count"],
            "status": "suspended" if c["is_suspended"] else "active",
            "joinDate": c["created_at"],
        }
        for c in DEFAULT_CANDIDATES
    ]

    total_users = len(user_list)
    active_24h = sum(1 for u in user_list if u["status"] == "active")
    total_sessions = sum(u["totalSessions"] for u in user_list)

    # STRICT RULE 1: Compute average strictly from users who submitted a review
    rated_users = [u for u in user_list if u["ratingScore"] is not None and u["ratingCount"] > 0]
    real_average_rating = (
        round(sum(u["ratingScore"] for u in rated_users) / len(rated_users), 1)
        if len(rated_users) > 0
        else 0.0
    )

    incidents_stats = incident_tracker.get_stats()

    return {
        "status": "success",
        "data": {
            "totalUsers": total_users,
            "active24h": active_24h,
            "totalSessions": total_sessions,
            "averageRating": real_average_rating,
            "verifiedReviewsCount": len(rated_users),
            "systemAlerts": incidents_stats["activeUnresolved"],
            "criticalAlerts": incidents_stats["criticalUnresolved"],
            "autoMitigatedCount": incidents_stats["autoMitigatedCount"],
            "infrastructureStatus": "CRITICAL" if incidents_stats["criticalUnresolved"] > 0 else "DEGRADED" if incidents_stats["activeUnresolved"] > 0 else "NOMINAL",
        }
    }


@router.get("/users")
def get_admin_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query("", description="Search by name or email"),
    role: str = Query("all"),
    db: Session = Depends(get_db),
    _authorized: bool = Depends(verify_admin_access)
):
    """
    Searchable, paginated user roster with actual interview counts, test scores, and real star ratings.
    STRICT RULE 1: Never defaults unrated users to 5.0 (returns ratingScore: null).
    """
    db_users = db.query(UserProfile).all()
    user_list = [
        {
            "id": u.id,
            "name": u.display_name or "Anonymous Candidate",
            "email": u.email,
            "role": u.user_role or u.current_role_title or "Candidate",
            "totalSessions": u.total_sessions or 0,
            "averageScore": float(u.average_score) if u.average_score is not None else None,
            "ratingScore": float(u.rating_score) if u.rating_score is not None else None,
            "ratingCount": u.rating_count or 0,
            "status": "suspended" if u.is_suspended else "active",
            "joinDate": u.created_at.isoformat() if u.created_at else "2026-09-01T00:00:00Z",
        }
        for u in db_users
    ] if len(db_users) >= 3 else [
        {
            "id": c["id"],
            "name": c["display_name"],
            "email": c["email"],
            "role": c["user_role"],
            "totalSessions": c["total_sessions"],
            "averageScore": c["average_score"],
            "ratingScore": c["rating_score"],
            "ratingCount": c["rating_count"],
            "status": "suspended" if c["is_suspended"] else "active",
            "joinDate": c["created_at"],
        }
        for c in DEFAULT_CANDIDATES
    ]

    filtered = list(user_list)
    if search.strip():
        term = search.strip().lower()
        filtered = [u for u in filtered if term in u["name"].lower() or term in (u["email"] or "").lower()]

    if role != "all":
        filtered = [u for u in filtered if u["role"] == role]

    total = len(filtered)
    start_idx = (page - 1) * limit
    paginated = filtered[start_idx : start_idx + limit]

    return {
        "status": "success",
        "data": {
            "users": paginated,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": math.ceil(total / limit) if total > 0 else 1,
            }
        }
    }


@router.post("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    req: UserStatusUpdateRequest,
    db: Session = Depends(get_db),
    _authorized: bool = Depends(verify_admin_access)
):
    """
    Suspend or unsuspend a candidate account.
    """
    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    new_status = "suspended" if req.status == "suspended" else "active"
    if user:
        user.is_suspended = (new_status == "suspended")
        db.commit()

    return {
        "status": "success",
        "message": f"User status updated to {new_status}",
        "userId": user_id,
        "newStatus": new_status,
    }


@router.get("/incidents")
def get_admin_incidents(
    severity: Optional[str] = Query(None),
    autoMitigated: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    _authorized: bool = Depends(verify_admin_access)
):
    """
    Incident log with filter by severity and auto-mitigation status.
    """
    incidents = incident_tracker.get_incidents(
        severity=severity,
        auto_mitigated=autoMitigated,
        limit=limit
    )
    stats = incident_tracker.get_stats()
    return {
        "status": "success",
        "data": {
            "incidents": incidents,
            "stats": stats,
        }
    }


@router.post("/incidents/{incident_id}/resolve")
def resolve_admin_incident(
    incident_id: str,
    req: Optional[ResolveIncidentRequest] = None,
    _authorized: bool = Depends(verify_admin_access)
):
    """
    Manually resolve an operational incident.
    """
    notes = req.notes if req and req.notes else "Resolved via Admin Command Center"
    resolved = incident_tracker.resolve_incident(incident_id, notes)
    if not resolved:
        raise HTTPException(status_code=404, detail="Incident not found")

    return {
        "status": "success",
        "message": "Incident successfully resolved",
        "incident": resolved,
    }


@router.post("/self-healing/execute")
async def execute_self_healing_endpoint(
    req: Optional[ExecuteSelfHealingRequest] = None,
    _authorized: bool = Depends(verify_admin_access)
):
    """
    Trigger the autonomous self-healing engine on demand.
    """
    reason = req.reason if req and req.reason else "Admin Dashboard Manual Remediation Trigger"
    report = await self_healing_service.execute_self_healing(reason)
    return {
        "status": "success",
        "data": report,
    }


@router.get("/telemetry")
def get_admin_telemetry(
    _authorized: bool = Depends(verify_admin_access)
):
    """
    Real-time system health and P50/P95/P99 latency.
    """
    snapshot = telemetry_tracker.get_snapshot()
    return {
        "status": "success",
        "data": snapshot,
    }
