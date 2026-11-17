"""CORS middleware configuration."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

# Accept, Accept-Language, Content-Language and Content-Type are CORS-safelisted
# and always allowed by Starlette; they are listed for clarity. The frontend
# itself only sends Content-Type (auth travels in HttpOnly cookies).
ALLOWED_HEADERS = [
    "Accept",
    "Accept-Language",
    "Content-Language",
    "Content-Type",
    "Authorization",
    "X-Requested-With",
]


def setup_cors(app: FastAPI) -> None:
    """Register CORSMiddleware with the environment's explicit origin allow-list.

    Credentials are enabled because authentication uses HttpOnly cookies, so
    origins must be explicit (config validation rejects wildcards). Preflights
    from origins outside the list are answered with 400 and no
    Access-Control-Allow-Origin header, so browsers block them.
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=True,
        allow_methods=ALLOWED_METHODS,
        allow_headers=ALLOWED_HEADERS,
        expose_headers=["Content-Length", "X-Request-ID"],
    )
