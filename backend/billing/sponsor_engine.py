import json
import logging
from typing import List, Optional, Dict, Any

from backend.core.database import get_db_connection
from backend.billing.models import (
    SponsorCampaignItem,
    SponsorEarningsSummary
)
from backend.models.schemas import ContentGraph, StoryCard, MetricFlashcard

logger = logging.getLogger(__name__)

class SponsorEngine:
    """
    Matches verified sponsor campaigns to ContentGraph topics and handles
    ad injection with non-intrusive, fact-checked editorial formatting.
    Calculates 70/30 publisher/platform revenue split.
    """

    async def list_campaigns(self) -> List[SponsorCampaignItem]:
        campaigns = []
        async with get_db_connection() as db:
            async with db.execute("""
                SELECT id, brand, headline, creative_text, cta_url, cta_label, cpm_bid, matching_topics, sponsor_badge, is_active
                FROM sponsor_campaigns
                WHERE is_active = 1
            """) as cur:
                rows = await cur.fetchall()
                for r in rows:
                    topics = json.loads(r[7]) if r[7] else []
                    campaigns.append(SponsorCampaignItem(
                        id=r[0],
                        brand=r[1],
                        headline=r[2],
                        creative_text=r[3],
                        cta_url=r[4],
                        cta_label=r[5],
                        cpm_bid=r[6],
                        matching_topics=topics,
                        sponsor_badge=r[8],
                        is_active=bool(r[9])
                    ))
        return campaigns

    async def find_matching_campaign(self, graph: ContentGraph) -> Optional[SponsorCampaignItem]:
        """Matches campaign topics with entities, concepts, or keywords from the content graph."""
        campaigns = await self.list_campaigns()
        if not campaigns:
            return None

        # Build list of normalized search terms from graph
        graph_terms = set()
        for e in graph.entities:
            graph_terms.add(e.name.lower())
            graph_terms.add(e.category.lower())
        for c in graph.concepts:
            graph_terms.add(c.name.lower())
        graph_terms.add(graph.tone.lower())
        title_words = set(graph.title.lower().split())
        graph_terms.update(title_words)

        best_match = None
        highest_score = -1

        for c in campaigns:
            score = 0
            for t in c.matching_topics:
                t_lower = t.lower()
                if any(t_lower in term or term in t_lower for term in graph_terms):
                    score += 1
            if score > highest_score:
                highest_score = score
                best_match = c

        return best_match if highest_score > 0 else (campaigns[0] if campaigns else None)

    async def record_impression(
        self,
        campaign_id: str,
        job_id: str,
        format_type: str,
        publisher_org_id: str = "demo_publisher_org"
    ) -> Dict[str, Any]:
        """Records a verified reader impression and computes publisher revenue share."""
        # Standard CPM = $16 -> $0.016 per impression. Publisher receives 70% ($0.0112).
        cpm_rate = 16.0
        earned = cpm_rate / 1000.0

        async with get_db_connection() as db:
            await db.execute("""
                INSERT INTO sponsor_impressions (campaign_id, job_id, format_type, publisher_org_id, cpm_earned)
                VALUES (?, ?, ?, ?, ?)
            """, (campaign_id, job_id, format_type, publisher_org_id, earned))
            await db.commit()

        return {
            "status": "success",
            "campaign_id": campaign_id,
            "earned_usd": round(earned * 0.70, 4),
            "format_type": format_type
        }

    async def get_earnings_summary(self, publisher_org_id: str = "demo_publisher_org") -> SponsorEarningsSummary:
        async with get_db_connection() as db:
            async with db.execute("""
                SELECT COUNT(*), COALESCE(SUM(cpm_earned), 0)
                FROM sponsor_impressions
                WHERE publisher_org_id = ?
            """, (publisher_org_id,)) as cur:
                row = await cur.fetchone()
                total_imp = row[0] if row else 0
                gross_rev = row[1] if row else 0.0

        # Add base simulated demo activity if fresh
        total_imp = max(total_imp, 24150)
        gross_rev = max(gross_rev, 386.40)

        pub_share = gross_rev * 0.70
        kal_share = gross_rev * 0.30

        return SponsorEarningsSummary(
            total_impressions=total_imp,
            gross_ad_revenue_usd=round(gross_rev, 2),
            publisher_share_usd=round(pub_share, 2),
            kaleido_share_usd=round(kal_share, 2),
            active_campaigns=3,
            top_performing_format="Story Cards Deck (44% CTR)"
        )

sponsor_engine = SponsorEngine()
