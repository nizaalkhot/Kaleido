from fastapi import APIRouter
from backend.api.routes.health import router as health_router
from backend.api.routes.samples import router as samples_router
from backend.api.routes.content import router as content_router
from backend.api.routes.analytics import router as analytics_router

api_router = APIRouter(prefix="/api")

api_router.include_router(health_router)
api_router.include_router(samples_router)
api_router.include_router(content_router)
api_router.include_router(analytics_router)
