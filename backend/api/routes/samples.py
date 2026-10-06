from fastapi import APIRouter, HTTPException
from backend.services.demo_seeds import get_all_samples, get_sample_by_id

router = APIRouter(prefix="/samples", tags=["Samples"])

@router.get("")
async def list_samples():
    """Returns curated golden demo samples for 1-click loading."""
    return get_all_samples()

@router.get("/{sample_id}")
async def get_sample(sample_id: str):
    """Fetches a specific golden sample by ID."""
    try:
        return get_sample_by_id(sample_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Sample not found")
