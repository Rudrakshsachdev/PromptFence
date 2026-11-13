"""Aggregated API v1 router."""

from fastapi import APIRouter

from app.api.v1.auth.router import router as auth_router
from app.api.v1.dashboard.router import router as dashboard_router
from app.api.v1.scenarios.router import router as scenarios_router
from app.api.v1.targets.router import router as targets_router
from app.api.v1.test_suites.router import router as test_suites_router
from app.api.v1.users.router import router as users_router
from app.api.v1.test_runs.router import router as test_runs_router
from app.api.v1.findings.router import router as findings_router
from app.api.v1.adapters.router import router as adapters_router

v1_router = APIRouter(prefix="/v1")

v1_router.include_router(auth_router)
v1_router.include_router(users_router)
v1_router.include_router(targets_router)
v1_router.include_router(test_suites_router)
v1_router.include_router(scenarios_router)
v1_router.include_router(dashboard_router)
v1_router.include_router(test_runs_router)
v1_router.include_router(findings_router)
v1_router.include_router(adapters_router)

