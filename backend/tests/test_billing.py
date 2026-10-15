import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.core.database import init_database
from backend.billing.models import (
    PlanTier,
    ROICalculatorRequest
)
from backend.billing.metering import metering_engine
from backend.billing.sponsor_engine import sponsor_engine
from backend.billing.plans import AVAILABLE_PLANS

@pytest.fixture(autouse=True)
async def ensure_db_schema():
    await init_database()

@pytest.mark.asyncio
async def test_plans_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/billing/plans")
        assert resp.status_code == 200
        data = resp.json()
        assert "free" in data
        assert "starter" in data
        assert "professional" in data
        assert "enterprise" in data
        assert data["professional"]["price_monthly_usd"] == 99.0
        assert data["professional"]["monthly_credits"] == 10000

@pytest.mark.asyncio
async def test_roi_calculator_endpoint_and_math():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "articles_per_month": 50,
            "manual_cost_per_article": 150.0,
            "languages_count": 3,
            "formats_count": 4,
            "monthly_readers": 80000,
            "estimated_cpm": 15.0
        }
        resp = await client.post("/api/billing/roi-calculator", json=payload)
        assert resp.status_code == 200
        result = resp.json()
        assert result["manual_monthly_cost"] > result["kaleido_monthly_cost"]
        assert result["monthly_cost_savings"] > 0
        assert result["roi_percentage"] > 100
        assert result["estimated_sponsor_revenue_monthly"] > 0
        assert result["break_even_days"] <= 30

@pytest.mark.asyncio
async def test_api_key_lifecycle_and_metering():
    # 1. Create Key
    key = await metering_engine.create_api_key(
        org_id="test_org_unit",
        name="Automated Test Key",
        tier=PlanTier.STARTER
    )
    assert key.id.startswith("key_")
    assert key.credits_remaining == 1000
    assert key.full_key is not None

    # 2. Validate Key
    validated = await metering_engine.validate_raw_key(key.full_key)
    assert validated is not None
    assert validated.id == key.id

    # 3. Consume Credits
    success = await metering_engine.consume_credits(
        api_key_id=key.id,
        org_id="test_org_unit",
        operation="Test Run",
        credits=25,
        job_id="test_job_123"
    )
    assert success is True

    # 4. Check Updated Quota
    updated = await metering_engine.validate_raw_key(key.full_key)
    assert updated.credits_remaining == 975

    # 5. Revoke Key
    revoked = await metering_engine.revoke_api_key(key.id)
    assert revoked is True
    post_revoke = await metering_engine.validate_raw_key(key.full_key)
    assert post_revoke is None

@pytest.mark.asyncio
async def test_sponsor_campaigns_and_impressions():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Get active sponsors
        resp = await client.get("/api/billing/sponsors")
        assert resp.status_code == 200
        campaigns = resp.json()
        assert len(campaigns) > 0
        camp_id = campaigns[0]["id"]

        # Record impression
        imp_resp = await client.post("/api/billing/sponsors/impression", json={
            "campaign_id": camp_id,
            "job_id": "job_sample_test",
            "format_type": "story",
            "publisher_org_id": "demo_publisher_org"
        })
        assert imp_resp.status_code == 200
        assert imp_resp.json()["status"] == "success"

        # Check publisher earnings
        earn_resp = await client.get("/api/billing/sponsors/earnings")
        assert earn_resp.status_code == 200
        earnings = earn_resp.json()
        assert earnings["gross_ad_revenue_usd"] > 0
        assert earnings["publisher_share_usd"] > 0
