"""PromptFence FastAPI main application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.v1.router import v1_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.exceptions import AppError
from app.core.logging import setup_logging
from app.middleware import configure_middleware, internal_error_response

# Initialize structured logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup and shutdown hooks."""
    # In development/test with SQLite or local, create tables if needed
    if settings.is_development or settings.is_testing:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="PromptFence - Provenance-Aware Adversarial Security-Testing Lab for AI Applications",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Middlewares (order matters, see configure_middleware)
configure_middleware(app)


# Global Exception Handler for custom application errors
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.message,
            "code": type(exc).__name__,
        },
    )


# Last-resort handler for exceptions raised outside UnhandledExceptionMiddleware
# (i.e. in the outer middleware layers). Route errors are handled there instead,
# so they keep their CORS headers.
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    import logging
    logging.getLogger("promptfence").exception("Unhandled exception: %s", exc)
    return internal_error_response()


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health status endpoint for load balancers and container orchestrators."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
    }


# Mount API routers
app.include_router(v1_router, prefix="/api")

