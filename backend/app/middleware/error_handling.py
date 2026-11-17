"""Convert unexpected exceptions into the standard JSON 500 inside the middleware stack."""

import logging

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

logger = logging.getLogger("promptfence")


def internal_error_response() -> JSONResponse:
    """Generic 500 body: never exposes exception details or stack traces."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred.",
            "code": "INTERNAL_SERVER_ERROR",
        },
    )


class UnhandledExceptionMiddleware:
    """Answer unhandled exceptions with the JSON 500 from *within* the CORS layer.

    Starlette routes ``Exception`` handlers to ServerErrorMiddleware, the
    outermost layer, so their responses bypass CORSMiddleware. Browsers then
    report a misleading CORS error instead of the server error. Registered
    inside CORS, this middleware lets the 500 receive the normal CORS headers.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        response_started = False

        async def send_wrapper(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception:
            if response_started:
                # Headers already sent; nothing safe to replace them with.
                raise
            logger.exception("Unhandled exception: %s %s", scope.get("method"), scope.get("path"))
            await internal_error_response()(scope, receive, send)
