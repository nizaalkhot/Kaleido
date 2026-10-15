from typing import Dict
from backend.billing.models import PlanTier, PlanDefinition

AVAILABLE_PLANS: Dict[PlanTier, PlanDefinition] = {
    PlanTier.FREE: PlanDefinition(
        id=PlanTier.FREE,
        name="Free Explorer",
        price_monthly_usd=0.0,
        price_annual_usd=0.0,
        monthly_credits=50,
        features=[
            "50 Monthly Credits (~5 Full Pipeline Runs)",
            "Text Ingest Only",
            "Audio Briefing & Basic Story Deck",
            "English Language Only",
            "Community Support",
            "Standard Invariance Check"
        ],
        max_languages=1,
        supported_formats=["audio", "story"],
        has_self_healing=False,
        has_voice_assistant=False,
        has_sponsor_rev_share=False,
        rev_share_pct=0.0,
        support_level="Community"
    ),
    PlanTier.STARTER: PlanDefinition(
        id=PlanTier.STARTER,
        name="Starter Publisher",
        price_monthly_usd=19.0,
        price_annual_usd=190.0, # 2 months free ($15.83/mo)
        monthly_credits=1000,
        features=[
            "1,000 Monthly Credits (~100 Full Pipeline Runs)",
            "Text & URL Ingestion (SSRF Guarded)",
            "All 4 Formats (Audio, Quiz, Story, Exec Brief)",
            "3 Languages (English, Hindi, Marathi)",
            "Voice-Enabled Grounded Chat",
            "Basic Audience Insights Heatmap",
            "Standard Support"
        ],
        max_languages=3,
        supported_formats=["audio", "quiz", "story", "brief"],
        has_self_healing=False,
        has_voice_assistant=True,
        has_sponsor_rev_share=False,
        rev_share_pct=0.0,
        support_level="Email"
    ),
    PlanTier.PROFESSIONAL: PlanDefinition(
        id=PlanTier.PROFESSIONAL,
        name="Professional Media Room",
        price_monthly_usd=99.0,
        price_annual_usd=950.0,
        monthly_credits=10000,
        features=[
            "10,000 Monthly Credits (~1,000 Full Pipeline Runs)",
            "All Ingest Modalities (Text, Web URL, PDF Parser)",
            "All 7 Vernacular Languages + Code-Mixed Hinglish",
            "Full Multi-Format Studio 2.0 with Export Hub",
            "Live Self-Healing Variant Regeneration",
            "Verified Publisher Embed Widget with Custom Themes",
            "Dynamic Sponsor Ad Revenue Share (70% Publisher / 30% Platform)",
            "Priority Support (4-hour SLA)"
        ],
        max_languages=7,
        supported_formats=["audio", "quiz", "story", "brief"],
        has_self_healing=True,
        has_voice_assistant=True,
        has_sponsor_rev_share=True,
        rev_share_pct=70.0,
        support_level="Priority"
    ),
    PlanTier.ENTERPRISE: PlanDefinition(
        id=PlanTier.ENTERPRISE,
        name="Enterprise & Broadcast",
        price_monthly_usd=499.0,
        price_annual_usd=4790.0,
        monthly_credits=100000,
        features=[
            "100,000 Monthly Credits (~10,000 Full Pipeline Runs)",
            "Unlimited Concurrency & Batch Ingestion",
            "White-Label Embed Widget (Zero Kaleido branding)",
            "80% Publisher Ad Revenue Share on Injected Sponsors",
            "LTI 1.3 LMS & SCORM 2004 Courseware Export",
            "Dedicated BigQuery Custom Schema Streaming",
            "Audience Clustering & Predictive Engagement AI",
            "Dedicated Account Manager & 99.9% Uptime SLA"
        ],
        max_languages=10,
        supported_formats=["audio", "quiz", "story", "brief"],
        has_self_healing=True,
        has_voice_assistant=True,
        has_sponsor_rev_share=True,
        rev_share_pct=80.0,
        support_level="Dedicated CSM"
    )
}
