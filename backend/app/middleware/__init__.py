"""Middleware package."""

from fastapi import FastAPI

from app.core.config import settings
from app.middleware.cors import setup_cors
from app.middleware.error_handling import UnhandledExceptionMiddleware, internal_error_response
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_logging import RequestLoggingMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware


def configure_middleware(
    app: FastAPI,
    *,
    rate_limit_requests: int = settings.RATE_LIMIT_REQUESTS,
    rate_limit_window_seconds: int = settings.RATE_LIMIT_WINDOW_SECONDS,
) -> None:
    """Register the middleware stack in its required order.

    Starlette runs the most recently added middleware first, so the resulting
    request path is:

        RequestLogging → CORS → SecurityHeaders → RateLimit → UnhandledException → app

    * CORS sits outside rate limiting and error handling, so preflights are
      answered before they count against the rate limit, and 429/500 responses
      still carry CORS headers (otherwise browsers report a CORS failure).
    * Logging stays outermost so every response, including preflights, is logged.
    """
    app.add_middleware(UnhandledExceptionMiddleware)
    app.add_middleware(
        RateLimitMiddleware,
        max_requests=rate_limit_requests,
        window_seconds=rate_limit_window_seconds,
    )
    app.add_middleware(SecurityHeadersMiddleware)
    setup_cors(app)
    app.add_middleware(RequestLoggingMiddleware)


__all__ = [
    "configure_middleware",
    "internal_error_response",
    "setup_cors",
    "RateLimitMiddleware",
    "RequestLoggingMiddleware",
    "SecurityHeadersMiddleware",
    "UnhandledExceptionMiddleware",
]
