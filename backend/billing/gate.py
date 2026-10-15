import logging
from typing import Optional
from fastapi import Header, HTTPException, status, Response, Request
from backend.billing.models import APIKeyInfo, PlanTier, OperationCost
from backend.billing.metering import metering_engine
from backend.billing.plans import AVAILABLE_PLANS

logger = logging.getLogger(__name__)

async def get_current_api_key(
    request: Request,
    response: Response,
    x_kaleido_api_key: Optional[str] = Header(None)
) -> APIKeyInfo:
    """
    Validates the caller API Key from the X-Kaleido-API-Key header.
    In demo/playground mode, falls back to the default verified demo key.
    Always injects X-Kaleido-Credits-Remaining & X-Kaleido-Plan-Tier response headers.
    """
    key_info: Optional[APIKeyInfo] = None

    if x_kaleido_api_key and x_kaleido_api_key.strip():
        key_info = await metering_engine.validate_raw_key(x_kaleido_api_key.strip())
        if not key_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked Kaleido API key. Please check your credentials in the API Key Manager."
            )

    if not key_info:
        # Graceful fallback to demo active key
        key_info = await metering_engine.get_default_key_info()

    # Stamp remaining quota into outgoing response headers
    response.headers["X-Kaleido-Credits-Remaining"] = str(key_info.credits_remaining)
    response.headers["X-Kaleido-Plan-Tier"] = key_info.tier.value
    response.headers["X-Kaleido-Org-Id"] = key_info.org_id

    # Check for hard credit exhaustion
    if key_info.credits_remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Monthly credit balance exhausted. Please top up credits or upgrade your plan."
        )

    return key_info

def verify_tier_permission(current_tier: PlanTier, required_tier: PlanTier) -> bool:
    """Checks hierarchy: free < starter < professional < enterprise."""
    hierarchy = [PlanTier.FREE, PlanTier.STARTER, PlanTier.PROFESSIONAL, PlanTier.ENTERPRISE]
    current_idx = hierarchy.index(current_tier)
    required_idx = hierarchy.index(required_tier)
    return current_idx >= required_idx
