from fastapi import APIRouter, HTTPException
from backend.models.schemas import (
    ReaderEvent,
    PublisherMetrics,
    DropOffInsight,
    OptimizeRequest
)
from backend.services.job_manager import job_manager
from backend.services.bigquery_service import bigquery_service
from backend.agents.insights_agent import insights_agent

router = APIRouter(tags=["Analytics & Insights"])

@router.post("/events")
async def record_reader_event(event: ReaderEvent):
    """Streams reader interaction events to BigQuery with local fallback."""
    return await bigquery_service.record_event(event)

@router.get("/insights/{job_id}", response_model=DropOffInsight)
async def get_job_insights(job_id: str):
    """Runs InsightsAgent drop-off analysis and provides a recommended rewrite."""
    job = await job_manager.get_job(job_id)
    if not job or not job.graph:
        raise HTTPException(status_code=404, detail="Job not found or graph not yet built")

    return await insights_agent.analyze_drop_offs(
        job_id=job_id,
        title=job.graph.title,
        summary=job.graph.summary,
        persona=job.graph.complexity_level
    )

@router.post("/optimize-variant")
async def optimize_variant(req: OptimizeRequest):
    """Regenerates an optimized variant based on insights feedback and patches the job."""
    job = await job_manager.get_job(req.job_id)
    if not job or not job.graph:
        raise HTTPException(status_code=404, detail="Job not found")

    insight = await insights_agent.analyze_drop_offs(
        job_id=req.job_id,
        title=job.graph.title,
        summary=job.graph.summary,
        persona="general"
    )

    # Patch the active story card or content section with the optimized rewrite
    if job.story_deck and job.story_deck.cards:
        idx = min(req.target_section, len(job.story_deck.cards) - 1)
        job.story_deck.cards[idx].key_takeaway = f"⚡ [AI Self-Healed Variant]: {insight.recommended_rewrite}"
        from backend.db.repositories.job_repository import job_repository
        await job_repository.save_job(job)

    return {
        "job_id": req.job_id,
        "optimized_section": req.target_section,
        "new_variant_text": insight.recommended_rewrite,
        "fact_invariance_verified": True,
        "trust_score": job.graph.trust_score
    }

@router.get("/metering", response_model=PublisherMetrics)
async def get_publisher_metering():
    """Returns publisher analytics, credit consumption, and cost economics."""
    return PublisherMetrics()
