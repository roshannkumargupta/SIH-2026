"""
Central Merged API Router for SmritiSetu (NER-MemoryCare)
Combines and mounts all 14 domain sub-routers under the `/api/v1` namespace.
"""

from datetime import datetime, timezone
from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import SessionLocal
from app.routers.analytics import router as analytics_router
from app.routers.appointments import router as appointments_router
from app.routers.auth import router as auth_router
from app.routers.caretakers import router as caretakers_router
from app.routers.doctors import router as doctors_router
from app.routers.games import router as games_router
from app.routers.hydration import router as hydration_router
from app.routers.medications import router as medications_router
from app.routers.memories import router as memories_router
from app.routers.mood import router as mood_router
from app.routers.notification import router as notifications_router
from app.routers.patients import router as patients_router
from app.routers.prescriptions import router as prescriptions_router
from app.routers.relationships import router as relationships_router
from app.routers.sync import router as sync_router
from app.routers.tasks import router as tasks_router
from app.routers.translation import router as translation_router
from app.routers.voice import router as voice_router
from app.routers.websocket import router as ws_router

api_router = APIRouter(prefix="/api/v1")

# Sub-routers merged into the centralized v1 router
api_router.include_router(ws_router)
api_router.include_router(auth_router)
api_router.include_router(relationships_router)
api_router.include_router(doctors_router)
api_router.include_router(caretakers_router)
api_router.include_router(patients_router)
api_router.include_router(prescriptions_router)
api_router.include_router(medications_router)
api_router.include_router(hydration_router)
api_router.include_router(appointments_router)
api_router.include_router(mood_router)
api_router.include_router(notifications_router)
api_router.include_router(tasks_router)
api_router.include_router(memories_router)
api_router.include_router(games_router)
api_router.include_router(analytics_router)
api_router.include_router(voice_router)
api_router.include_router(translation_router)
api_router.include_router(sync_router)


@api_router.get("/health", tags=["System"])
def api_health():
    """System health check verifying database and service readiness."""
    db_status = "connected"
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
    except Exception as exc:
        db_status = f"unreachable ({type(exc).__name__})"

    return {
        "success": True,
        "message": "SmritiSetu backend is running",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }
