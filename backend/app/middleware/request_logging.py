"""Structured request and response logging middleware."""

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request

logger = logging.getLogger("promptfence.requests")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log incoming HTTP requests and responses with execution duration."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        start_time = time.monotonic()
        client_ip = request.client.host if request.client else "unknown"

        response = await call_next(request)

        duration_ms = (time.monotonic() - start_time) * 1000
        logger.info(
            "%s %s %d (%.2fms) [ip=%s]",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            client_ip,
        )

        return response

