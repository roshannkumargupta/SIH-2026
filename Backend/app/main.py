import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.core.database import SessionLocal, init_db
from app.routers.api import api_router
from app.services.schedular_service import (
    start_scheduler,
    stop_scheduler,
)

logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
    except Exception as exc:
        logger.warning(f"Database auto-init note: {exc}")
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="SmritiSetu API",
    description=(
        "Backend API for the SmritiSetu platform "
        "for elderly cognitive assistance, games tracking, "
        "medication schedules, and AI assessment."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import IntegrityError

# ==========================================
# Centralized Standardized Error Handlers
# ==========================================

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": str(exc.detail),
            "errorCode": f"HTTP_{exc.status_code}",
            "details": None,
        },
    )


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    logger.warning(f"Database integrity conflict on {request.method} {request.url.path}: {exc}")
    error_msg = "Database conflict: a record with the same details already exists."
    if "UNIQUE constraint failed" in str(exc):
        error_msg = "A record with this information already exists."
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "success": False,
            "message": error_msg,
            "errorCode": "INTEGRITY_CONFLICT",
            "details": None,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = []
    messages = []
    for err in exc.errors():
        loc_parts = [str(loc) for loc in err.get("loc", []) if str(loc) not in ("body", "query", "path")]
        field = " -> ".join(loc_parts) if loc_parts else "request"
        msg = err.get("msg", "Invalid value")
        error_details.append({
            "field": field,
            "message": msg,
            "type": err.get("type"),
        })
        messages.append(f"{field.capitalize()}: {msg}" if field != "request" else msg)

    summary_message = "; ".join(messages) if messages else "Request validation failed"

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": summary_message,
            "errorCode": "VALIDATION_ERROR",
            "details": error_details,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal server error. Please try again later.",
            "errorCode": "INTERNAL_SERVER_ERROR",
            "details": None,
        },
    )


# ==========================================
# Merged Central Router Registration
# ==========================================

app.include_router(api_router)


@app.get("/health", tags=["System"])
def root_health():
    return {
        "success": True,
        "message": "SmritiSetu backend is running",
        "api_v1": "/api/v1",
        "docs": "/docs",
    }