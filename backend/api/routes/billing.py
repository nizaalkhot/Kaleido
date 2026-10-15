from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.billing.models import (
    PlanTier,
    PlanDefinition,
    APIKeyInfo,
    CreateAPIKeyRequest,
    UsageSummary,
    CheckoutRequest,
    CreditTopupRequest,
    ROICalculatorRequest,
    ROICalculatorResponse,
    SponsorCampaignItem,
    SponsorImpressionRequest,
    SponsorEarningsSummary
)
from backend.billing.plans import AVAILABLE_PLANS
from backend.billing.metering import metering_engine
from backend.billing.sponsor_engine import sponsor_engine
from backend.billing.gate import get_current_api_key
from backend.core.database import get_db_connection

router = APIRouter(prefix="/billing", tags=["Billing & Monetization Engine"])

@router.get("/plans", response_model=Dict[str, PlanDefinition])
async def list_available_plans():
    """Returns available subscription tiers, pricing, credit limits, and feature gates."""
    return {tier.value: plan for tier, plan in AVAILABLE_PLANS.items()}

@router.get("/usage", response_model=UsageSummary)
async def get_usage_summary(key: APIKeyInfo = Depends(get_current_api_key)):
    """Returns credit balance, burn rate, and consumption breakdown for the organization."""
    return await metering_engine.get_usage_summary(key.org_id)

@router.get("/keys", response_model=List[APIKeyInfo])
async def list_api_keys(key: APIKeyInfo = Depends(get_current_api_key)):
    """Lists all active and revoked API keys for the current organization."""
    return await metering_engine.list_api_keys(key.org_id)

@router.post("/keys", response_model=APIKeyInfo)
async def create_api_key(
    req: CreateAPIKeyRequest,
    key: APIKeyInfo = Depends(get_current_api_key)
):
    """Generates a new secure API key with designated tier permissions."""
    return await metering_engine.create_api_key(
        org_id=key.org_id,
        name=req.name,
        tier=req.tier or key.tier
    )

@router.delete("/keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    key: APIKeyInfo = Depends(get_current_api_key)
):
    """Revokes an API key immediately, terminating access."""
    await metering_engine.revoke_api_key(key_id)
    return {"status": "success", "message": f"Key {key_id} successfully revoked"}

@router.post("/checkout")
async def process_checkout(
    req: CheckoutRequest,
    key: APIKeyInfo = Depends(get_current_api_key)
):
    """Processes plan subscription upgrade and allocates tier credits."""
    return await metering_engine.upgrade_plan(
        org_id=key.org_id,
        new_tier=req.plan_tier,
        billing_cycle=req.billing_cycle
    )

@router.post("/topup")
async def topup_credits(
    req: CreditTopupRequest,
    key: APIKeyInfo = Depends(get_current_api_key)
):
    """Adds on-demand credit bundle to account."""
    return await metering_engine.top_up_credits(
        org_id=key.org_id,
        credits=req.credits,
        cost_usd=req.cost_usd
    )

@router.post("/roi-calculator", response_model=ROICalculatorResponse)
async def calculate_roi(req: ROICalculatorRequest):
    """Calculates ROI comparing manual production costs vs Kaleido's invariant multi-format automation."""
    return metering_engine.calculate_roi(req)

@router.get("/sponsors", response_model=List[SponsorCampaignItem])
async def list_sponsor_campaigns():
    """Lists verified partner campaigns for dynamic sponsor card injection."""
    return await sponsor_engine.list_campaigns()

@router.post("/sponsors/impression")
async def record_sponsor_impression(
    req: SponsorImpressionRequest,
    key: APIKeyInfo = Depends(get_current_api_key)
):
    """Records an impression event and attributes revenue to the publisher (70% share)."""
    return await sponsor_engine.record_impression(
        campaign_id=req.campaign_id,
        job_id=req.job_id,
        format_type=req.format_type,
        publisher_org_id=key.org_id
    )

@router.get("/sponsors/earnings", response_model=SponsorEarningsSummary)
async def get_sponsor_earnings(key: APIKeyInfo = Depends(get_current_api_key)):
    """Returns publisher earnings from injected sponsor impressions."""
    return await sponsor_engine.get_earnings_summary(key.org_id)

# Embed Marketplace Endpoints
class EmbedDomainItem(BaseModel):
    id: str
    domain: str
    theme: str
    is_premium: bool
    impressions_total: int

class RegisterDomainRequest(BaseModel):
    domain: str
    theme: str = "dark"
    is_premium: bool = True

@router.get("/embed/domains", response_model=List[EmbedDomainItem])
async def list_embed_domains(key: APIKeyInfo = Depends(get_current_api_key)):
    """Lists authorized publisher domains allowed to embed the Kaleido player."""
    domains = []
    async with get_db_connection() as db:
        async with db.execute("""
            SELECT id, domain, theme, is_premium, impressions_total
            FROM embed_domains
            WHERE org_id = ?
        """, (key.org_id,)) as cur:
            rows = await cur.fetchall()
            for r in rows:
                domains.append(EmbedDomainItem(
                    id=r[0],
                    domain=r[1],
                    theme=r[2],
                    is_premium=bool(r[3]),
                    impressions_total=r[4]
                ))
    return domains

@router.post("/embed/domains", response_model=EmbedDomainItem)
async def register_embed_domain(
    req: RegisterDomainRequest,
    key: APIKeyInfo = Depends(get_current_api_key)
):
    """Registers a publisher domain for verified embedding."""
    import uuid
    dom_id = f"dom_{uuid.uuid4().hex[:8]}"
    async with get_db_connection() as db:
        await db.execute("""
            INSERT INTO embed_domains (id, org_id, domain, theme, is_premium, impressions_total)
            VALUES (?, ?, ?, ?, ?, 0)
        """, (dom_id, key.org_id, req.domain.lower().strip(), req.theme, 1 if req.is_premium else 0))
        await db.commit()

    return EmbedDomainItem(
        id=dom_id,
        domain=req.domain.lower().strip(),
        theme=req.theme,
        is_premium=req.is_premium,
        impressions_total=0
    )
