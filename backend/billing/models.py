from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime

class PlanTier(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"

class OperationCost(int, Enum):
    GRAPH_BUILD = 1
    TRUST_CRITIC = 2
    AUDIO_BRIEF = 5
    QUIZ_GEN = 2
    STORY_DECK = 2
    EXECUTIVE_BRIEF = 3
    FULL_PIPELINE = 10
    GROUNDED_CHAT = 1
    SELF_HEAL_OPTIMIZE = 3

class PlanDefinition(BaseModel):
    id: PlanTier
    name: str
    price_monthly_usd: float
    price_annual_usd: float
    monthly_credits: int
    features: List[str]
    max_languages: int
    supported_formats: List[str]
    has_self_healing: bool
    has_voice_assistant: bool
    has_sponsor_rev_share: bool
    rev_share_pct: float
    support_level: str

class APIKeyInfo(BaseModel):
    id: str
    org_id: str
    key_prefix: str
    name: str
    tier: PlanTier
    credits_remaining: int
    credits_total: int
    rate_limit_rpm: int
    is_active: bool
    created_at: str
    full_key: Optional[str] = None

class CreateAPIKeyRequest(BaseModel):
    name: str
    org_id: Optional[str] = "demo_publisher_org"
    tier: Optional[PlanTier] = PlanTier.STARTER

class UsageSummary(BaseModel):
    org_id: str
    tier: PlanTier
    credits_total: int
    credits_remaining: int
    credits_consumed: int
    burn_rate_daily: float
    estimated_depletion_days: int
    operation_breakdown: Dict[str, int]
    recent_transactions: List[Dict[str, Any]]

class CheckoutRequest(BaseModel):
    plan_tier: PlanTier
    billing_cycle: str = "monthly" # monthly or annual
    org_id: Optional[str] = "demo_publisher_org"

class CreditTopupRequest(BaseModel):
    credits: int
    cost_usd: float
    org_id: Optional[str] = "demo_publisher_org"

class ROICalculatorRequest(BaseModel):
    articles_per_month: int = Field(default=40, ge=1, le=10000)
    manual_cost_per_article: float = Field(default=120.0, ge=10.0, le=2000.0)
    languages_count: int = Field(default=3, ge=1, le=10)
    formats_count: int = Field(default=4, ge=1, le=4)
    monthly_readers: int = Field(default=50000, ge=100)
    estimated_cpm: float = Field(default=14.0, ge=1.0, le=100.0)

class ROICalculatorResponse(BaseModel):
    articles_per_month: int
    manual_monthly_cost: float
    kaleido_monthly_cost: float
    monthly_cost_savings: float
    annual_cost_savings: float
    time_saved_hours_monthly: float
    estimated_sponsor_revenue_monthly: float
    net_monthly_gain: float
    roi_percentage: float
    break_even_days: int

class SponsorCampaignItem(BaseModel):
    id: str
    brand: str
    headline: str
    creative_text: str
    cta_url: str
    cta_label: str
    cpm_bid: float
    matching_topics: List[str]
    sponsor_badge: str = "Verified Partner"
    is_active: bool = True

class SponsorImpressionRequest(BaseModel):
    campaign_id: str
    job_id: str
    format_type: str # audio, story, quiz, brief
    publisher_org_id: Optional[str] = "demo_publisher_org"

class SponsorEarningsSummary(BaseModel):
    total_impressions: int
    gross_ad_revenue_usd: float
    publisher_share_usd: float # 70%
    kaleido_share_usd: float # 30%
    active_campaigns: int
    top_performing_format: str
