from fastapi import APIRouter
from backend.core import config

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """Returns engine health, project context, and model configurations."""
    return {
        "status": "healthy",
        "engine": "Kaleido ADK",
        "project": config.GCP_PROJECT_ID,
        "location": config.GCP_LOCATION,
        "models": {
            "flash": config.GEMINI_FLASH_MODEL,
            "pro": config.GEMINI_PRO_MODEL
        }
    }
