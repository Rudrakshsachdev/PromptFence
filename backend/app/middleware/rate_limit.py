"""In-memory rate limiting middleware."""

import time
from collections import defaultdict

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple sliding-window rate limiter per client IP."""

    def __init__(self, app, max_requests: int = 120, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests_log: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        # Exempt health check and docs from rate limiting
        path = request.url.path
        if path in ("/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Clean old timestamps
        timestamps = self.requests_log[client_ip]
        cutoff = now - self.window_seconds
        valid_timestamps = [t for t in timestamps if t > cutoff]
        self.requests_log[client_ip] = valid_timestamps

        if len(valid_timestamps) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please slow down and try again.",
                    "code": "RATE_LIMIT_EXCEEDED",
                },
                headers={"Retry-After": str(self.window_seconds)},
            )

        self.requests_log[client_ip].append(now)
        return await call_next(request)

